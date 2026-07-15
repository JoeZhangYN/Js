import { beforeEach, describe, expect, it, vi } from "vitest";
import { RepairEvent, RepairStatus, runRepairAutomation } from "./repair-orchestrator.js";
import { g } from "../state/store.js";
import { OptionEvent, runOptionAutomation } from "../state/option.js";

function fakeBackend(rounds) {
  let i = 0;
  const submitted = [];
  const backend = {
    fetchState(callback) {
      callback(rounds[Math.min(i, rounds.length - 1)]);
    },
    submitRepair(ids, callback) {
      submitted.push(...ids);
      i += 1;
      callback();
    },
  };
  return { makeBackend: () => backend, submitted };
}

function eq(id, conditionPct, materials = []) {
  return { id: String(id), conditionPct, materials };
}
function st(equips) {
  return { token: null, equips };
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

    expect(runRepairAutomation({ type: "unknown" }, { makeBackend })).toBe(false);
    expect(runRepairAutomation(null, { makeBackend })).toBe(false);
    expect(makeBackend).not.toHaveBeenCalled();
  });

  it("无需修理 → 返回 READY，不反向调度下一场", async () => {
    const { makeBackend, submitted } = fakeBackend([st([eq(1, 100)])]);

    await expect(
      runRepairAutomation({ type: RepairEvent.START }, { makeBackend })
    ).resolves.toEqual({
      status: RepairStatus.READY,
      reason: "equipmentReady",
      repairedIds: [],
    });
    expect(submitted).toEqual([]);
  });

  it("修一件 → 复验达标 → 返回 READY", async () => {
    const { makeBackend, submitted } = fakeBackend([st([eq(1, 20)]), st([eq(1, 100)])]);

    const outcome = await runRepairAutomation({ type: RepairEvent.START }, { makeBackend });

    expect(submitted).toEqual(["1"]);
    expect(outcome).toEqual({
      status: RepairStatus.READY,
      reason: "equipmentReady",
      repairedIds: ["1"],
    });
    expect(document.title).toBe("");
  });

  it("修后仍坏 → 返回 BLOCKED，阻断所有下一场战斗", async () => {
    const { makeBackend, submitted } = fakeBackend([st([eq(1, 20)]), st([eq(1, 20)])]);

    const outcome = await runRepairAutomation({ type: RepairEvent.START }, { makeBackend });

    expect(submitted).toEqual(["1"]);
    expect(outcome).toMatchObject({ status: RepairStatus.BLOCKED, reason: "repairStuck" });
    expect(document.title).toContain("修理失败");
  });

  it("缺料 + buy 开 → 买齐再修 → 复验达标 → 返回 READY", async () => {
    runOptionAutomation({ type: OptionEvent.WRITE_FIELD, key: "repairBuyMaterials", value: true });
    const mats = [{ matId: "50000", name: "Repair Outfit", count: 3 }];
    const { makeBackend, submitted } = fakeBackend([st([eq(1, 20, mats)]), st([eq(1, 100)])]);
    const buyMaterials = vi.fn((event) => event.callback({ ok: true, bought: true, spent: 400 }));

    const outcome = await runRepairAutomation(
      { type: RepairEvent.START },
      { makeBackend, buyMaterials }
    );

    expect(buyMaterials).toHaveBeenCalledOnce();
    expect(buyMaterials.mock.calls[0][0].required).toEqual(mats);
    expect(submitted).toEqual(["1"]);
    expect(outcome.status).toBe(RepairStatus.READY);
  });

  it("买料超上限 → 返回 BLOCKED + 对应三语告警", async () => {
    runOptionAutomation({ type: OptionEvent.WRITE_FIELD, key: "repairBuyMaterials", value: true });
    const mats = [{ matId: "50000", name: "Repair Outfit", count: 3 }];
    const { makeBackend, submitted } = fakeBackend([st([eq(1, 20, mats)])]);
    const buyMaterials = vi.fn((event) => event.callback({ ok: false, reason: "credit-cap" }));

    const outcome = await runRepairAutomation(
      { type: RepairEvent.START },
      { makeBackend, buyMaterials }
    );

    expect(submitted).toEqual([]);
    expect(outcome).toMatchObject({ status: RepairStatus.BLOCKED, reason: "credit-cap" });
    expect(document.title).toContain("单轮上限");
  });

  it("买料缺少商店凭证 → 返回 BLOCKED + 对应三语告警", async () => {
    runOptionAutomation({ type: OptionEvent.WRITE_FIELD, key: "repairBuyMaterials", value: true });
    const mats = [{ matId: "50000", name: "Repair Outfit", count: 3 }];
    const { makeBackend, submitted } = fakeBackend([st([eq(1, 20, mats)])]);
    const buyMaterials = vi.fn((event) =>
      event.callback({ ok: false, reason: "missing-storetoken" })
    );

    const outcome = await runRepairAutomation(
      { type: RepairEvent.START },
      { makeBackend, buyMaterials }
    );

    expect(submitted).toEqual([]);
    expect(outcome).toMatchObject({
      status: RepairStatus.BLOCKED,
      reason: "missing-storetoken",
    });
    expect(document.title).toContain("商店凭证");
  });

  it("repairValue 留空('') → 回落默认 60% → 耐久 55% 的件被修", async () => {
    runOptionAutomation({ type: OptionEvent.WRITE_FIELD, key: "repairValue", value: "" });
    const { makeBackend, submitted } = fakeBackend([st([eq(1, 55)]), st([eq(1, 100)])]);

    await runRepairAutomation({ type: RepairEvent.START }, { makeBackend });

    expect(submitted).toEqual(["1"]);
  });

  it("repairValue 非法值('abc') → 回落默认 60%（非静默不修）", async () => {
    runOptionAutomation({ type: OptionEvent.WRITE_FIELD, key: "repairValue", value: "abc" });
    const { makeBackend, submitted } = fakeBackend([st([eq(1, 55)]), st([eq(1, 100)])]);

    await runRepairAutomation({ type: RepairEvent.START }, { makeBackend });

    expect(submitted).toEqual(["1"]);
  });

  it("repairValue 显式填 '0' → 保留（只修完全损坏）", async () => {
    runOptionAutomation({ type: OptionEvent.WRITE_FIELD, key: "repairValue", value: "0" });
    const { makeBackend, submitted } = fakeBackend([st([eq(1, 55)])]);

    const outcome = await runRepairAutomation({ type: RepairEvent.START }, { makeBackend });

    expect(submitted).toEqual([]);
    expect(outcome.status).toBe(RepairStatus.READY);
  });
});
