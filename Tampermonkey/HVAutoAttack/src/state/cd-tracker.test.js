import { beforeEach, describe, expect, it } from "vitest";
import { CdRuntimeEvent, runCdRuntimeAutomation } from "./cd-tracker.js";
import { getValue, setValue } from "./storage.js";
import { STORAGE_KEYS } from "./persist-keys.js";
import { g } from "./store.js";

beforeEach(() => {
  localStorage.clear();
  g("globalTurn", 0);
  g("skillLastUsed", {});
});

describe("cd tracker runtime persistence", () => {
  it("loads persisted turn state into runtime", () => {
    setValue(STORAGE_KEYS.GLOBAL_TURN, 12);
    setValue(STORAGE_KEYS.SKILL_LAST_USED, { OFC: 7 });

    runCdRuntimeAutomation({ type: CdRuntimeEvent.LOAD });

    expect(g("globalTurn")).toBe(12);
    expect(g("skillLastUsed")).toEqual({ OFC: 7 });
  });

  it("increments, records skill fire, and persists runtime state", () => {
    runCdRuntimeAutomation({ type: CdRuntimeEvent.INCREMENT_TURN });
    runCdRuntimeAutomation({ type: CdRuntimeEvent.INCREMENT_TURN });
    runCdRuntimeAutomation({ type: CdRuntimeEvent.RECORD_FIRE, code: "OFC" });

    runCdRuntimeAutomation({ type: CdRuntimeEvent.PERSIST });

    expect(getValue(STORAGE_KEYS.GLOBAL_TURN, true)).toBe(2);
    expect(getValue(STORAGE_KEYS.SKILL_LAST_USED, true)).toEqual({ OFC: 2 });
  });

  it("computes remaining turns from runtime state", () => {
    g("globalTurn", 20);
    g("skillLastUsed", { OFC: 10 });

    expect(runCdRuntimeAutomation({ type: CdRuntimeEvent.READ_TURNS, code: "OFC" })).toBe(40);
  });

  it("reads global turn through the runtime entry", () => {
    g("globalTurn", 20);

    expect(runCdRuntimeAutomation({ type: CdRuntimeEvent.READ_GLOBAL_TURN })).toBe(20);
  });
});
