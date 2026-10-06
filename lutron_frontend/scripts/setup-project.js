/**
 * First-time project setup: requires Node.js only (npm is bundled).
 * Installs all dependencies from package.json — no global packages needed.
 */
const { execSync } = require("child_process");
const path = require("path");

const MIN_NODE_MAJOR = 18;
const major = parseInt(process.version.slice(1).split(".")[0], 10);

if (Number.isNaN(major) || major < MIN_NODE_MAJOR) {
  console.error(
    `Node.js ${MIN_NODE_MAJOR}+ is required (found ${process.version}).\n` +
      "Install from https://nodejs.org — npm is included automatically."
  );
  process.exit(1);
}

console.log(`Node ${process.version} detected. npm ${getNpmVersion()}`);
console.log("Installing project dependencies (local only, no global packages)...");

execSync("npm install", {
  stdio: "inherit",
  cwd: path.join(__dirname, ".."),
});

console.log("\nSetup complete. Start the app with: npm start");

function getNpmVersion() {
  try {
    return execSync("npm -v", { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}
