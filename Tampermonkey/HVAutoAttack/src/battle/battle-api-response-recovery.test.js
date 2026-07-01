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
  delete window.HVAA_battleApiRecovery;
  delete globalThis.unsafeWindow;
  window.sessionStorage.clear();
});

describe("runBattleApiResponseRecovery", () => {
  it("installs one page bridge that routes rejected responses through the recovery entry", () => {
    const deps = makeDeps();
    const target = {};
    const unsafeTarget = {};

    expect(
      runBattleApiResponseRecovery(
        { type: BattleApiResponseRecoveryEvent.INSTALL_BRIDGE, target, unsafeTarget },
        deps
      )
    ).toBe(true);

    const detail = rejectedDetail();
    expect(target.HVAA_battleApiRecovery.handleRejectedResponse(detail)).toBe("reload");
    expect(unsafeTarget.HVAA_battleApiRecovery).toBe(target.HVAA_battleApiRecovery);
    expect(deps.reload).toHaveBeenCalledWith(detail);
  });

  it("reloads once for a rejected API response with preserved evidence", () => {
    const deps = makeDeps();
    const detail = rejectedDetail({ error: "server_error" });

    expect(
      runBattleApiResponseRecovery(
        { type: BattleApiResponseRecoveryEvent.REJECTED_RESPONSE, detail },
        deps
      )
    ).toBe("reload");

    expect(deps.reload).toHaveBeenCalledWith(detail);
    expect(deps.pause).not.toHaveBeenCalled();
    expect(JSON.parse(window.sessionStorage.getItem("HVAA:battleApiRecovery"))).toMatchObject({
      repeatCount: 1,
      detail,
    });
  });

  it("pauses instead of reloading repeated same-cause API rejection loops", () => {
    const deps = makeDeps();
    const detail = rejectedDetail();
    const event = { type: BattleApiResponseRecoveryEvent.REJECTED_RESPONSE, detail };

    runBattleApiResponseRecovery(event, deps);
    expect(runBattleApiResponseRecovery(event, deps)).toBe("paused");

    expect(deps.reload).toHaveBeenCalledTimes(1);
    expect(deps.pause).toHaveBeenCalledTimes(1);
    expect(deps.warn).toHaveBeenCalledWith(
      "[HVAA] battle API response repeated; auto battle paused",
      expect.objectContaining({ repeatCount: 2, detail })
    );
  });

  it("does not treat different rejected response evidence as the same loop", () => {
    const deps = makeDeps();

    runBattleApiResponseRecovery(
      { type: BattleApiResponseRecoveryEvent.REJECTED_RESPONSE, detail: rejectedDetail() },
      deps
    );
    expect(
      runBattleApiResponseRecovery(
        {
          type: BattleApiResponseRecoveryEvent.REJECTED_RESPONSE,
          detail: rejectedDetail({ action: { mode: "item", item: 111 } }),
        },
        deps
      )
    ).toBe("reload");

    expect(deps.reload).toHaveBeenCalledTimes(2);
    expect(deps.pause).not.toHaveBeenCalled();
  });

  it("does not treat different battle worlds as the same recovery loop", () => {
    const deps = makeDeps();

    runBattleApiResponseRecovery(
      { type: BattleApiResponseRecoveryEvent.REJECTED_RESPONSE, detail: rejectedDetail() },
      deps
    );
    expect(
      runBattleApiResponseRecovery(
        {
          type: BattleApiResponseRecoveryEvent.REJECTED_RESPONSE,
          detail: rejectedDetail({
            world: { world: "isekai", apiJsonUrl: "https://hentaiverse.org/isekai/json" },
          }),
        },
        deps
      )
    ).toBe("reload");

    expect(deps.reload).toHaveBeenCalledTimes(2);
    expect(deps.pause).not.toHaveBeenCalled();
  });
});
