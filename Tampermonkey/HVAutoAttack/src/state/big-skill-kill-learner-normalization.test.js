import { beforeEach, describe, expect, it, vi } from "vitest";
import { g } from "./store.js";
import { getValue, setValue } from "./storage.js";
import { STORAGE_KEYS } from "./persist-keys.js";
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

const boss = (over = {}) => ({
  monsterId: 100,
  isBoss: true,
  isDead: false,
  hpMax: 5000,
  buffs: [],
  ...over,
});

beforeEach(() => {
  localStorage.clear();
  g("bigKillPending", null);
  mocks.runOptionAutomation.mockReset();
  mocks.runOptionAutomation.mockReturnValue(false);
});

function run(event) {
  return runBigSkillKillLearningAutomation(event);
}

function observe({ killed = true, t = 0 }) {
  run({
    type: BigSkillKillLearningEvent.RECORD_CAST,
    code: "OFC",
    snap: { view: [boss()], globalTurn: t },
  });
  run({
    type: BigSkillKillLearningEvent.FINALIZE_PENDING,
    snap: { view: [boss({ isDead: killed })], globalTurn: t + 1 },
  });
}

describe("big-skill kill learner normalization", () => {
  it("normalizes pending cast observations before storing", () => {
    run({
      type: BigSkillKillLearningEvent.RECORD_CAST,
      code: "FRD",
      snap: {
        view: [boss({ monsterId: "100.9", hpMax: "5000.8", buffs: "bad" })],
        globalTurn: "5.9",
      },
    });

    expect(g("bigKillPending")).toEqual({
      globalTurn: 5,
      skill: "FRD",
      bosses: [{ mid: 100, hpMax: 5000.8, imperilActive: false }],
    });
  });

  it("normalizes malformed pending state before finalizing", () => {
    g("bigKillPending", {
      globalTurn: "7.9",
      skill: "OFC",
      bosses: [
        { mid: "100.9", hpMax: "5000.8", imperilActive: "" },
        { mid: "bad", hpMax: 1, imperilActive: true },
      ],
    });

    run({
      type: BigSkillKillLearningEvent.FINALIZE_PENDING,
      snap: { view: [boss({ monsterId: 100, isDead: true })], globalTurn: "8.9" },
    });

    expect(getValue(STORAGE_KEYS.LEARNED_BIG_KILL, true)).toEqual({
      100: {
        OFC: {
          killProbNoIm: 1,
          nNoIm: 1,
          killProbWithIm: 0,
          nWithIm: 0,
          lastHpMax: 5000.8,
        },
      },
    });
  });

  it("normalizes learned big-kill storage before skip decisions and updates", () => {
    setValue(STORAGE_KEYS.LEARNED_BIG_KILL, {
      100: {
        OFC: {
          killProbNoIm: 2,
          nNoIm: "4.8",
          killProbWithIm: "bad",
          nWithIm: -1,
          lastHpMax: "5000.5",
        },
        UNKNOWN: { killProbNoIm: 1, nNoIm: 99 },
      },
      bad: { OFC: { killProbNoIm: 1, nNoIm: 4 } },
    });

    expect(
      run({
        type: BigSkillKillLearningEvent.WILL_KILL_BOSS,
        mid: 100,
        snap: { cdMap: { OFC: 0 }, oc: 250, view: [boss()] },
        opt: { skipImperilWhenOfcKills: true },
      }).skip
    ).toBe(true);

    observe({ killed: false, t: 500 });
    expect(getValue(STORAGE_KEYS.LEARNED_BIG_KILL, true)).toEqual({
      100: {
        OFC: {
          killProbNoIm: 0.8,
          nNoIm: 5,
          killProbWithIm: 0,
          nWithIm: 0,
          lastHpMax: 5000,
        },
      },
    });
  });
});
