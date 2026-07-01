import { beforeEach, describe, expect, it, vi } from "vitest";
import { runBattleApiBridgeAutomation } from "./battle-api-bridge.js";

function makeDeps() {
  return {
    readOptionField: vi.fn(),
    sessionStorage: window.sessionStorage,
    createScript: vi.fn(),
    appendHead: vi.fn(),
    readBattleApiWorldContext: vi.fn(),
    installApiResponseRecovery: vi.fn(),
    rejectApiBridgeEvent: vi.fn(() => false),
  };
}

function makeDefaultRejectDeps() {
  return {
    readOptionField: vi.fn(),
    sessionStorage: window.sessionStorage,
    createScript: vi.fn(),
    appendHead: vi.fn(),
    readBattleApiWorldContext: vi.fn(),
    installApiResponseRecovery: vi.fn(),
  };
}

beforeEach(() => {
  window.sessionStorage.clear();
});

describe("runBattleApiBridgeAutomation event rejection", () => {
  it("rejects unknown events through API recovery evidence", () => {
    const deps = makeDeps();

    expect(runBattleApiBridgeAutomation({ type: "unknown" }, deps)).toBe(false);

    expect(deps.rejectApiBridgeEvent).toHaveBeenCalledWith({ type: "unknown" });
    expect(deps.installApiResponseRecovery).not.toHaveBeenCalled();
    expect(deps.readBattleApiWorldContext).not.toHaveBeenCalled();
    expect(deps.appendHead).not.toHaveBeenCalled();
  });

  it("rejects null events through API recovery evidence instead of throwing", () => {
    const deps = makeDeps();

    expect(runBattleApiBridgeAutomation(null, deps)).toBe(false);

    expect(deps.rejectApiBridgeEvent).toHaveBeenCalledWith(null);
    expect(deps.installApiResponseRecovery).not.toHaveBeenCalled();
    expect(deps.readBattleApiWorldContext).not.toHaveBeenCalled();
    expect(deps.appendHead).not.toHaveBeenCalled();
  });

  it("records default unknown bridge events with bridge identity", () => {
    const deps = makeDefaultRejectDeps();

    expect(runBattleApiBridgeAutomation({ type: "unknown" }, deps)).toBe(false);

    expect(JSON.parse(window.sessionStorage.getItem("HVAA:battleApiRecovery"))).toMatchObject({
      repeatCount: 1,
      recoveryAction: "rejected",
      detail: {
        outcome: "rejected",
        reason: "unknownApiBridgeEvent",
        eventType: "unknown",
      },
    });
    expect(deps.installApiResponseRecovery).not.toHaveBeenCalled();
    expect(deps.appendHead).not.toHaveBeenCalled();
  });

  it("rejects API script installation when the recovery bridge cannot be installed", () => {
    const deps = makeDeps();
    deps.installApiResponseRecovery.mockReturnValue(false);

    expect(runBattleApiBridgeAutomation(undefined, deps)).toBe(false);

    expect(deps.rejectApiBridgeEvent).toHaveBeenCalledWith({
      type: "install",
      reason: "apiRecoveryBridgeInstallFailed",
    });
    expect(deps.readBattleApiWorldContext).not.toHaveBeenCalled();
    expect(deps.appendHead).not.toHaveBeenCalled();
  });

  it("records API bridge install step exceptions without throwing", () => {
    const deps = makeDeps();
    deps.readOptionField.mockImplementation(() => {
      throw new Error("option storage failed");
    });

    expect(runBattleApiBridgeAutomation(undefined, deps)).toBe(false);

    expect(deps.rejectApiBridgeEvent).toHaveBeenCalledWith({
      type: "install",
      reason: "apiBridgeInstallStepFailed",
      step: "readApiBridgeDelayOption",
      error: "option storage failed",
    });
    expect(deps.installApiResponseRecovery).not.toHaveBeenCalled();
    expect(deps.appendHead).not.toHaveBeenCalled();
  });

  it("records default API bridge install step exceptions with step evidence", () => {
    const deps = makeDefaultRejectDeps();
    deps.readOptionField.mockReturnValue(0);
    deps.installApiResponseRecovery.mockReturnValue(true);
    deps.readBattleApiWorldContext.mockImplementation(() => {
      throw new Error("world context failed");
    });

    expect(runBattleApiBridgeAutomation(undefined, deps)).toBe(false);

    expect(JSON.parse(window.sessionStorage.getItem("HVAA:battleApiRecovery"))).toMatchObject({
      repeatCount: 1,
      recoveryAction: "rejected",
      detail: {
        outcome: "rejected",
        reason: "apiBridgeInstallStepFailed",
        eventType: "install",
        step: "readBattleApiWorldContext",
        error: "world context failed",
      },
    });
    expect(deps.appendHead).not.toHaveBeenCalled();
  });
});
