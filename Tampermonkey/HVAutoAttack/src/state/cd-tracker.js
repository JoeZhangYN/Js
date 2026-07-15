// Universal CD tracker (Phase 5b-1)。
// 仅追踪 SKILL CD（"何时可再施"）——不管 buff effect duration（那由 snapshot.playerBuffs 直读 DOM）。
// HV 物理/魔法 skill 在 DOM 只显 opacity:0.5，不显剩余回合 → 必须 js-state lastFiredTurn。
// 物品 CD（如 manapot CD 39）由 snapshot.js 直读 .cooldown div。
//
// globalTurn：跨 battle 累计，runBattleTurnAutomation() 每 turn +1，内存持有、会话检查点恢复。
// skillLastUsed：Map<code, globalTurn>，随同一个会话检查点持久化。
import { g } from "./store.js";
import { SKILL_REGISTRY, effectiveSkillId } from "./skill-registry.js";
import { CdLearningEvent, runCdLearningAutomation } from "./cd-learner.js";
import {
  DiagnosticConsoleEvent,
  runDiagnosticConsoleAutomation,
} from "../core/diagnostic-console.js";
import { writeDiagnosticSessionSnapshot } from "../core/diagnostic-evidence-journal.js";
import {
  loadCdRuntimeCheckpoint,
  normalizeGlobalTurn,
  normalizeSkillLastUsed,
  persistCdRuntimeCheckpoint,
} from "./cd-runtime-checkpoint.js";
import { StorageWriteOutcome } from "./storage-io-policy.js";

// SKILL_REGISTRY / effectiveSkillId 已抽到 skill-registry.js（打破 cd-tracker ↔ cd-learner 环）。
// 为兼容既有 import 路径（如有），此处转出口。
export { SKILL_REGISTRY, effectiveSkillId };

export const CD_RUNTIME_FAILURE_KEY = "HVAA:lastCdRuntimeFailure";
let lifecycleCheckpointBound = false;

const EVENT_LOAD = "load";
const EVENT_PERSIST = "persist";
const EVENT_INCREMENT_TURN = "incrementTurn";
const EVENT_RECORD_FIRE = "recordFire";
const EVENT_READ_TURNS = "readTurns";
const EVENT_READ_MAP = "readMap";
const EVENT_READ_GLOBAL_TURN = "readGlobalTurn";

export const CdRuntimeEvent = Object.freeze({
  LOAD: EVENT_LOAD,
  PERSIST: EVENT_PERSIST,
  INCREMENT_TURN: EVENT_INCREMENT_TURN,
  RECORD_FIRE: EVENT_RECORD_FIRE,
  READ_TURNS: EVENT_READ_TURNS,
  READ_MAP: EVENT_READ_MAP,
  READ_GLOBAL_TURN: EVENT_READ_GLOBAL_TURN,
});

function readGlobalTurn() {
  return normalizeGlobalTurn(g("globalTurn"));
}

function readSkillLastUsed() {
  return normalizeSkillLastUsed(g("skillLastUsed"), SKILL_REGISTRY);
}

function recordCdRuntimeFailure(stage, error) {
  const evidence = {
    capability: "cdRuntime",
    stage,
    failure: { kind: "storageWrite", error: error?.message || String(error) },
  };
  writeDiagnosticSessionSnapshot(CD_RUNTIME_FAILURE_KEY, evidence);
  runDiagnosticConsoleAutomation({
    type: DiagnosticConsoleEvent.WARN,
    args: ["[HVAA] CD runtime failed", evidence],
  });
  return evidence;
}

/** 启动时把持久化的 globalTurn / skillLastUsed 灌进 g() runtime。Phase 5b-1 由 init.js 调用一次。 */
function loadCdState() {
  const result = loadCdRuntimeCheckpoint(SKILL_REGISTRY);
  g("globalTurn", result.state.globalTurn);
  g("skillLastUsed", result.state.skillLastUsed);
  if (result.failure) recordCdRuntimeFailure("load", result.failure);
  if (!lifecycleCheckpointBound && globalThis.window?.addEventListener) {
    globalThis.window.addEventListener("pagehide", () => persistCdState(true), { once: true });
    lifecycleCheckpointBound = true;
  }
}

/** 每 20 回合以及 pagehide 生命周期边界写一个原子 session checkpoint。 */
function persistCdState(lifecycleBoundary = false) {
  const result = persistCdRuntimeCheckpoint(
    { globalTurn: readGlobalTurn(), skillLastUsed: readSkillLastUsed() },
    lifecycleBoundary
  );
  if (result.outcome !== StorageWriteOutcome.FAILED) return true;
  recordCdRuntimeFailure("persist", result.error || new Error("checkpoint write failed"));
  return false;
}

/** runBattleTurnAutomation() 每 turn 入口调用一次。 */
function incrementGlobalTurn() {
  g("globalTurn", readGlobalTurn() + 1);
}

/**
 * 记录技能在当前 globalTurn 释放。dispatch 在 click 后调用。
 * @param {string} code SKILL_REGISTRY 的 key
 */
function recordFire(code) {
  if (!SKILL_REGISTRY[code]) return;
  const map = readSkillLastUsed();
  map[code] = readGlobalTurn();
  g("skillLastUsed", map);
}

/**
 * 计算单技能距离再次可施还有几回合。0=现可用。
 * @param {string} code
 * @returns {number}
 */
function turnsUntilReady(code) {
  const entry = SKILL_REGISTRY[code];
  if (!entry) return 0;
  const lastUsed = readSkillLastUsed()[code];
  if (lastUsed == null) return 0;
  // F3：用学到的真实 CD，但 Math.min(learned, cdBase) 夹住 —— 学习永不上调 CD（防被篡改成过大值）。
  // 即便学习值偏小也安全：真正开火仍以 snap.skillReady(DOM) 为权威，学习值只锐化前瞻 lookahead。
  const learnedCd = Number(runCdLearningAutomation({ type: CdLearningEvent.READ_CD, code }));
  const effectiveCd = Number.isFinite(learnedCd) ? Math.min(learnedCd, entry.cdBase) : entry.cdBase;
  const elapsedTurns = Math.max(0, readGlobalTurn() - lastUsed);
  return Math.max(0, effectiveCd - elapsedTurns);
}

/**
 * 一次性组装全 cdMap。snapshot.js 调用。
 * @returns {Record<string, number>}
 */
function collectCdMap() {
  const map = {};
  for (const code of Object.keys(SKILL_REGISTRY)) {
    map[code] = turnsUntilReady(code);
  }
  return map;
}

const cdRuntimeEventHandlers = Object.freeze({
  [EVENT_LOAD]: () => loadCdState(),
  [EVENT_PERSIST]: (event) => persistCdState(Boolean(event.lifecycleBoundary)),
  [EVENT_INCREMENT_TURN]: () => incrementGlobalTurn(),
  [EVENT_RECORD_FIRE]: (event) => recordFire(event.code),
  [EVENT_READ_TURNS]: (event) => turnsUntilReady(event.code),
  [EVENT_READ_MAP]: () => collectCdMap(),
  [EVENT_READ_GLOBAL_TURN]: () => readGlobalTurn(),
});

export function runCdRuntimeAutomation(event = { type: EVENT_READ_MAP }) {
  return cdRuntimeEventHandlers[event?.type]?.(event);
}
