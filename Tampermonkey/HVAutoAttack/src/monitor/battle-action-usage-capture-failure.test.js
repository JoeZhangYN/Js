import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BattleActionUsageCaptureEvent,
  runBattleActionUsageCapture,
} from "./battle-action-usage-capture.js";

afterEach(() => {
  sessionStorage.clear();
  vi.restoreAllMocks();
});

function deps({ info, recordUsage = true, log = [] } = {}) {
  return {
    gE: vi.fn((selector, mode) => {
      if (selector === "#textlog>tbody>tr>td" && mode === "all") return log;
      return undefined;
    }),
    readOptionField: vi.fn((key, fallback) => (key === "recordUsage" ? recordUsage : fallback)),
    unsafeWindow: { info },
  };
}

function clearPendingUsage() {
  runBattleActionUsageCapture(
    { type: BattleActionUsageCaptureEvent.ACTION_STARTED },
    deps({ recordUsage: false })
  );
}

function expectCaptureFailure(stage) {
  expect(
    JSON.parse(sessionStorage.getItem("HVAA:lastBattleActionUsageCaptureFailure"))
  ).toMatchObject({ capability: "battleActionUsageCapture", stage });
}

describe("runBattleActionUsageCapture failure evidence", () => {
  it("records missing action info without leaving pending usage", () => {
    clearPendingUsage();

    expect(
      runBattleActionUsageCapture({ type: BattleActionUsageCaptureEvent.ACTION_STARTED }, deps())
    ).toBeUndefined();

    expectCaptureFailure("action-start-info");
    expect(
      runBattleActionUsageCapture(
        { type: BattleActionUsageCaptureEvent.ACTION_ENDED },
        deps({ log: [{ textContent: "old log" }] })
      )
    ).toBeUndefined();
  });

  it("falls back to skill labels when action element lookup fails", () => {
    clearPendingUsage();
    const runtime = deps({ info: { mode: "magic", skill: "#spell" } });
    runtime.gE.mockImplementation(() => {
      throw new Error("dom blocked");
    });

    expect(
      runBattleActionUsageCapture({ type: BattleActionUsageCaptureEvent.ACTION_STARTED }, runtime)
    ).toEqual({ mode: "magic", magic: "#spell", mp: 0, oc: 0 });
    expectCaptureFailure("action-start-magic");
  });

  it("records battle log lookup failures while completing pending usage", () => {
    clearPendingUsage();
    runBattleActionUsageCapture(
      { type: BattleActionUsageCaptureEvent.ACTION_STARTED },
      deps({ info: { mode: "attack", skill: "attack" } })
    );
    const runtime = deps();
    runtime.gE.mockImplementation(() => {
      throw new Error("log blocked");
    });

    expect(
      runBattleActionUsageCapture({ type: BattleActionUsageCaptureEvent.ACTION_ENDED }, runtime)
    ).toEqual({ mode: "attack", log: [] });
    expectCaptureFailure("action-end-log");
  });

  it("fails closed when recordUsage option reads throw", () => {
    clearPendingUsage();
    const runtime = deps({ info: { mode: "attack", skill: "attack" } });
    runtime.readOptionField.mockImplementation(() => {
      throw new Error("option blocked");
    });

    expect(
      runBattleActionUsageCapture({ type: BattleActionUsageCaptureEvent.ACTION_STARTED }, runtime)
    ).toBeUndefined();
    expectCaptureFailure("action-start-option");
  });
});
