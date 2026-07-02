import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleRoundStartLogEvent, runBattleRoundStartLog } from "./round-start-log.js";

const mocks = vi.hoisted(() => ({
  gE: vi.fn(),
}));

vi.mock("../dom/query.js", () => ({ gE: mocks.gE }));

beforeEach(() => {
  mocks.gE.mockReset();
});

describe("runBattleRoundStartLog", () => {
  it("reads the current battle textlog as a plain round-start snapshot", () => {
    mocks.gE.mockReturnValue([
      { textContent: "Round begins" },
      { textContent: "Initializing random encounter" },
    ]);

    expect(runBattleRoundStartLog({ type: BattleRoundStartLogEvent.READ_CURRENT })).toEqual({
      rows: ["Round begins", "Initializing random encounter"],
      firstText: "Round begins",
      initializingText: "Initializing random encounter",
    });
    expect(mocks.gE).toHaveBeenCalledWith("#textlog>tbody>tr>td", "all");
  });

  it("returns an empty snapshot for unknown events", () => {
    expect(runBattleRoundStartLog({ type: "unknown" })).toEqual({
      rows: [],
      firstText: "",
      initializingText: "",
    });
    expect(runBattleRoundStartLog(null)).toEqual({
      rows: [],
      firstText: "",
      initializingText: "",
    });

    expect(mocks.gE).not.toHaveBeenCalled();
  });
});
