import os
import shutil
import sys


def is_bundled_app() -> bool:
    """True when running as Nuitka/PyInstaller EXE (not python start_server.py)."""
    if getattr(sys, "frozen", False):
        return True

    exe_name = os.path.basename(sys.executable).lower()
    if exe_name.endswith(".exe") and "python" not in exe_name:
        return True

    main_file = getattr(sys.modules.get("__main__"), "__file__", "") or ""
    if "onefile_" in main_file.replace("\\", "/"):
        return True

    return False


def _is_backend_dir(path: str) -> bool:
    if not path or not os.path.isdir(path):
        return False
    for marker in (
        "environment.env",
        "environment.env.template",
        "start_server.exe",
        "start_server.py",
    ):
        if os.path.isfile(os.path.join(path, marker)):
            return True
    return False


def _walk_parents(start: str, depth: int = 6) -> list[str]:
    out: list[str] = []
    cur = os.path.abspath(start) if start else ""
    for _ in range(depth):
        if not cur:
            break
        out.append(cur)
        parent = os.path.dirname(cur)
        if not parent or parent == cur:
            break
        cur = parent
    return out


def get_base_dir() -> str:
    """lutron_backend folder (install dir), never the Nuitka onefile unpack folder."""
    candidates: list[str] = []
    seen: set[str] = set()

    def add(path: str | None) -> None:
        if not path:
            return
        path = os.path.abspath(path)
        if path in seen:
            return
        seen.add(path)
        candidates.append(path)

    for src in (sys.argv[0], sys.executable):
        if src:
            add(os.path.dirname(os.path.abspath(src)))
            for parent in _walk_parents(os.path.dirname(os.path.abspath(src))):
                add(parent)

    add(os.getcwd())

    if not is_bundled_app():
        here = os.path.dirname(os.path.abspath(__file__))
        add(os.path.dirname(os.path.dirname(here)))

    for path in candidates:
        if _is_backend_dir(path):
            return path

    if is_bundled_app() and sys.argv and sys.argv[0]:
        return os.path.abspath(os.path.dirname(os.path.abspath(sys.argv[0])))

    return os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def ensure_runtime_cwd() -> str:
    root = get_base_dir()
    try:
        os.chdir(root)
    except OSError:
        pass
    return root


def get_app_dir() -> str:
    return os.path.join(get_base_dir(), "app")


_LAP_REQUIRED = ("lap_private_key.pem", "lap_signed_csr.pem", "lap_lutron_root.crt")
_LAP_COPY = _LAP_REQUIRED + ("lap_lutron_intermediate.pem", "lap_lutron_chain.pem", "lutronelectronics.conf")
_certs_imported = False
_floor_plans_imported = False
_media_imported = False

# Folder names used by older Setup / manual copies (v37-style patch-up).
_SITE_FOLDER_NAMES = (
    "lutron",
    "Lutron",
    "LUTRON",
    "Lutron LMS",
    "lutron lms",
    "LUTRON LMS",
    "LutronLMS",
    "lutronlms",
    "Lutron_LMS",
    "lutron_lms",
    "LutronLms",
)


def _is_ipv4_folder_name(name: str) -> bool:
    parts = name.split(".")
    if len(parts) != 4:
        return False
    try:
        return all(0 <= int(part) <= 255 for part in parts)
    except ValueError:
        return False


def _has_lap_files(folder: str) -> bool:
    return bool(folder) and all(os.path.isfile(os.path.join(folder, name)) for name in _LAP_REQUIRED)


def _leap_complete(folder: str) -> bool:
    if not folder or not os.path.isdir(folder):
        return False
    return all(
        os.path.isfile(os.path.join(folder, name))
        for name in ("lap_lutron_root.crt", "leap_private_key.pem", "leap_signed_csr.pem")
    )


def _file_count(folder: str) -> int:
    if not folder or not os.path.isdir(folder):
        return 0
    n = 0
    try:
        for root, _dirs, files in os.walk(folder):
            n += len(files)
            if n > 5000:
                return n
    except OSError:
        return 0
    return n


def _known_app_dirs(exclude_local_app: str) -> list[str]:
    """Find other Lutron LMS app folders on this PC (any drive / common names)."""
    local_abs = os.path.normcase(os.path.abspath(exclude_local_app))
    found: list[str] = []
    seen: set[str] = set()

    def add_app(app_path: str) -> None:
        app_path = os.path.abspath(app_path)
        key = os.path.normcase(app_path)
        if key in seen or key == local_abs:
            return
        if os.path.isdir(app_path):
            seen.add(key)
            found.append(app_path)

    drives: list[str] = []
    for letter in "CDEFGHIJKLMNOPQRSTUVWXYZ":
        root = f"{letter}:\\"
        if os.path.isdir(root):
            drives.append(root)

    for drive in drives:
        for name in _SITE_FOLDER_NAMES:
            add_app(os.path.join(drive, name, "lutron_backend", "app"))
            # Some older trees put app under install root without lutron_backend
            add_app(os.path.join(drive, name, "app"))

    for pf_key in ("ProgramFiles", "ProgramFiles(x86)", "ProgramW6432"):
        pf = os.environ.get(pf_key) or ""
        if not pf:
            continue
        for name in _SITE_FOLDER_NAMES:
            add_app(os.path.join(pf, name, "lutron_backend", "app"))

    return found


def _cert_dirs_from_apps(local_certs: str) -> list[str]:
    local_app = os.path.dirname(local_certs)
    out: list[str] = []
    for app in _known_app_dirs(local_app):
        certs = os.path.join(app, "certificates")
        if os.path.isdir(certs):
            out.append(certs)
    return out


def import_site_certificates(local: str) -> str:
    """v37-style: copy LAP + per-processor LEAP from other Lutron trees if missing locally."""
    os.makedirs(local, exist_ok=True)
    sources = [path for path in _cert_dirs_from_apps(local) if _has_lap_files(path)]
    if not sources:
        # Still try sources that only have processor LEAP folders
        sources = [path for path in _cert_dirs_from_apps(local) if _file_count(path) > 0]
    if not sources:
        return local

    def processor_count(root: str) -> int:
        try:
            return sum(
                1
                for name in os.listdir(root)
                if _is_ipv4_folder_name(name) and _leap_complete(os.path.join(root, name))
            )
        except OSError:
            return 0

    sources.sort(key=lambda p: (processor_count(p), _file_count(p)), reverse=True)
    src_root = sources[0]

    if not _has_lap_files(local) and _has_lap_files(src_root):
        for name in _LAP_COPY:
            src = os.path.join(src_root, name)
            if os.path.isfile(src):
                shutil.copy2(src, os.path.join(local, name))
        print(f"[OK] Imported base LAP certificates from {src_root}")

    try:
        names = os.listdir(src_root)
    except OSError:
        return local
    for name in names:
        if not _is_ipv4_folder_name(name):
            continue
        src_ip = os.path.join(src_root, name)
        dst_ip = os.path.join(local, name)
        if _leap_complete(dst_ip) or not _leap_complete(src_ip):
            continue
        os.makedirs(dst_ip, exist_ok=True)
        for filename in os.listdir(src_ip):
            src_file = os.path.join(src_ip, filename)
            if os.path.isfile(src_file):
                dst_file = os.path.join(dst_ip, filename)
                if not os.path.isfile(dst_file):
                    shutil.copy2(src_file, dst_file)
        print(f"[OK] Imported processor certificates for {name} from {src_ip}")
    return local


def import_site_subdir(local_dir: str, subdir_name: str, label: str) -> str:
    """Copy missing files from the richest matching subdir on other Lutron installs."""
    os.makedirs(local_dir, exist_ok=True)
    local_app = os.path.dirname(local_dir)
    candidates: list[str] = []
    for app in _known_app_dirs(local_app):
        src = os.path.join(app, subdir_name)
        if os.path.isdir(src) and _file_count(src) > 0:
            candidates.append(src)
    if not candidates:
        return local_dir

    candidates.sort(key=_file_count, reverse=True)
    src_root = candidates[0]
    if os.path.normcase(os.path.abspath(src_root)) == os.path.normcase(os.path.abspath(local_dir)):
        return local_dir

    copied = 0
    try:
        for root, _dirs, files in os.walk(src_root):
            rel = os.path.relpath(root, src_root)
            dest_root = local_dir if rel == "." else os.path.join(local_dir, rel)
            os.makedirs(dest_root, exist_ok=True)
            for filename in files:
                src_file = os.path.join(root, filename)
                dst_file = os.path.join(dest_root, filename)
                if not os.path.isfile(dst_file):
                    try:
                        shutil.copy2(src_file, dst_file)
                        copied += 1
                    except OSError:
                        pass
    except OSError:
        return local_dir

    if copied:
        print(f"[OK] Imported {copied} {label} file(s) from {src_root}")
    return local_dir


def get_certificates_dir() -> str:
    path = os.path.join(get_app_dir(), "certificates")
    os.makedirs(path, exist_ok=True)
    global _certs_imported
    if not _certs_imported:
        # v37 behavior: auto patch-up handshake certs from other Lutron LMS folders on this PC.
        # Opt-out: LUTRON_IMPORT_SITE_CERTS=0
        flag = (os.environ.get("LUTRON_IMPORT_SITE_CERTS") or "1").strip().lower()
        if flag not in ("0", "false", "no", "off"):
            try:
                import_site_certificates(path)
            except Exception as exc:
                print(f"[WARN] Certificate site patch-up skipped: {exc}")
        _certs_imported = True
    return path


def get_floor_plans_dir() -> str:
    path = os.path.join(get_app_dir(), "floor_plans")
    os.makedirs(path, exist_ok=True)
    global _floor_plans_imported
    if not _floor_plans_imported:
        # v37-style: pull mapped floor plan files from older install folders if missing here.
        flag = (os.environ.get("LUTRON_IMPORT_SITE_MEDIA") or "1").strip().lower()
        if flag not in ("0", "false", "no", "off"):
            try:
                import_site_subdir(path, "floor_plans", "floor plan")
            except Exception as exc:
                print(f"[WARN] Floor-plan site patch-up skipped: {exc}")
        _floor_plans_imported = True
    return path


def get_background_image_dir() -> str:
    path = os.path.join(get_app_dir(), "background_image")
    os.makedirs(path, exist_ok=True)
    _maybe_import_media()
    return path


def get_logo_image_dir() -> str:
    path = os.path.join(get_app_dir(), "logo_image")
    os.makedirs(path, exist_ok=True)
    _maybe_import_media()
    return path


def get_help_files_dir() -> str:
    path = os.path.join(get_app_dir(), "help_files")
    os.makedirs(path, exist_ok=True)
    _maybe_import_media()
    return path


def _maybe_import_media() -> None:
    global _media_imported
    if _media_imported:
        return
    _media_imported = True
    flag = (os.environ.get("LUTRON_IMPORT_SITE_MEDIA") or "1").strip().lower()
    if flag in ("0", "false", "no", "off"):
        return
    app = get_app_dir()
    try:
        import_site_subdir(os.path.join(app, "background_image"), "background_image", "background")
        import_site_subdir(os.path.join(app, "logo_image"), "logo_image", "logo")
        import_site_subdir(os.path.join(app, "help_files"), "help_files", "help")
    except Exception as exc:
        print(f"[WARN] Media site patch-up skipped: {exc}")


def get_logs_dir() -> str:
    path = os.path.join(get_base_dir(), "logs")
    os.makedirs(path, exist_ok=True)
    return path


def get_frontend_dir() -> str:
    parent = os.path.dirname(get_base_dir())
    for name in ("lutron_frontend", "frontend"):
        candidate = os.path.join(parent, name)
        if os.path.isdir(candidate):
            return candidate
    return os.path.join(parent, "lutron_frontend")


def get_frontend_build_dir() -> str:
    return os.path.join(get_frontend_dir(), "build")
