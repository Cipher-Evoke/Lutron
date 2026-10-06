import argparse
import re
import sys
from collections import Counter, deque
from datetime import datetime

TIMESTAMP_RE = re.compile(r'^\[(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})\]')
QUEUEPOOL_RE = re.compile(r'QueuePool limit of size (\d+) overflow (\d+) reached.*timeout ([0-9.]+)')
EXC_HANDLER_RE = re.compile(r'Exception in handle_loadcontroller_status', re.IGNORECASE)
STALE_LOCK_RE = re.compile(r'Stale lock file', re.IGNORECASE)
STARTED_SERVER_RE = re.compile(r'Started server process \[(\d+)\]')
STARTUP_PROC_RE = re.compile(r'\[Startup\].*process', re.IGNORECASE)
MONITOR_TASKS_RE = re.compile(r'Started (\d+) monitoring tasks', re.IGNORECASE)

# Matches stack frame lines like:
#   File "C:\...\app\loadcontroller_listener.py", line 592, in handle_loadcontroller_status
FILE_FRAME_RE = re.compile(r'File "([^"]+app[\\/][^"]+)", line (\d+), in ([^\n]+)')

def parse_ts(line: str):
    m = TIMESTAMP_RE.match(line)
    if not m:
        return None
    d, t = m.group(1), m.group(2)
    return datetime.strptime(f"{d} {t}", "%Y-%m-%d %H:%M:%S")

def is_timestamp_line(line: str):
    return TIMESTAMP_RE.match(line) is not None

def analyze_log(log_path: str, context_before: int, context_after: int, limit_blocks: int):
    qpool_events = []  # list of dicts with time + details
    handle_exc_blocks = []  # blocks around exception lines
    started_server_pids = []
    stale_lock_count = 0

    proc_start_counts = Counter()
    monitor_tasks_counts = Counter()

    file_frames_counter = Counter()
    handler_counter = Counter()

    # Keep context buffer for “around match”
    before = deque(maxlen=context_before)

    # Block capture state
    capturing = False
    block_lines = []
    block_started_at = None
    block_reason = None

    def flush_block():
        nonlocal capturing, block_lines, block_started_at, block_reason, handle_exc_blocks
        if capturing and block_lines:
            handle_exc_blocks.append({
                "started_at": block_started_at,
                "reason": block_reason,
                "lines": list(block_lines),
            })
        capturing = False
        block_lines = []
        block_started_at = None
        block_reason = None

    with open(log_path, "r", encoding="utf-8", errors="replace") as f:
        for raw_line in f:
            line = raw_line.rstrip("\n")

            # Always update context buffer unless we want to avoid including traceback noise
            if not capturing:
                before.append(line)

            # Quick counts
            if QUEUEPOOL_RE.search(line):
                m = QUEUEPOOL_RE.search(line)
                size, overflow, timeout_s = m.group(1), m.group(2), m.group(3)
                ts = parse_ts(line)
                qpool_events.append({
                    "time": ts,
                    "pool_size": int(size),
                    "max_overflow": int(overflow),
                    "pool_timeout_s": float(timeout_s),
                    "raw": line
                })

            if EXC_HANDLER_RE.search(line):
                # capture block starting from this line
                if len(handle_exc_blocks) >= limit_blocks:
                    # still count but don't capture more
                    pass
                else:
                    # start capture if not already
                    if not capturing:
                        capturing = True
                        block_lines = list(before) + [line]
                        block_started_at = parse_ts(line)
                        block_reason = "handle_loadcontroller_status exception"

                    else:
                        block_lines.append(line)

            if not capturing:
                # standalone counts
                sm = STARTED_SERVER_RE.search(line)
                if sm:
                    started_server_pids.append(int(sm.group(1)))

                if STALE_LOCK_RE.search(line):
                    stale_lock_count += 1

                if STARTUP_PROC_RE.search(line):
                    proc_start_counts[line.strip()] += 1

                mt = MONITOR_TASKS_RE.search(line)
                if mt:
                    monitor_tasks_counts[int(mt.group(1))] += 1

            # If capturing, decide when to stop
            if capturing:
                block_lines.append(line)

                # Stop when we see next timestamp line after we've already collected
                # a traceback (or when we have enough after-context)
                # Heuristic: after-context counted by number of lines since start
                # We'll stop if we encounter a new timestamp and we are past the initial few lines.
                if len(block_lines) > (context_after + context_before + 5) and is_timestamp_line(line):
                    # new entry, stop before current timestamp line
                    # But we already appended it; to avoid complexity just flush and stop
                    flush_block()
                    if len(handle_exc_blocks) >= limit_blocks:
                        break
                    before.clear()
                    continue

                # Also attempt to stop on new timestamp after at least some traceback lines
                if is_timestamp_line(line) and len(block_lines) > 30:
                    # current timestamp belongs to next event; flush excluding current line
                    # (we'll trim last line to keep blocks cleaner)
                    block_lines = block_lines[:-1]
                    flush_block()
                    if len(handle_exc_blocks) >= limit_blocks:
                        break
                    before.clear()
                    continue

    # Flush any remaining capture
    if capturing:
        flush_block()

    # Extract stack frames from captured blocks
    for blk in handle_exc_blocks:
        for ln in blk["lines"]:
            fm = FILE_FRAME_RE.search(ln)
            if fm:
                frame_file = fm.group(1)
                frame_line = fm.group(2)
                frame_fn = fm.group(3).strip()
                # normalize path separators a bit
                file_frames_counter[f"{frame_file} (line {frame_line})"] += 1
                handler_counter[frame_fn] += 1

    # Also infer file frames from pool timeout lines
    for ev in qpool_events:
        pass

    # Compute time deltas between pool timeouts
    times = sorted([e["time"] for e in qpool_events if e["time"] is not None])
    deltas = []
    for i in range(1, len(times)):
        deltas.append((times[i] - times[i-1]).total_seconds())

    report = {
        "log_path": log_path,
        "queuepool_timeout_count": len(qpool_events),
        "queuepool_timeouts": [
            {
                "time": e["time"].isoformat() if e["time"] else None,
                "pool_size": e["pool_size"],
                "max_overflow": e["max_overflow"],
                "pool_timeout_s": e["pool_timeout_s"]
            }
            for e in qpool_events[:50]
        ],
        "queuepool_time_deltas_seconds": deltas[:30],
        "handle_loadcontroller_status_exception_blocks_captured": len(handle_exc_blocks),
        "started_server_process_pids": started_server_pids,
        "stale_lock_file_count": stale_lock_count,
        "monitor_tasks_counts": dict(monitor_tasks_counts),
        "startup_process_lines_sample": list(proc_start_counts.items())[:10],
        "stack_frames_by_file_line": dict(file_frames_counter.most_common(10)),
        "stack_frames_by_function": dict(handler_counter.most_common(10)),
        "notes": [
            "If queuepool_time_deltas are ~pool_timeout_s (e.g., ~30s), it indicates repeated connection pool exhaustion loops.",
            "stack_frames_by_file_line should point to the exact handler/query holding connections too long."
        ]
    }
    return report

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--log-file", required=True)
    ap.add_argument("--context-before", type=int, default=8)
    ap.add_argument("--context-after", type=int, default=80)
    ap.add_argument("--limit-blocks", type=int, default=20)
    args = ap.parse_args()

    report = analyze_log(args.log_file, args.context_before, args.context_after, args.limit_blocks)

    # Print a readable report (no JSON noise by default)
    print("=== DB Pool Timeout Diagnosis ===")
    print(f"Log: {report['log_path']}")
    print()
    print(f"QueuePool timeouts: {report['queuepool_timeout_count']}")
    for i, e in enumerate(report["queuepool_timeouts"][:10], 1):
        print(f"{i}. time={e['time']} pool_size={e['pool_size']} max_overflow={e['max_overflow']} pool_timeout_s={e['pool_timeout_s']}")
    if len(report["queuepool_time_deltas_seconds"]) > 0:
        print("Deltas between consecutive timeouts (seconds):")
        print(", ".join(f"{d:.1f}" for d in report["queuepool_time_deltas_seconds"]))
    print()
    print(f"handle_loadcontroller_status exception blocks captured: {report['handle_loadcontroller_status_exception_blocks_captured']}")
    print(f"Startup listener monitor tasks counts seen: {report['monitor_tasks_counts']}")
    print(f"Stale lock file warnings: {report['stale_lock_file_count']}")
    print(f"Started server process PIDs found: {report['started_server_process_pids']}")
    print()
    print("Most frequent stack frames (file:line):")
    for k, v in report["stack_frames_by_file_line"].items():
        print(f"- {k}: {v}")
    print()
    print("Most frequent stack functions:")
    for k, v in report["stack_frames_by_function"].items():
        print(f"- {k}: {v}")
    print()
    print("Done.")
    return 0

if __name__ == "__main__":
    sys.exit(main())