import { beforeEach, describe, expect, it, vi } from "vitest";
import { g } from "../state/store.js";
import { OptionEvent, runOptionAutomation } from "../state/option.js";
import {
  REPAIR_BACKEND_FAILURE_KEY,
  RepairEvent,
  runRepairAutomation,
} from "./repair-orchestrator.js";

beforeEach(() => {
  sessionStorage.clear();
  vi.restoreAllMocks();
  runOptionAutomation({
    type: OptionEvent.WRITE,
    option: { version: "10.0", idleArena: true, repairValue: 50 },
  });
  g("lang", 0);
  document.title = "";
});

describe("repair backend failure recovery", () => {
  it("stops idle arena when backend fetch-state fails", () => {
    const failure = { kind: "networkError", href: "?s=Forge&ss=re", retries: 4 };
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const backend = {
      fetchState: (_cb, onFailure) => onFailure(failure),
      submitRepair: vi.fn(),
    };
    const scheduleIdleArena = vi.fn();

    runRepairAutomation(
      { type: RepairEvent.START },
      { makeBackend: () => backend, scheduleIdleArena }
    );

    expect(scheduleIdleArena).not.toHaveBeenCalled();
    expect(backend.submitRepair).not.toHaveBeenCalled();
    expect(document.title).toContain("维修请求失败");
    expect(REPAIR_BACKEND_FAILURE_KEY).toBe("HVAA:lastRepairBackendFailure");
    expect(JSON.parse(sessionStorage.getItem(REPAIR_BACKEND_FAILURE_KEY))).toMatchObject({
      capability: "repairBackend",
      stage: "requestFailure",
      failure,
    });
    expect(warn).toHaveBeenCalledWith(
      "[HVAA] repair backend request failed",
      expect.objectContaining({
        capability: "repairBackend",
        stage: "requestFailure",
      })
    );
  });

  it("stops idle arena when backend submit-repair fails", () => {
    const failure = { kind: "httpStatus", href: "?s=Forge&ss=re", status: 500 };
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const backend = {
      fetchState: (cb) => cb({ equips: [{ id: "1", conditionPct: 20, materials: [] }] }),
      submitRepair: (_ids, _cb, onFailure) => onFailure(failure),
    };
    const scheduleIdleArena = vi.fn();

    runRepairAutomation(
      { type: RepairEvent.START },
      { makeBackend: () => backend, scheduleIdleArena }
    );

    expect(scheduleIdleArena).not.toHaveBeenCalled();
    expect(document.title).toContain("维修请求失败");
    expect(JSON.parse(sessionStorage.getItem(REPAIR_BACKEND_FAILURE_KEY))).toMatchObject({
      capability: "repairBackend",
      stage: "requestFailure",
      failure,
    });
  });

  it("still stops idle arena when backend failure diagnostics are blocked", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {
      throw new Error("console blocked");
    });
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(key, value) {
      if (key === REPAIR_BACKEND_FAILURE_KEY) throw new Error("session blocked");
      return Reflect.apply(originalSetItem, this, [key, value]);
    });
    const backend = {
      fetchState: (_cb, onFailure) => onFailure({ kind: "networkError", href: "/repair" }),
      submitRepair: vi.fn(),
    };
    const scheduleIdleArena = vi.fn();

    expect(() =>
      runRepairAutomation(
        { type: RepairEvent.START },
        { makeBackend: () => backend, scheduleIdleArena }
      )
    ).not.toThrow();

    expect(scheduleIdleArena).not.toHaveBeenCalled();
    expect(document.title).toContain("维修请求失败");
  });
});
