import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const lobbyFile = path.join(root, "src/pages/lobby-automation.js");
const pageFile = path.join(root, "src/pages/page-automation.js");
const lobbyText = fs.readFileSync(lobbyFile, "utf8");
const pageText = fs.readFileSync(pageFile, "utf8");
const testText = [
  "src/pages/lobby-automation.test.js",
  "src/pages/lobby-automation-recovery.test.js",
  "src/pages/lobby-automation-isekai.test.js",
]
  .map((file) => fs.readFileSync(path.join(root, file), "utf8"))
  .join("\n");
const violations = [];

function requireText(text, needle, message) {
  if (!text.includes(needle)) violations.push(message);
}

requireText(lobbyText, "export const LobbyEvent", "lobby must expose its event vocabulary");
requireText(
  lobbyText,
  "export function createLobbyAutomationCapability({ randomEncounter })",
  "lobby must bind world feature availability through a capability factory"
);
requireText(
  lobbyText,
  "CURRENT_WORLD_POLICY.features.randomEncounter",
  "the out-of-box lobby instance must bind the current world policy once"
);
requireText(
  lobbyText,
  "const steps = randomEncounter ? LOBBY_READY_FLOW_STEPS : ISEKAI_LOBBY_READY_FLOW_STEPS",
  "the factory must select the reachable stage graph at composition time"
);
requireText(
  lobbyText,
  "await runEncounterAutomation(",
  "encounter-enabled lobby flow must await encounter completion"
);
requireText(
  lobbyText,
  "encounterOutcome?.claimed === true",
  "lobby must stop only for an explicit encounter claim"
);
requireText(
  lobbyText,
  "encounterOutcome?.blocked === true",
  "lobby must stop for explicit encounter recovery blocks"
);
requireText(lobbyText, "pendingFlows", "each lobby capability must singleflight its complete flow");
requireText(
  lobbyText,
  ".finally(",
  "lobby singleflight must release after completion or rejection"
);
requireText(
  pageText,
  "[PageKind.ISEKAI_LOBBY]: runLobbyPageAutomation",
  "Isekai lobby routing must use the same business call as Persistent"
);
requireText(
  pageText,
  "runLobbyAutomation({ type: LobbyEvent.PAGE_READY })",
  "page automation must call one lobby event shape"
);

for (const forbidden of ["isIsekai", "ISEKAI_PAGE_READY", "isekaiPageReady", "event.world"]) {
  if (lobbyText.includes(forbidden) || pageText.includes(forbidden)) {
    violations.push(`lobby/page orchestration must not propagate raw world context: ${forbidden}`);
  }
}

for (const requiredTest of [
  "rejects invalid lobby events without running lobby flow",
  "coalesces concurrent UTC wakeups across the complete lobby workflow",
  "releases the lobby singleflight after a rejected workflow",
  "Isekai-bound lobby capability",
  "runs the shared lobby call without encounter orchestration",
  "runEncounterAutomation).not.toHaveBeenCalled()",
]) {
  requireText(testText, requiredTest, `lobby tests must cover: ${requiredTest}`);
}

if (violations.length) {
  console.error("[verify-lobby-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  "[verify-lobby-boundary] OK — one context-free lobby call uses a factory-bound stage graph"
);
