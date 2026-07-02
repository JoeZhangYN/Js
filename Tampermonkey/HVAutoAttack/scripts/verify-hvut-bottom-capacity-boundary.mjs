import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const hvUtilsFile = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, hvUtilsFile), "utf8");
const violations = [];

function rel(file) {
  return file.replaceAll("\\", "/");
}

const showEquipBodies = [...text.matchAll(/_bottom\.show_equip = async function \(\) \{[\s\S]*?\n\};/g)].map(
  (match) => match[0]
);

if (showEquipBodies.length === 0) {
  violations.push(`${rel(hvUtilsFile)} must own _bottom.show_equip capacity monitor`);
}

for (const [index, showEquipBody] of showEquipBodies.entries()) {
  for (const required of [
    "const exec = /<td>Inventory Capacity:",
    "if (!exec)",
    "unavailable",
    "classList.add",
  ]) {
    if (!showEquipBody.includes(required)) {
      violations.push(
        `${rel(hvUtilsFile)} show_equip[${index}] must fail closed when capacity parsing is unavailable`
      );
    }
  }

  const guardIndex = showEquipBody.indexOf("if (!exec)");
  const firstUseIndex = showEquipBody.search(/exec\[[123]\]/);
  if (firstUseIndex >= 0 && (guardIndex < 0 || firstUseIndex < guardIndex)) {
    violations.push(
      `${rel(hvUtilsFile)} show_equip[${index}] must not read capacity capture groups before null guard`
    );
  }

  const guardBody = showEquipBody.match(/if \(!exec\) \{[\s\S]*?\n  \}/)?.[0] || "";
  if (/popup\(/.test(guardBody)) {
    violations.push(
      `${rel(hvUtilsFile)} show_equip[${index}] must not show equipment-full popup for parse failures`
    );
  }
}

if (violations.length) {
  console.error("[verify-hvut-bottom-capacity-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-bottom-capacity-boundary] OK - bottom capacity parse failures fail closed");
