import { beforeEach, describe, expect, it, vi } from "vitest";
import { g } from "./store.js";
import { getValue, setValue } from "./storage.js";
import { STORAGE_KEYS } from "./persist-keys.js";
import { normalizeLegacyBigKillMap } from "./learned-monster-legacy-normalize.js";
import {
  BigSkillKillLearningEvent,
  runBigSkillKillLearningAutomation,
} from "./big-skill-kill-learner.js";
import {
  LearnedMonsterFamily,
  LearnedMonsterStoreEvent,
  runLearnedMonsterStoreAutomation,
} from "./learned-monster-store.js";

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
  runLearnedMonsterStoreAutomation({ type: LearnedMonsterStoreEvent.RESET_RUNTIME });
  g("bigKillPending", null);
  mocks.runOptionAutomation.mockReset();
  mocks.runOptionAutomation.mockReturnValue(false);
});

function run(event) {
  return runBigSkillKillLearningAutomation(event);
}

function readLearnedMap() {
  return runLearnedMonsterStoreAutomation({
    type: LearnedMonsterStoreEvent.READ_MAP,
    family: LearnedMonsterFamily.BIG_KILL,
  });
}

function observe({ killed = true, t = 0 }) {
  run({
    type: BigSkillKillLearningEvent.RECORD_CAST,
    code: "OFC",
    globalTurn: t,
    observedBosses: [{ mid: 100, hpMax: 5000, imperilActive: false }],
  });
  return run({
    type: BigSkillKillLearningEvent.FINALIZE_PENDING,
    liveMonsterIds: killed ? [] : [100],
    globalTurn: t + 1,
  });
}

describe("big-skill kill learner normalization", () => {
  it("normalizes pending cast observations before storing", () => {
    run({
      type: BigSkillKillLearningEvent.RECORD_CAST,
      code: "FRD",
      globalTurn: "5.9",
      observedBosses: [{ mid: "100.9", hpMax: "5000.8", imperilActive: "" }],
    });

    expect(g("bigKillPending")).toEqual({
      globalTurn: 5,
      skill: "FRD",
      bosses: [{ mid: 100, hpMax: 5000.8, imperilActive: false }],
    });
  });

  it("normalizes malformed pending state before finalizing", async () => {
    g("bigKillPending", {
      globalTurn: "7.9",
      skill: "OFC",
      bosses: [
        { mid: "100.9", hpMax: "5000.8", imperilActive: "" },
        { mid: "bad", hpMax: 1, imperilActive: true },
      ],
    });

    const result = run({
      type: BigSkillKillLearningEvent.FINALIZE_PENDING,
      liveMonsterIds: ["bad"],
      globalTurn: "8.9",
    });

    expect(await result.completion).toBe(true);
    expect(readLearnedMap()).toEqual({
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

  it("normalizes learned big-kill storage before skip decisions and updates", async () => {
    const legacyValue = {
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
    };
    setValue(STORAGE_KEYS.LEARNED_BIG_KILL, legacyValue);
    const normalized = normalizeLegacyBigKillMap(legacyValue);
    await runLearnedMonsterStoreAutomation({
      type: LearnedMonsterStoreEvent.UPSERT_MANY,
      family: LearnedMonsterFamily.BIG_KILL,
      records: Object.entries(normalized).map(([id, value]) => ({ id, value })),
    });

    expect(
      run({
        type: BigSkillKillLearningEvent.WILL_KILL_BOSS,
        mid: 100,
        ofcCooldown: 0,
        overcharge: 250,
        bossHpMax: boss().hpMax,
        opt: { skipImperilWhenOfcKills: true },
      }).skip
    ).toBe(true);

    const update = observe({ killed: false, t: 500 });
    expect(await update.completion).toBe(true);
    expect(readLearnedMap()).toEqual({
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
    expect(getValue(STORAGE_KEYS.LEARNED_BIG_KILL, true)).toEqual(legacyValue);
  });
});
