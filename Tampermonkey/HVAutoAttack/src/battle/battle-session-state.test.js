import { describe, expect, it } from "vitest";
import {
  BattleSessionIdentitySource,
  classifyBattleRoundType,
  createBattleSessionSnapshot,
  normalizeBattleSessionSnapshot,
} from "./battle-session-state.js";

describe("battle session state", () => {
  it.each([
    ["Initializing arena challenge #5 (Round 1 / 5)", "ar"],
    ["Initializing arena challenge #105 (Round 1 / 1)", "rb"],
    ["Initializing random encounter", "ba"],
    ["Initializing Item World", "iw"],
    ["Initializing Grindfest", "gr"],
    ["Initializing The Tower", "tw"],
    ["Round begins", ""],
  ])("classifies %s as %s", (text, expected) => {
    expect(classifyBattleRoundType(text)).toBe(expected);
  });

  it("rejects malformed snapshots instead of inventing session identity", () => {
    expect(normalizeBattleSessionSnapshot({ version: 1, sessionId: "x" })).toBeNull();
    expect(
      createBattleSessionSnapshot("session-1", "ba", BattleSessionIdentitySource.INITIALIZATION_LOG)
    ).toMatchObject({
      sessionId: "session-1",
      phase: "active",
      identity: { roundType: "ba", source: "initializationLog" },
    });
  });
});
