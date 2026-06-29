import { beforeEach, describe, expect, it, vi } from "vitest";
import { g } from "./store.js";
import {
  BigSkillKillLearningEvent,
  runBigSkillKillLearningAutomation,
} from "./big-skill-kill-learner.js";

const mocks = vi.hoisted(() => ({
  runOptionAutomation: vi.fn(),
}));

vi.mock("./option.js", () => ({
  OptionEvent: Object.freeze({ READ_FIELD: "readField" }),
  runOptionAutomation: mocks.runOptionAutomation,
}));

const observedBoss = { mid: 100, hpMax: 5000, imperilActive: false };

beforeEach(() => {
  localStorage.clear();
  g("bigKillPending", null);
  mocks.runOptionAutomation.mockReset();
  mocks.runOptionAutomation.mockReturnValue(false);
});

const recordCast = (code, event = {}) =>
  runBigSkillKillLearningAutomation({
    type: BigSkillKillLearningEvent.RECORD_CAST,
    code,
    ...event,
  });

describe("big-skill kill record cast", () => {
  it("非 OFC/FRD -> 不记 pending", () => {
    recordCast("T3", { observedBosses: [observedBoss], globalTurn: 0 });
    expect(g("bigKillPending")).toBeFalsy();
  });

  it("无活 boss 观测 -> 不记 pending", () => {
    recordCast("OFC", { observedBosses: [], globalTurn: 0 });
    expect(g("bigKillPending")).toBeFalsy();
  });

  it("OFC + 活 boss 观测 -> 记 pending", () => {
    recordCast("OFC", {
      observedBosses: [{ ...observedBoss, imperilActive: true }],
      globalTurn: 5,
    });
    expect(g("bigKillPending").bosses[0]).toMatchObject({
      mid: 100,
      hpMax: 5000,
      imperilActive: true,
    });
  });

  it("缺失 globalTurn 不回退 ambient runtime turn", () => {
    g("globalTurn", 99);
    recordCast("OFC", { observedBosses: [observedBoss] });
    expect(g("bigKillPending").globalTurn).toBe(0);
  });
});
