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

describe("battle API recovery malformed JSON identity", () => {
  it("does not treat different malformed JSON parse failures as the same loop", () => {
    const deps = makeDeps();

    runBattleApiResponseRecovery(
      {
        type: BattleApiResponseRecoveryEvent.REJECTED_RESPONSE,
        detail: rejectedDetail({ responseKind: "malformedJson", parseError: "Unexpected token <" }),
      },
      deps
    );

    expect(
      runBattleApiResponseRecovery(
        {
          type: BattleApiResponseRecoveryEvent.REJECTED_RESPONSE,
          detail: rejectedDetail({
            responseKind: "malformedJson",
            parseError: "Unexpected end of JSON input",
          }),
        },
        deps
      )
    ).toBe("reload");

    expect(deps.reload).toHaveBeenCalledTimes(2);
    expect(deps.pause).not.toHaveBeenCalled();
  });
});
