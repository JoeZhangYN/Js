import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/repair/material-shop.js");
const ownerTest = path.normalize("src/repair/material-shop.test.js");
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
      /from\s+["'](?:\.\/|\.\.\/repair\/)material-shop\.js["']/.test(line) &&
      (!/\bMaterialShopEvent\b/.test(line) || !/\brunMaterialShopAutomation\b/.test(line))
    ) {
      violations.push(`${where} material shop consumers must use runMaterialShopAutomation(event)`);
    }
    if (
      relative !== owner &&
      relative !== ownerTest &&
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
for (const legacy of ["parseShopPage", "ensureMaterials"]) {
  if (new RegExp(`export\\s+function\\s+${legacy}\\s*\\(`).test(ownerText)) {
    violations.push(`${owner.replaceAll("\\", "/")} legacy ${legacy} export is forbidden`);
  }
}

if (violations.length) {
  console.error("[verify-material-shop-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-material-shop-boundary] OK — material shop buying is behind one entry");
