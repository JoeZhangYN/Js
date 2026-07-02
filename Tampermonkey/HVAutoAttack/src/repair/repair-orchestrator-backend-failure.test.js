import { beforeEach, describe, expect, it, vi } from "vitest";
import { g } from "../state/store.js";
import { OptionEvent, runOptionAutomation } from "../state/option.js";
import { RepairEvent, runRepairAutomation } from "./repair-orchestrator.js";

beforeEach(() => {
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
    expect(warn).toHaveBeenCalledWith("[HVAA] repair backend request failed", failure);
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
  });
});
