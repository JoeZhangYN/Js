// F3 回归锁：CD 收敛学习器。钉死「学习只下拉、永不上调」安全不变量 + 各守卫 + 消费方夹。
import { describe, it, expect, beforeEach, vi } from "vitest";
import { g } from "./store.js";
import { getValue, setValue } from "./storage.js";
import { STORAGE_KEYS } from "./persist-keys.js";
import { CdLearningEvent, runCdLearningAutomation } from "./cd-learner.js";
import { CdRuntimeEvent, runCdRuntimeAutomation } from "./cd-tracker.js";

const mocks = vi.hoisted(() => ({
  runDiagnosticConsoleAutomation: vi.fn(),
  runOptionAutomation: vi.fn(),
}));

vi.mock("../core/diagnostic-console.js", () => ({
  DiagnosticConsoleEvent: Object.freeze({ INFO: "info" }),
  runDiagnosticConsoleAutomation: mocks.runDiagnosticConsoleAutomation,
}));

vi.mock("./option.js", () => ({
  OptionEvent: Object.freeze({
    READ_FIELD: "readField",
  }),
  runOptionAutomation: mocks.runOptionAutomation,
}));

const fire = (code, id, globalTurn) =>
  runCdLearningAutomation({ type: CdLearningEvent.RECORD_FIRE, code, id, globalTurn });
const settle = (globalTurn, readyId) =>
  runCdLearningAutomation({
    type: CdLearningEvent.FINALIZE_PENDING,
    globalTurn,
    readySkillIds: readyId ? [readyId] : [],
  });
const readCd = (code) => runCdLearningAutomation({ type: CdLearningEvent.READ_CD, code });

beforeEach(() => {
  localStorage.clear();
  g("cdLearnPending", {});
  g("globalTurn", 0);
  g("skillLastUsed", {});
  mocks.runOptionAutomation.mockReset();
  mocks.runOptionAutomation.mockReturnValue(false);
  mocks.runDiagnosticConsoleAutomation.mockReset();
});

describe("cd-learner 学习与守卫", () => {
  it("脱灰 gap < cdBase → 学到更短 CD（OFC 50→25）", () => {
    fire("OFC", "1111", 10);
    settle(35, "1111"); // gap 25 < 50
    expect(readCd("OFC")).toBeCloseTo(25, 5);
  });

  it("gap > cdBase（OC 饿膨胀）→ clamp 到 cdBase，永不上调", () => {
    fire("OFC", "1111", 10);
    settle(70, "1111"); // gap 60 > 50 → sample clamp 50
    expect(readCd("OFC")).toBeCloseTo(50, 5);
  });

  it("同回合 gap<=0 → 不学（fallback cdBase）", () => {
    fire("OFC", "1111", 10);
    settle(10, "1111");
    expect(readCd("OFC")).toBe(50);
  });

  it("仍灰 → 续等，后续脱灰才结算", () => {
    fire("OFC", "1111", 10);
    settle(35, null); // skillReady 空 → 仍灰
    expect(readCd("OFC")).toBe(50);
    settle(40, "1111"); // gap 30
    expect(readCd("OFC")).toBeCloseTo(30, 5);
  });

  it("陈旧测量 gap > 3×cdBase → 弃，不学", () => {
    fire("OFC", "1111", 10);
    settle(200, "1111"); // gap 190 > 150 → 弃
    expect(readCd("OFC")).toBe(50);
  });

  it("EWMA：连续 gap=20 收敛到 20（OFC）", () => {
    for (let t = 0; t < 6; t++) {
      fire("OFC", "1111", t * 100);
      settle(t * 100 + 20, "1111");
    }
    expect(readCd("OFC")).toBeCloseTo(20, 0);
  });

  it("按 code 键：fightingStyle 变（id 2202→2102）学习连续", () => {
    fire("T2", "2202", 0);
    settle(3, "2202"); // gap 3 < cdBase 5 → 学 3
    expect(readCd("T2")).toBeCloseTo(3, 5);
    fire("T2", "2102", 100); // 风格切换 id 变，code 仍 T2
    settle(102, "2102"); // gap 2 → n=2 alpha 0.5: 3*.5+2*.5=2.5
    expect(readCd("T2")).toBeCloseTo(2.5, 5);
  });

  it("rejects unknown and null CD learning events without reading or changing learning state", () => {
    expect(readCd("NOPE")).toBe(0);
    g("cdLearnPending", { OFC: { firedTurn: 10, id: "1111" } });
    const getItem = vi.spyOn(Storage.prototype, "getItem");

    expect([
      runCdLearningAutomation({ type: "unknown", code: "OFC" }),
      runCdLearningAutomation(null),
      g("cdLearnPending"),
      getItem.mock.calls.length,
      mocks.runOptionAutomation.mock.calls.length,
    ]).toEqual([undefined, undefined, { OFC: { firedTurn: 10, id: "1111" } }, 0, 0]);
  });

  it("缺失 globalTurn 不回退 ambient runtime turn", () => {
    g("globalTurn", 99);
    fire("OFC", "1111");
    expect(g("cdLearnPending").OFC.firedTurn).toBe(0);

    settle(undefined, "1111");
    expect(readCd("OFC")).toBe(50);
  });

  it("normalizes malformed pending entries before finalizing", () => {
    g("cdLearnPending", {
      OFC: { firedTurn: "10.9", id: "1111" },
      T2: { firedTurn: "bad", id: "" },
      UNKNOWN: { firedTurn: 10, id: "9999" },
    });

    settle(35, "1111");

    expect(readCd("OFC")).toBeCloseTo(25, 5);
    expect(g("cdLearnPending")).toEqual({});
  });

  it("normalizes learned CD storage before reading and updating", () => {
    setValue(STORAGE_KEYS.LEARNED_CD, {
      OFC: { cd: 999, n: 2 },
      FRD: { cd: "bad", n: 1 },
      T2: { cd: 3.5, n: "2.8" },
      UNKNOWN: { cd: 1, n: 1 },
    });

    expect(readCd("OFC")).toBe(50);
    expect(readCd("FRD")).toBe(10);
    expect(readCd("T2")).toBe(3.5);

    fire("T2", "2202", 10);
    settle(12, "2202");
    expect(getValue(STORAGE_KEYS.LEARNED_CD, true)).toEqual({
      OFC: { cd: 50, n: 2 },
      T2: { cd: 3, n: 3 },
    });
  });

  it("日志开关通过 option entry 读取", () => {
    mocks.runOptionAutomation.mockReturnValue(true);

    fire("OFC", "1111", 10);
    settle(35, "1111");

    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({
      type: "readField",
      key: "dynamicHealLog",
      fallback: false,
    });
    expect(mocks.runDiagnosticConsoleAutomation).toHaveBeenCalled();
  });
});

describe("turnsUntilReady 用学习 CD（夹 Math.min cdBase）", () => {
  it("学到 OFC=20 → 开火 10 回合后剩 10（用 20 而非 50）", () => {
    fire("OFC", "1111", 0);
    settle(20, "1111"); // 学 20
    g("skillLastUsed", { OFC: 100 });
    g("globalTurn", 110);
    expect(runCdRuntimeAutomation({ type: CdRuntimeEvent.READ_TURNS, code: "OFC" })).toBe(10); // min(20,50)-10
  });

  it("未学习 → 退 cdBase 50（开火 10 回合后剩 40）", () => {
    g("skillLastUsed", { OFC: 100 });
    g("globalTurn", 110);
    expect(runCdRuntimeAutomation({ type: CdRuntimeEvent.READ_TURNS, code: "OFC" })).toBe(40);
  });
});
