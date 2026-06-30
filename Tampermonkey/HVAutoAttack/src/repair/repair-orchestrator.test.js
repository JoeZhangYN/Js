import { describe, it, expect, beforeEach, vi } from "vitest";
import { RepairEvent, runRepairAutomation } from "./repair-orchestrator.js";
import { g } from "../state/store.js";
import { OptionEvent, runOptionAutomation } from "../state/option.js";

/** 序列化 backend：fetchState 依次返 rounds[i]；submitRepair 记录并推进 i。 */
function fakeBackend(rounds) {
  let i = 0;
  const submitted = [];
  const backend = {
    fetchState(cb) {
      cb(rounds[Math.min(i, rounds.length - 1)]);
    },
    submitRepair(ids, cb) {
      submitted.push(...ids);
      i += 1;
      cb();
    },
  };
  return { makeBackend: () => backend, submitted };
}

function eq(id, conditionPct, materials = []) {
  return { id: String(id), conditionPct, materials };
}
function st(equips) {
  return { isIsekai: false, token: null, equips };
}

beforeEach(() => {
  runOptionAutomation({
    type: OptionEvent.WRITE,
    option: { version: "10.0", idleArena: true, repairValue: 50 },
  });
  g("lang", 0);
  document.title = "";
});

describe("repair automation entry", () => {
  it("rejects unknown repair automation events without scanning or scheduling", () => {
    const makeBackend = vi.fn();
    const scheduleIdleArena = vi.fn();

    expect(runRepairAutomation({ type: "unknown" }, { makeBackend, scheduleIdleArena })).toBe(false);
    expect(makeBackend).not.toHaveBeenCalled();
    expect(scheduleIdleArena).not.toHaveBeenCalled();
  });

  it("无需修理 → 直接开下一场（不修）", () => {
    const { makeBackend, submitted } = fakeBackend([st([eq(1, 100)])]);
    const scheduleIdleArena = vi.fn();
    runRepairAutomation({ type: RepairEvent.START }, { makeBackend, scheduleIdleArena });
    expect(submitted).toEqual([]);
    expect(scheduleIdleArena).toHaveBeenCalledOnce();
  });

  it("无需修理但 idleArena 关闭 → 不调度下一场", () => {
    runOptionAutomation({ type: OptionEvent.WRITE_FIELD, key: "idleArena", value: false });
    const { makeBackend, submitted } = fakeBackend([st([eq(1, 100)])]);
    const scheduleIdleArena = vi.fn();

    runRepairAutomation({ type: RepairEvent.START }, { makeBackend, scheduleIdleArena });

    expect(submitted).toEqual([]);
    expect(scheduleIdleArena).not.toHaveBeenCalled();
  });

  it("修一件 → 复验达标 → 开下一场（buy 关）", () => {
    const { makeBackend, submitted } = fakeBackend([st([eq(1, 20)]), st([eq(1, 100)])]);
    const scheduleIdleArena = vi.fn();
    runRepairAutomation({ type: RepairEvent.START }, { makeBackend, scheduleIdleArena });
    expect(submitted).toEqual(["1"]);
    expect(scheduleIdleArena).toHaveBeenCalledOnce();
    expect(document.title).toBe("");
  });

  it("修后仍坏 → 止损停机，不开下一场", () => {
    const { makeBackend, submitted } = fakeBackend([st([eq(1, 20)]), st([eq(1, 20)])]);
    const scheduleIdleArena = vi.fn();
    runRepairAutomation({ type: RepairEvent.START }, { makeBackend, scheduleIdleArena });
    expect(submitted).toEqual(["1"]);
    expect(scheduleIdleArena).not.toHaveBeenCalled();
    expect(document.title).toContain("修理失败");
  });

  it("缺料 + buy 开 → 买齐再修 → 复验达标 → 开下一场", () => {
    runOptionAutomation({ type: OptionEvent.WRITE_FIELD, key: "repairBuyMaterials", value: true });
    const mats = [{ matId: "50000", name: "Repair Outfit", count: 3 }];
    const { makeBackend, submitted } = fakeBackend([st([eq(1, 20, mats)]), st([eq(1, 100)])]);
    const scheduleIdleArena = vi.fn();
    const buyMaterials = vi.fn((event) => event.callback({ ok: true, bought: true, spent: 400 }));
    runRepairAutomation(
      { type: RepairEvent.START },
      { makeBackend, buyMaterials, scheduleIdleArena }
    );
    expect(buyMaterials).toHaveBeenCalledOnce();
    expect(buyMaterials.mock.calls[0][0].required).toEqual(mats);
    expect(submitted).toEqual(["1"]);
    expect(scheduleIdleArena).toHaveBeenCalledOnce();
  });

  it("买料超上限 → 停机 + 对应三语告警，不修不开下一场", () => {
    runOptionAutomation({ type: OptionEvent.WRITE_FIELD, key: "repairBuyMaterials", value: true });
    const mats = [{ matId: "50000", name: "Repair Outfit", count: 3 }];
    const { makeBackend, submitted } = fakeBackend([st([eq(1, 20, mats)])]);
    const scheduleIdleArena = vi.fn();
    const buyMaterials = vi.fn((event) => event.callback({ ok: false, reason: "credit-cap" }));
    runRepairAutomation(
      { type: RepairEvent.START },
      { makeBackend, buyMaterials, scheduleIdleArena }
    );
    expect(submitted).toEqual([]);
    expect(scheduleIdleArena).not.toHaveBeenCalled();
    expect(document.title).toContain("单轮上限");
  });

  // A4 反退化：repairValue 留空/非法 → 回落 schema 默认 60%（也间接锁 schema.repairValue.default 存在——
  // 若 schema 删该条目，默认值入口返 undefined → threshold 0 → 55% 不修 → 本用例红）。
  it("repairValue 留空('') → 回落默认 60% → 耐久 55% 的件被修", () => {
    runOptionAutomation({ type: OptionEvent.WRITE_FIELD, key: "repairValue", value: "" });
    const { makeBackend, submitted } = fakeBackend([st([eq(1, 55)]), st([eq(1, 100)])]);
    const scheduleIdleArena = vi.fn();
    runRepairAutomation({ type: RepairEvent.START }, { makeBackend, scheduleIdleArena });
    expect(submitted).toEqual(["1"]);
    expect(scheduleIdleArena).toHaveBeenCalledOnce();
  });

  it("repairValue 非法值('abc') → 回落默认 60%（非静默不修）", () => {
    runOptionAutomation({ type: OptionEvent.WRITE_FIELD, key: "repairValue", value: "abc" });
    const { makeBackend, submitted } = fakeBackend([st([eq(1, 55)]), st([eq(1, 100)])]);
    runRepairAutomation({ type: RepairEvent.START }, { makeBackend, scheduleIdleArena: vi.fn() });
    expect(submitted).toEqual(["1"]);
  });

  it("repairValue 显式填 '0' → 保留（只修完全损坏，55% 不修 → 直接开下一场）", () => {
    runOptionAutomation({ type: OptionEvent.WRITE_FIELD, key: "repairValue", value: "0" });
    const { makeBackend, submitted } = fakeBackend([st([eq(1, 55)])]);
    const scheduleIdleArena = vi.fn();
    runRepairAutomation({ type: RepairEvent.START }, { makeBackend, scheduleIdleArena });
    expect(submitted).toEqual([]);
    expect(scheduleIdleArena).toHaveBeenCalledOnce();
  });
});
