import { vi } from "vitest";

const mocks = vi.hoisted(() => ({
  runDiagnosticConsoleAutomation: vi.fn(() => true),
  runEncounterAutomation: vi.fn(),
  isAutomaticEncounterEnabled: vi.fn(() => true),
  runIdleArenaAutomation: vi.fn(),
  runOptionAutomation: vi.fn(),
  runRepairAutomation: vi.fn(),
  runStaminaAutomation: vi.fn(),
}));

vi.mock("../core/diagnostic-console.js", () => ({
  DiagnosticConsoleEvent: Object.freeze({ WARN: "warn" }),
  runDiagnosticConsoleAutomation: mocks.runDiagnosticConsoleAutomation,
}));
vi.mock("../state/option.js", () => ({
  OptionEvent: Object.freeze({ READ_FIELD: "readField" }),
  runOptionAutomation: mocks.runOptionAutomation,
}));
vi.mock("../repair/repair-orchestrator.js", () => ({
  RepairEvent: Object.freeze({ START: "start" }),
  RepairStatus: Object.freeze({ READY: "ready", BLOCKED: "blocked" }),
  runRepairAutomation: mocks.runRepairAutomation,
}));
vi.mock("../state/stamina.js", () => ({
  StaminaEvent: Object.freeze({ SHOULD_STOP_AUTOMATIC_BATTLE: "shouldStopAutomaticBattle" }),
  runStaminaAutomation: mocks.runStaminaAutomation,
}));
vi.mock("../arena/idle-arena.js", () => ({
  IdleArenaEvent: Object.freeze({
    PLAN_NEXT_BATTLE: "planNextBattle",
    START_NEXT_BATTLE: "startNextBattle",
  }),
  runIdleArenaAutomation: mocks.runIdleArenaAutomation,
}));
vi.mock("./encounter.js", () => ({
  EncounterEvent: Object.freeze({ LOBBY_TICK: "lobbyTick" }),
  EncounterLobbyStatus: Object.freeze({
    CLAIMED: "claimed",
    WAITING: "waiting",
    DEGRADED: "degraded",
    STOPPED_FOR_DAY: "stoppedForDay",
  }),
  runEncounterAutomation: mocks.runEncounterAutomation,
}));
vi.mock("./encounter-option-gate.js", () => ({
  isAutomaticEncounterEnabled: mocks.isAutomaticEncounterEnabled,
}));

export const START = Date.parse("2026-06-27T01:00:00.000Z");
let option = {};
let idleDelayMs = 0;

export function waitingAfter(delayMs, status = "waiting") {
  return { status, reason: "cooldown", resumeAtMs: Date.now() + delayMs };
}

export function setIdleDelay(delayMs) {
  idleDelayMs = delayMs;
}

export function setNextBattleOption(key, value) {
  option[key] = value;
}

export function resetNextBattleArbitrationFixture() {
  vi.useFakeTimers();
  vi.setSystemTime(START);
  option = { repair: true, idleArena: true };
  idleDelayMs = 10 * 60 * 1000;
  for (const fn of Object.values(mocks)) fn.mockReset();
  mocks.runDiagnosticConsoleAutomation.mockReturnValue(true);
  mocks.isAutomaticEncounterEnabled.mockReturnValue(true);
  mocks.runOptionAutomation.mockImplementation((event) => option[event.key] ?? event.fallback);
  mocks.runRepairAutomation.mockResolvedValue({ status: "ready", reason: "equipmentReady" });
  mocks.runStaminaAutomation.mockReturnValue(false);
  mocks.runEncounterAutomation.mockResolvedValue(waitingAfter(5 * 60 * 1000));
  mocks.runIdleArenaAutomation.mockImplementation((event) => {
    if (event.type === "planNextBattle") {
      return {
        status: "planned",
        reason: "idleArenaDelay",
        delayMs: idleDelayMs,
        deadlineMs: event.nowMs + idleDelayMs,
      };
    }
    return { status: "battleRequested", reason: "battleRequest" };
  });
}

export function cleanupNextBattleArbitrationFixture() {
  vi.clearAllTimers();
  vi.useRealTimers();
}

export { mocks };
