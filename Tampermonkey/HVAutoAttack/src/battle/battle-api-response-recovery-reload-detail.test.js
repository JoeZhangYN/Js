import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BattleApiResponseRecoveryEvent,
  runBattleApiResponseRecovery,
} from "./battle-api-response-recovery.js";

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

describe("battle API response recovery reload detail", () => {
  it("passes recovery state into the default navigation reload detail", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const detail = rejectedDetail({ error: "server_error" });

    expect(
      runBattleApiResponseRecovery({
        type: BattleApiResponseRecoveryEvent.REJECTED_RESPONSE,
        detail,
      })
    ).toBe("reload");

    expect(JSON.parse(window.sessionStorage.getItem("HVAA:lastNavigationDecision"))).toMatchObject({
      decision: "accepted",
      commandReason: "battleApiResponse",
      detail: {
        detail: {
          repeatCount: 1,
          recoveryAction: "reload",
          detail,
        },
      },
    });
    expect(JSON.parse(window.sessionStorage.getItem("HVAA:battleApiRecovery"))).toMatchObject({
      repeatCount: 1,
      recoveryAction: "reload",
      reloadResult: true,
      detail,
    });
    warn.mockRestore();
  });
});
