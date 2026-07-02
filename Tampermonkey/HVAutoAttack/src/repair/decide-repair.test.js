import { describe, it, expect } from "vitest";
import { RepairDecisionEvent, runRepairDecision } from "./decide-repair.js";

/** 主世界装备工厂（conditionPct 数值）。 */
function pEquip(id, conditionPct, materials = []) {
  return { id: String(id), conditionPct, materials };
}
/** 异世界装备工厂（conditionPct=null，需修由材料存在性判定）。 */
function iEquip(id, materials) {
  return { id: String(id), conditionPct: null, materials };
}
function state(equips, over = {}) {
  return { isIsekai: false, token: null, equips, ...over };
}

function decideRepair(option, repairState, repairedIds) {
  return runRepairDecision({
    type: RepairDecisionEvent.PLAN,
    option,
    state: repairState,
    repairedIds,
  });
}

describe("repair decision entry — event routing", () => {
  it("rejects unknown repair decision events without choosing a plan", () => {
    expect(
      runRepairDecision({
        type: "unknown",
        option: { repairValue: 50 },
        state: state([pEquip(1, 20)]),
        repairedIds: [],
      })
    ).toBeUndefined();
  });

  it("rejects null repair decision events without choosing a plan", () => {
    expect(runRepairDecision(null)).toBeUndefined();
  });
});

describe("repair decision entry — 选件 + 阈值", () => {
  it("无件 ≤ 阈值 → proceed", () => {
    const r = decideRepair({ repairValue: 50 }, state([pEquip(1, 80), pEquip(2, 100)]), []);
    expect(r).toEqual({ action: "proceed" });
  });

  it("一件 ≤ 阈值 → repair 该件 + 带回材料", () => {
    const mats = [{ matId: null, name: "Binding of Slaughter", count: 3 }];
    const r = decideRepair({ repairValue: 50 }, state([pEquip(1, 20, mats)]), []);
    expect(r).toEqual({ action: "repair", repairIds: ["1"], materials: mats });
  });

  it("多件低于阈值 → 选第一件（首轮）", () => {
    const r = decideRepair(
      { repairValue: 50 },
      state([pEquip(1, 90), pEquip(2, 30), pEquip(3, 10)]),
      []
    );
    expect(r.action).toBe("repair");
    expect(r.repairIds).toEqual(["2"]);
  });

  it("阈值边界：恰等于阈值算需修", () => {
    const r = decideRepair({ repairValue: 50 }, state([pEquip(1, 50)]), []);
    expect(r.action).toBe("repair");
  });
});

describe("repair decision entry — 止损（repairedIds）", () => {
  it("唯一需修件已修过仍坏 → stop-stuck", () => {
    const r = decideRepair({ repairValue: 50 }, state([pEquip(1, 20)]), ["1"]);
    expect(r).toEqual({ action: "stop-stuck", stuckIds: ["1"] });
  });

  it("首轮 repairedIds 空 → 永不误判 stuck", () => {
    const r = decideRepair({ repairValue: 50 }, state([pEquip(1, 20)]), []);
    expect(r.action).toBe("repair");
  });

  it("逐件推进：第一件修过仍坏但有未修的第二件 → 修第二件（不停机）", () => {
    const r = decideRepair({ repairValue: 50 }, state([pEquip(1, 20), pEquip(2, 20)]), ["1"]);
    expect(r).toEqual({ action: "repair", repairIds: ["2"], materials: [] });
  });

  it("所有需修件都修过仍坏 → stop-stuck（含全部 id）", () => {
    const r = decideRepair({ repairValue: 50 }, state([pEquip(1, 20), pEquip(2, 20)]), ["1", "2"]);
    expect(r).toEqual({ action: "stop-stuck", stuckIds: ["1", "2"] });
  });
});

describe("repair decision entry — 异世界（conditionPct=null，材料存在性判定）", () => {
  it("有需求材料 → 需修", () => {
    const mats = [{ matId: "50000", name: "Repair Outfit", count: 3 }];
    const r = decideRepair({ repairValue: 50 }, state([iEquip(100, mats)], { isIsekai: true }), []);
    expect(r).toEqual({ action: "repair", repairIds: ["100"], materials: mats });
  });

  it("无需求材料 → proceed（满修件 parse 已剔除，这里兜底）", () => {
    const r = decideRepair({ repairValue: 50 }, state([iEquip(100, [])], { isIsekai: true }), []);
    expect(r).toEqual({ action: "proceed" });
  });
});
