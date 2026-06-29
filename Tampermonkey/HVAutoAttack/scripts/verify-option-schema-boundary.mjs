import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/settings/schema.js");
const ownerTest = path.normalize("src/settings/schema.test.js");
const settingsRender = path.normalize("src/settings/render.js");
const violations = [];

function rel(file) {
  return path.normalize(path.relative(root, file)).replaceAll("\\", "/");
}

function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
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
  const text = stripComments(fs.readFileSync(file, "utf8"));
  if (relative === owner || relative === ownerTest) return;

  if (
    /import\s*\{[^}]*\b(?:OPTION_SCHEMA|getOptionDefault|getFieldsByGroup)\b[^}]*\}\s*from\s*["'][^"']*\/?settings\/schema\.js["']/.test(
      text
    ) ||
    /import\s*\{[^}]*\b(?:OPTION_SCHEMA|getOptionDefault|getFieldsByGroup)\b[^}]*\}\s*from\s*["']\.\/schema\.js["']/.test(
      text
    )
  ) {
    violations.push(`${rel(file)} imports legacy option schema exits`);
  }
}

walk(srcDir);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
for (const required of ["OptionSchemaEvent", "runOptionSchema"]) {
  if (!ownerText.includes(required))
    violations.push(`${owner.replaceAll("\\", "/")} must expose ${required}`);
}
for (const legacy of ["OPTION_SCHEMA", "getOptionDefault", "getFieldsByGroup"]) {
  if (new RegExp(`export\\s+(?:const|function)\\s+${legacy}\\b`).test(ownerText)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} must keep ${legacy} private behind runOptionSchema(event)`
    );
  }
}
if (!/export const OptionSchemaEvent\s*=\s*Object\.freeze\(/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must expose OptionSchemaEvent`);
}
if (!/export function runOptionSchema\(\s*event\b/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must expose runOptionSchema(event)`);
}

const renderText = fs.readFileSync(path.join(root, settingsRender), "utf8");
for (const required of [
  /renderEquipmentSchemaFields/,
  /readSchemaField\(\s*["']repairValue["']\s*\)/,
  /renderSchemaCheckboxField\(\s*["']forgeCostShow["']\s*\)/,
  /renderSchemaSelectField\(\s*["']equipPercentileMode["']\s*\)/,
  /renderRiddleSchemaFields/,
  /renderSchemaCheckboxField\(\s*["']riddleHelperUi["']\s*\)/,
  /renderSchemaCheckboxField\(\s*["']mlAnswer["']/,
  /renderSchemaCheckboxField\(\s*["']mlBackupOnFail["']\s*\)/,
  /renderSchemaTextInput\(\s*["']mlEndpoint["']/,
  /renderSchemaTextInput\(\s*["']mlApiKey["']/,
  /renderCriticalBuffSchemaFields/,
  /renderCheckboxPlusNumber\(\s*["']pauseOnCriticalBuffExpire["']\s*,\s*["']criticalBuffMinTurns["']/,
  /renderSchemaTextInput\(\s*["']criticalBuffsList["']/,
  /renderSchemaNumberInput\(\s*["']criticalBuffMpFloor["']/,
  /renderDebuffSmartSkipSchemaFields/,
  /renderSchemaCheckboxField\(\s*["']skipDebuffForBigSkill_We["']/,
  /renderSchemaCheckboxField\(\s*["']skipWeakenWhenClearReady["']/,
  /renderSchemaCheckboxField\(\s*["']skipDebuffForBigSkill_Im["']/,
  /renderSchemaNumberInput\(\s*["']skipDebuffForBigSkillThreshold["']/,
  /renderSchemaCheckboxField\(\s*["']skipImperilWhenOfcKills["']/,
  /renderSchemaNumberInput\(\s*["']bigKillMinSamples["']/,
  /renderSchemaNumberInput\(\s*["']bigKillProbThreshold["']/,
  /renderSchemaNumberInput\(\s*["']bigKillScaleDriftTol["']/,
  /renderSchemaCheckboxField\(\s*["']dynamicBigKillLog["']\s*\)/,
  /renderBurstGuardSchemaFields/,
  /renderSchemaCheckboxField\(\s*["']burstControlSwitch["']/,
  /renderSchemaNumberInput\(\s*["']burstControlHpFrac["']/,
  /renderSchemaCheckboxField\(\s*["']burstControlSilenceForSpell["']/,
  /renderSchemaCheckboxField\(\s*["']drainTargetMaxHp["']/,
  /renderSchemaCheckboxField\(\s*["']autoElement["']\s*\)/,
]) {
  if (!required.test(renderText)) {
    violations.push(
      `${settingsRender.replaceAll("\\", "/")} must render migrated options from schema`
    );
  }
}
for (const forbidden of [
  /name=["']repairValue["']\s+placeholder=["']60["']/,
  /id=["']forgeCostShow["'][\s\S]{0,120}强化价格/,
  /name=["']equipPercentileMode["'][\s\S]{0,160}<option value=["']offline["']/,
  /id=["']riddleHelperUi["'][\s\S]{0,120}小马图片助手/,
  /id=["']mlAnswer["'][\s\S]{0,120}ML 答题/,
  /id=["']mlBackupOnFail["'][\s\S]{0,120}备份图片/,
  /name=["']mlEndpoint["']\s+placeholder=["']https:\/\/rdma\.ooguy\.com\/help2["']/,
  /name=["']criticalBuffsList["']\s+placeholder=["']Hastened,Protection,Spark of Life["']/,
  /name=["']criticalBuffMpFloor["']\s+placeholder=["']30["']/,
  /id=["']skipDebuffForBigSkill_We["'][\s\S]{0,140}OFC\/FRD 即将就绪/,
  /id=["']skipWeakenWhenClearReady["'][\s\S]{0,140}大招本回合已就绪/,
  /id=["']skipDebuffForBigSkill_Im["'][\s\S]{0,140}OFC\/FRD 即将就绪/,
  /name=["']skipDebuffForBigSkillThreshold["']\s+placeholder=["']3["']/,
  /id=["']skipImperilWhenOfcKills["'][\s\S]{0,140}OFC 能秒/,
  /name=["']bigKillMinSamples["']\s+placeholder=["']4["']/,
  /name=["']bigKillProbThreshold["']\s+placeholder=["']0\.9["']/,
  /name=["']bigKillScaleDriftTol["']\s+placeholder=["']1\.15["']/,
  /id=["']dynamicBigKillLog["'][\s\S]{0,140}控制台输出 OFC 击杀学习日志/,
  /id=["']burstControlSwitch["'][\s\S]{0,140}学致死爆发伤害/,
  /name=["']burstControlHpFrac["']\s+placeholder=["']50["']/,
  /id=["']burstControlSilenceForSpell["'][\s\S]{0,140}法术爆发用 Silence/,
  /id=["']drainTargetMaxHp["'][\s\S]{0,140}Drain 优先打血最多/,
  /id=["']autoElement["'][\s\S]{0,160}按九抗自动选最弱属性攻击/,
]) {
  if (forbidden.test(renderText)) {
    violations.push(
      `${settingsRender.replaceAll("\\", "/")} must not inline migrated option defaults/labels`
    );
  }
}

if (violations.length) {
  console.error("[verify-option-schema-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-option-schema-boundary] OK — option schema reads are behind one entry");
