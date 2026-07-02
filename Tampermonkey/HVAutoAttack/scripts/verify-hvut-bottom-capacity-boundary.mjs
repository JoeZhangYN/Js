import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const hvUtilsFile = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, hvUtilsFile), "utf8");
const violations = [];
const capacityPattern =
  "const exec = /<td>Inventory Capacity:<\\/td><td>(\\d+)(?: \\+ (\\d+))?<\\/td><td>\\/<\\/td><td>(\\d+)<\\/td>/.exec(html);";

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

for (const [index, match] of [...text.matchAll(/const exec = \/<td>Inventory Capacity:[^\n]+\.exec\(html\);/g)].entries()) {
  const body = text.slice(match.index, match.index + 600);
  const guardIndex = body.indexOf("if (!exec)");
  const firstUseIndex = body.search(/exec\[[123]\]/);
  if (guardIndex < 0) {
    violations.push(`${rel(hvUtilsFile)} capacity parser[${index}] must guard missing Inventory Capacity`);
    continue;
  }
  if (firstUseIndex >= 0 && firstUseIndex < guardIndex) {
    violations.push(`${rel(hvUtilsFile)} capacity parser[${index}] must guard before reading capture groups`);
  }
  const guardBody = body.match(/if \(!exec\) \{[\s\S]*?\n\s*\}/)?.[0] || "";
  if (!guardBody.includes("unavailable")) {
    violations.push(`${rel(hvUtilsFile)} capacity parser[${index}] must expose unavailable capacity`);
  }
  if (/popup\(/.test(guardBody)) {
    violations.push(`${rel(hvUtilsFile)} capacity parser[${index}] must not popup on parse failures`);
  }
}

for (const [index, match] of [
  ...text.matchAll(/\$ajax\.fetch\('\?s=Bazaar&ss=am&screen=organize'\)\.then\(\(html\) => \{[\s\S]*?\n\s*\}\);/g),
].entries()) {
  if (!match[0].includes(".catch(() => {")) {
    violations.push(`${rel(hvUtilsFile)} capacity fetch[${index}] must expose unavailable capacity on request failure`);
  }
}

if (!text.includes(capacityPattern)) {
  violations.push(`${rel(hvUtilsFile)} must keep the Inventory Capacity parser visible to guards`);
}

if (violations.length) {
  console.error("[verify-hvut-bottom-capacity-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-bottom-capacity-boundary] OK - bottom capacity parse failures fail closed");
