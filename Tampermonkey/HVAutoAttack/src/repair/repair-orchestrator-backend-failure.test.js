import { beforeEach, describe, expect, it, vi } from "vitest";
import { g } from "../state/store.js";
import { OptionEvent, runOptionAutomation } from "../state/option.js";

const mocks = vi.hoisted(() => ({
  runDiagnosticConsoleAutomation: vi.fn(),
}));

vi.mock("../core/diagnostic-console.js", () => ({
  DiagnosticConsoleEvent: Object.freeze({ WARN: "warn" }),
  runDiagnosticConsoleAutomation: mocks.runDiagnosticConsoleAutomation,
}));

import {
  REPAIR_BACKEND_FAILURE_KEY,
  RepairEvent,
  RepairStatus,
  runRepairAutomation,
} from "./repair-orchestrator.js";

beforeEach(() => {
  sessionStorage.clear();
  vi.restoreAllMocks();
  mocks.runDiagnosticConsoleAutomation.mockReset();
  runOptionAutomation({
    type: OptionEvent.WRITE,
    option: { version: "10.0", idleArena: true, repairValue: 50 },
  });
  g("lang", 0);
  document.title = "";
});

describe("repair backend failure recovery", () => {
  it("returns BLOCKED when backend fetch-state fails", async () => {
    const failure = { kind: "networkError", href: "?s=Forge&ss=re", retries: 4 };
    const backend = {
      fetchState: (_cb, onFailure) => onFailure(failure),
      submitRepair: vi.fn(),
    };
    const outcome = await runRepairAutomation(
      { type: RepairEvent.START },
      { makeBackend: () => backend }
    );

    expect(outcome).toMatchObject({ status: RepairStatus.BLOCKED, reason: "backendFailure" });
    expect(backend.submitRepair).not.toHaveBeenCalled();
    expect(document.title).toContain("维修请求失败");
    expect(REPAIR_BACKEND_FAILURE_KEY).toBe("HVAA:lastRepairBackendFailure");
    expect(JSON.parse(sessionStorage.getItem(REPAIR_BACKEND_FAILURE_KEY))).toMatchObject({
      capability: "repairBackend",
      stage: "requestFailure",
      failure,
    });
    expect(mocks.runDiagnosticConsoleAutomation).toHaveBeenCalledWith({
      type: "warn",
      args: [
        "[HVAA] repair backend request failed",
        expect.objectContaining({
          capability: "repairBackend",
          stage: "requestFailure",
        }),
      ],
    });
  });

  it("returns BLOCKED when backend submit-repair fails", async () => {
    const failure = { kind: "httpStatus", href: "?s=Forge&ss=re", status: 500 };
    const backend = {
      fetchState: (cb) => cb({ equips: [{ id: "1", conditionPct: 20, materials: [] }] }),
      submitRepair: (_ids, _cb, onFailure) => onFailure(failure),
    };
    const outcome = await runRepairAutomation(
      { type: RepairEvent.START },
      { makeBackend: () => backend }
    );

    expect(outcome.status).toBe(RepairStatus.BLOCKED);
    expect(document.title).toContain("维修请求失败");
    expect(JSON.parse(sessionStorage.getItem(REPAIR_BACKEND_FAILURE_KEY))).toMatchObject({
      capability: "repairBackend",
      stage: "requestFailure",
      failure,
    });
  });

  it("still returns BLOCKED when backend failure diagnostics are blocked", async () => {
    mocks.runDiagnosticConsoleAutomation.mockImplementation(() => false);
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(key, value) {
      if (key === REPAIR_BACKEND_FAILURE_KEY) throw new Error("session blocked");
      return Reflect.apply(originalSetItem, this, [key, value]);
    });
    const backend = {
      fetchState: (_cb, onFailure) => onFailure({ kind: "networkError", href: "/repair" }),
      submitRepair: vi.fn(),
    };
    const outcome = await runRepairAutomation(
      { type: RepairEvent.START },
      { makeBackend: () => backend }
    );

    expect(outcome.status).toBe(RepairStatus.BLOCKED);
    expect(document.title).toContain("维修请求失败");
  });
});
