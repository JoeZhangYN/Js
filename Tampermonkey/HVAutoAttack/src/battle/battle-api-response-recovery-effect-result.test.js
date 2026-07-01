import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BattleApiResponseRecoveryEvent,
  runBattleApiResponseRecovery,
} from "./battle-api-response-recovery.js";

function makeDeps() {
  return {
    sessionStorage: window.sessionStorage,
    reload: vi.fn(),
    pause: vi.fn(),
    readDiagnosticEvidence: vi.fn(),
    warn: vi.fn(),
  };
}

function rejectedDetail(extra = {}) {
  return {
    responseKind: "jsonReload",
    status: 200,
    reload: true,
    world: { world: "persistent", apiJsonUrl: "https://hentaiverse.org/json" },
    action: { mode: "attack", target: 1 },
    ...extra,
  };
}

beforeEach(() => {
  window.sessionStorage.clear();
});

describe("battle API response recovery effect result evidence", () => {
  it("records accepted reload scheduling in recovery evidence", () => {
    const deps = makeDeps();
    deps.reload.mockReturnValue(true);
    const detail = rejectedDetail({ error: "server_error" });

    expect(
      runBattleApiResponseRecovery(
        { type: BattleApiResponseRecoveryEvent.REJECTED_RESPONSE, detail },
        deps
      )
    ).toBe("reload");

    expect(JSON.parse(window.sessionStorage.getItem("HVAA:battleApiRecovery"))).toMatchObject({
      repeatCount: 1,
      recoveryAction: "reload",
      reloadResult: true,
      detail,
    });
  });

  it("records rejected reload scheduling instead of claiming recovery effect success", () => {
    const deps = makeDeps();
    deps.reload.mockReturnValue(false);
    const detail = rejectedDetail({ error: "server_error" });

    runBattleApiResponseRecovery(
      { type: BattleApiResponseRecoveryEvent.REJECTED_RESPONSE, detail },
      deps
    );

    expect(JSON.parse(window.sessionStorage.getItem("HVAA:battleApiRecovery"))).toMatchObject({
      repeatCount: 1,
      recoveryAction: "reload",
      reloadResult: false,
      detail,
    });
  });

  it("records thrown reload scheduling as failed recovery evidence", () => {
    const deps = makeDeps();
    deps.reload.mockImplementation(() => {
      throw new Error("navigation bridge failed");
    });
    const detail = rejectedDetail({ error: "server_error" });

    expect(() =>
      runBattleApiResponseRecovery(
        { type: BattleApiResponseRecoveryEvent.REJECTED_RESPONSE, detail },
        deps
      )
    ).not.toThrow();

    expect(JSON.parse(window.sessionStorage.getItem("HVAA:battleApiRecovery"))).toMatchObject({
      repeatCount: 1,
      recoveryAction: "reload",
      reloadResult: false,
      reloadError: "navigation bridge failed",
      detail,
    });
    expect(deps.warn).toHaveBeenCalledWith(
      "[HVAA] battle API recovery effect failed",
      expect.objectContaining({ reloadResult: false, reloadError: "navigation bridge failed" })
    );
  });

  it("records accepted repeated-pause execution in recovery evidence", () => {
    const deps = makeDeps();
    deps.reload.mockReturnValue(true);
    deps.pause.mockReturnValue(true);
    const detail = rejectedDetail();
    const event = { type: BattleApiResponseRecoveryEvent.REJECTED_RESPONSE, detail };

    runBattleApiResponseRecovery(event, deps);
    expect(runBattleApiResponseRecovery(event, deps)).toBe("paused");

    expect(JSON.parse(window.sessionStorage.getItem("HVAA:battleApiRecovery"))).toMatchObject({
      repeatCount: 2,
      recoveryAction: "pause",
      pauseResult: true,
      detail,
    });
  });

  it("records thrown repeated-pause execution as failed recovery evidence", () => {
    const deps = makeDeps();
    deps.reload.mockReturnValue(true);
    deps.pause.mockImplementation(() => {
      throw new Error("pause bridge failed");
    });
    const detail = rejectedDetail();
    const event = { type: BattleApiResponseRecoveryEvent.REJECTED_RESPONSE, detail };

    runBattleApiResponseRecovery(event, deps);
    expect(() => runBattleApiResponseRecovery(event, deps)).not.toThrow();

    expect(JSON.parse(window.sessionStorage.getItem("HVAA:battleApiRecovery"))).toMatchObject({
      repeatCount: 2,
      recoveryAction: "pause",
      pauseResult: false,
      pauseError: "pause bridge failed",
      detail,
    });
    expect(deps.warn).toHaveBeenCalledWith(
      "[HVAA] battle API recovery effect failed",
      expect.objectContaining({ pauseResult: false, pauseError: "pause bridge failed" })
    );
  });

  it("records rejected repeated-pause execution in recovery evidence", () => {
    const deps = makeDeps();
    deps.reload.mockReturnValue(true);
    deps.pause.mockReturnValue(false);
    const detail = rejectedDetail();
    const event = { type: BattleApiResponseRecoveryEvent.REJECTED_RESPONSE, detail };

    runBattleApiResponseRecovery(event, deps);
    runBattleApiResponseRecovery(event, deps);

    expect(JSON.parse(window.sessionStorage.getItem("HVAA:battleApiRecovery"))).toMatchObject({
      repeatCount: 2,
      recoveryAction: "pause",
      pauseResult: false,
      detail,
    });
  });
});
