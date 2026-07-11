import { spawn } from "node:child_process";
import { createReadStream } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const output = join(tmpdir(), `hvaa-hvut-ability-smoke-${Date.now()}`);
const contentTypes = Object.freeze({
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
});

function allowedFile(pathname) {
  if (pathname === "/") return join(ROOT, "browser-smoke", "hvut-ability.html");
  if (pathname === "/src/i18n/hvut-ability-background-contrast.js") {
    return join(ROOT, "src", "i18n", "hvut-ability-background-contrast.js");
  }
  if (pathname === "/src/data/hvut-ability-authenticated-dom-evidence.js") {
    return join(ROOT, "src", "data", "hvut-ability-authenticated-dom-evidence.js");
  }
  return null;
}

const server = createServer((request, response) => {
  const file = allowedFile(new URL(request.url, "http://127.0.0.1").pathname);
  if (!file || !normalize(file).startsWith(normalize(ROOT))) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, {
    "content-type": contentTypes[extname(file)] || "application/octet-stream",
  });
  createReadStream(file).pipe(response);
});

await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});
const { port } = server.address();
const args = [
  "uishot",
  "--url",
  `http://127.0.0.1:${port}/`,
  "--wait-selector",
  "#smoke-ok",
  "--timeout-ms",
  "30000",
  "--out",
  output,
];
const child = spawn("dream", args, {
  shell: false,
  stdio: "inherit",
  windowsHide: true,
});
const exitCode = await new Promise((resolve, reject) => {
  child.once("error", reject);
  child.once("exit", (code) => resolve(code ?? 1));
});
await new Promise((resolve) => server.close(resolve));
if (exitCode !== 0) process.exit(exitCode);
console.log(`[run-hvut-ability-browser-smoke] OK - report ${join(output, "report.json")}`);
