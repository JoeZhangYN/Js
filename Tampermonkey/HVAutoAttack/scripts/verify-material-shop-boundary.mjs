import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/repair/material-shop.js");
const ownerTest = path.normalize("src/repair/material-shop.test.js");
const httpFailureTest = path.normalize("src/repair/material-shop-http-failure.test.js");
const tokenFailureTest = path.normalize("src/repair/material-shop-token-failure.test.js");
const violations = [];

function rel(file) {
  return path.normalize(path.relative(root, file)).replaceAll("\\", "/");
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith(".js")) checkFile(full);
  }
}

function checkFile(file) {
  const relative = path.normalize(path.relative(root, file));
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    const where = `${rel(file)}:${index + 1}`;
    if (
      relative !== owner &&
      relative !== ownerTest &&
      relative !== httpFailureTest &&
      relative !== tokenFailureTest &&
      /from\s+["'](?:\.\/|\.\.\/repair\/)material-shop\.js["']/.test(line) &&
      (!/\bMaterialShopEvent\b/.test(line) || !/\brunMaterialShopAutomation\b/.test(line))
    ) {
      violations.push(`${where} material shop consumers must use runMaterialShopAutomation(event)`);
    }
    if (
      relative !== owner &&
      relative !== ownerTest &&
      relative !== httpFailureTest &&
      relative !== tokenFailureTest &&
      /\b(?:parseShopPage|ensureMaterials)\b/.test(line)
    ) {
      violations.push(`${where} material shop internals must stay behind the entry`);
    }
  });
}

walk(srcDir);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
for (const required of ["runMaterialShopAutomation", "MaterialShopEvent"]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must own ${required}`);
  }
}
const entryBody =
  ownerText.match(/export function runMaterialShopAutomation\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
if (
  !/const materialShopEventHandlers\s*=\s*Object\.freeze\(\{[\s\S]*\[EVENT_ENSURE_MATERIALS\]/.test(
    ownerText
  )
) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must route events through a frozen handler table`
  );
}
if (/event\.type\s*(?:!==|===)|switch\s*\(\s*event\.type\s*\)/.test(entryBody)) {
  violations.push(`${owner.replaceAll("\\", "/")} entry must dispatch by handler table`);
}
if (/materialShopEventHandlers\s*\[\s*event\.type\s*\]/.test(entryBody)) {
  violations.push(
    `${owner.replaceAll("\\", "/")} entry must reject null material shop events instead of reading event.type directly`
  );
}
for (const legacy of ["parseShopPage", "ensureMaterials"]) {
  if (new RegExp(`export\\s+function\\s+${legacy}\\s*\\(`).test(ownerText)) {
    violations.push(`${owner.replaceAll("\\", "/")} legacy ${legacy} export is forbidden`);
  }
}
if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${ownerTest.replaceAll("\\", "/")} must cover material shop entry`);
} else {
  const ownerTestText = fs.readFileSync(path.join(root, ownerTest), "utf8");
  if (
    !ownerTestText.includes("rejects unknown material shop events without reading the shop page")
  ) {
    violations.push(`${ownerTest.replaceAll("\\", "/")} must cover unknown material shop events`);
  }
  if (
    !ownerTestText.includes("rejects null material shop events without reading the shop page") ||
    !ownerTestText.includes("runMaterialShopAutomation(null")
  ) {
    violations.push(`${ownerTest.replaceAll("\\", "/")} must cover null material shop events`);
  }
}

if (!fs.existsSync(path.join(root, tokenFailureTest))) {
  violations.push(
    `${tokenFailureTest.replaceAll("\\", "/")} must cover material shop token failures`
  );
} else {
  const tokenFailureTestText = fs.readFileSync(path.join(root, tokenFailureTest), "utf8");
  for (const required of [
    "缺料但商店页缺少 storetoken → missing-storetoken，不发买请求",
    "missing-storetoken",
    "calls.filter((c) => c.parm !== undefined)).toHaveLength(0)",
  ]) {
    if (!tokenFailureTestText.includes(required)) {
      violations.push(
        `${tokenFailureTest.replaceAll("\\", "/")} must lock missing storetoken as a no-buy failure`
      );
    }
  }
}

if (!fs.existsSync(path.join(root, httpFailureTest))) {
  violations.push(
    `${httpFailureTest.replaceAll("\\", "/")} must cover material shop HTTP failures`
  );
} else {
  const httpFailureTestText = fs.readFileSync(path.join(root, httpFailureTest), "utf8");
  for (const required of [
    "初始商店页读取失败 → buy-error with failure detail",
    "买请求 POST 失败 → buy-error with failure detail",
    'kind: "networkError"',
    'kind: "httpStatus"',
  ]) {
    if (!httpFailureTestText.includes(required)) {
      violations.push(
        `${httpFailureTest.replaceAll("\\", "/")} must cover material shop HTTP failures`
      );
    }
  }
}

if (violations.length) {
  console.error("[verify-material-shop-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-material-shop-boundary] OK — material shop buying is behind one entry");
