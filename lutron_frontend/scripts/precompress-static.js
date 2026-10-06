/**
 * Write .br and .gz siblings for compressible UI assets.
 * SpaHandler serves them when the browser sends Accept-Encoding.
 * Node's zlib is enough; the packaged EXE does not need a Brotli module.
 */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const STATIC_DIR = path.join(__dirname, "..", "build", "static");
const EXTENSIONS = new Set([".js", ".css", ".svg"]);

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
      continue;
    }
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (!EXTENSIONS.has(ext)) continue;
    if (entry.name.endsWith(".gz") || entry.name.endsWith(".br")) continue;
    out.push(full);
  }
  return out;
}

function writeIfSmaller(filePath, suffix, bytes) {
  if (bytes.length >= fs.statSync(filePath).size) {
    const stale = filePath + suffix;
    if (fs.existsSync(stale)) fs.unlinkSync(stale);
    return false;
  }
  fs.writeFileSync(filePath + suffix, bytes);
  return true;
}

function main() {
  if (!fs.existsSync(STATIC_DIR)) {
    console.error("[precompress] build/static is missing. Run the frontend build first.");
    process.exit(1);
  }

  const files = walk(STATIC_DIR, []);
  let brotli = 0;
  let gzip = 0;
  for (const filePath of files) {
    const raw = fs.readFileSync(filePath);
    const gz = zlib.gzipSync(raw, { level: 6 });
    const br = zlib.brotliCompressSync(raw, {
      params: {
        [zlib.constants.BROTLI_PARAM_QUALITY]: 6,
      },
    });
    if (writeIfSmaller(filePath, ".gz", gz)) gzip += 1;
    if (writeIfSmaller(filePath, ".br", br)) brotli += 1;
  }
  console.log(
    `[precompress] ${files.length} text assets, ${brotli} brotli, ${gzip} gzip`
  );
}

main();
