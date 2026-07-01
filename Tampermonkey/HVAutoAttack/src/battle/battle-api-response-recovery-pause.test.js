import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BattleApiResponseRecoveryEvent,
  runBattleApiResponseRecovery,
} from "./battle-api-response-recovery.js";

const RECOVERY_KEY = "HVAA:battleApiRecovery";

function rejectedDetail() {
  return {
    responseKind: "jsonReload",
    status: 200,
    reload: true,
    world: { world: "persistent", apiJsonUrl: "https://hentaiverse.org/json" },
    action: { mode: "attack", target: 1 },
  };
}

function recoveryKey(detail) {
  return JSON.stringify({
    responseKind: detail.responseKind,
    status: detail.status,
    error: detail.error,
    reload: detail.reload,
    world: detail.world,
    action: detail.action,
  });
}

beforeEach(() => {
  window.sessionStorage.clear();
});

describe("battle API recovery pause evidence", () => {
  it("writes repeated API recovery state into pause evidence on the default path", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const detail = rejectedDetail();
    window.sessionStorage.setItem(
      RECOVERY_KEY,
      JSON.stringify({ key: recoveryKey(detail), repeatCount: 1, detail })
    );

    expect(
      runBattleApiResponseRecovery({
        type: BattleApiResponseRecoveryEvent.REJECTED_RESPONSE,
        detail,
      })
    ).toBe("paused");

    expect(JSON.parse(window.sessionStorage.getItem("HVAA:lastBattlePause"))).toMatchObject({
      reason: "battleApiResponseRepeated",
      detail: { repeatCount: 2, detail },
    });
    warn.mockRestore();
  });
});
