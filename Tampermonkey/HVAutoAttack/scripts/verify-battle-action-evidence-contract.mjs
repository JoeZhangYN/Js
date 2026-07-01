import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const specs = [
  {
    owner: "src/battle/battle-action-decision-evidence.js",
    test: "src/battle/battle-action-decision-evidence.test.js",
    handler: "battleActionDecisionEvidenceEventHandlers[event?.type]",
    nullTest: "rejects null decision evidence events without writing diagnostics",
    evidenceKey: "HVAA:lastBattleActionDecision",
  },
  {
    owner: "src/battle/battle-action-effect-evidence.js",
    test: "src/battle/battle-action-effect-evidence.test.js",
    handler: "battleActionEffectEvidenceEventHandlers[event?.type]",
    nullTest: "rejects null effect evidence events without writing diagnostics",
    evidenceKey: "HVAA:lastBattleActionEffect",
  },
  {
    owner: "src/battle/battle-action-lifecycle-evidence.js",
    test: "src/battle/battle-action-lifecycle-evidence.test.js",
    handler: "battleActionLifecycleEvidenceEventHandlers[event?.type]",
    nullTest: "rejects null lifecycle evidence events without writing diagnostics",
    evidenceKey: "HVAA:lastBattleActionLifecycle",
  },
  {
    owner: "src/battle/battle-command-evidence.js",
    test: "src/battle/battle-command-evidence.test.js",
    handler: "battleCommandEvidenceEventHandlers[event?.type]",
    nullTest: "rejects null command evidence events without writing diagnostics",
    evidenceKey: "HVAA:lastBattleCommand",
  },
];

const violations = [];

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

for (const spec of specs) {
  const ownerText = read(spec.owner);
  const testText = read(spec.test);
  if (!ownerText.includes(spec.handler)) {
    violations.push(`${spec.owner} must reject null events through its evidence entry`);
  }
  if (/EventHandlers\[event\.type\]/.test(ownerText)) {
    violations.push(`${spec.owner} must not read event.type directly in evidence dispatch`);
  }
  for (const required of [spec.nullTest, spec.evidenceKey, "not.toHaveBeenCalled()"]) {
    if (!testText.includes(required)) {
      violations.push(`${spec.test} must cover ${required}`);
    }
  }
}

if (violations.length) {
  console.error("[verify-battle-action-evidence-contract] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-battle-action-evidence-contract] OK - action evidence entries reject null events");
