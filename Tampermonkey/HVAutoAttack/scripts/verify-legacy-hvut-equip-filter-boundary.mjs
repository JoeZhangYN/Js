import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const workspaceRoot = path.resolve(root, "..");

const files = [
  {
    path: path.join(workspaceRoot, "HentaiVerse", "HV Utils 统一汉化.user.js"),
    expectedCalls: 2,
  },
  {
    path: path.join(workspaceRoot, "HentaiVerse", "HVUT_4.0.0_English.user.js"),
    expectedCalls: 1,
  },
  {
    path: path.join(workspaceRoot, "HentaiVerse", "HVUT_isekai_4.2.0_English.user.js"),
    expectedCalls: 1,
  },
];

const violations = [];

function rel(file) {
  return path.normalize(path.relative(root, file)).replaceAll("\\", "/");
}

for (const file of files) {
  if (!fs.existsSync(file.path)) {
    violations.push(`${rel(file.path)} missing`);
    continue;
  }

  const source = fs.readFileSync(file.path, "utf8");
  if (/\breturn\s+eval\s*\(\s*r\s*\)/.test(source)) {
    violations.push(`${rel(file.path)} equipment filter still evaluates generated code`);
  }
  if (!/function\s+evaluateEquipFilterExpression\s*\(/.test(source)) {
    violations.push(`${rel(file.path)} lacks explicit equipment filter expression entry`);
  }

  const callCount = (source.match(/\breturn\s+evaluateEquipFilterExpression\s*\(\s*r\s*\)/g) || []).length;
  if (callCount !== file.expectedCalls) {
    violations.push(
      `${rel(file.path)} expected ${file.expectedCalls} equipment filter expression calls, found ${callCount}`,
    );
  }
}

if (violations.length) {
  console.error("[verify-legacy-hvut-equip-filter-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-legacy-hvut-equip-filter-boundary] OK — legacy HVUT equipment filters use explicit parser");
