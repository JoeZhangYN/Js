// 自动维修编排器（SHELL）：大厅页顺序异步 IO 链——扫描 → 决策 → 缺料买齐/停机 → 修 → 复验。
// 替代旧 src/arena/repair-check.js（已删）。维修业务能力单一入口 `runRepairAutomation(event)`，两世界后端走端口对应。
//
// 不变量「装备未修好就不开下一场」：旧版（含 legacy）有三处缺陷导致破坏性死循环——
//   ① json 设值后永不释放 → 修理后的「重扫验证」永久挂起，lastID 止损形同虚设；
//   ② eqps 跨次扫描只 push 不清空，重扫累积脏数据；
//   ③ 旧 composition root 无条件开下一场与 repair 解耦 → 修理失败也照常开下一场，
//      「带坏装备继续打 → 坏得更多 → 再修又失败」无限循环（用户实测痛点）。
// 现重写：① ② 由「每轮 backend.fetchState 重取页 + 纯 decideRepair 算止损」天然消除；
//   ③ 由类型化 READY/BLOCKED 结果交还下一场战斗仲裁器解决。
// 缺料止损升级（用户要求「联动商店买齐再修，设上限」）：缺料且开 repairBuyMaterials → material-shop 端口
//   在 cap/余额/库存内自动买齐再修；超限/买不到 → 停机 + 标题三语告警（保留「修不动止损」语义）。
import { OptionEvent, runOptionAutomation } from "../state/option.js";
import { _alert } from "../core/lang.js";
import { RepairBackendEvent, runRepairBackendAutomation } from "./repair-backend.js";
import { RepairDecisionEvent, runRepairDecision } from "./decide-repair.js";
import { MaterialShopEvent, runMaterialShopAutomation } from "./material-shop.js";
import { OptionSchemaEvent, runOptionSchema } from "../settings/schema.js";
import { recordRepairBackendFailure } from "./repair-backend-failure.js";
import { readRepairStopCopy } from "./repair-stop-copy.js";

const EVENT_START = "start";

export const RepairEvent = Object.freeze({
  START: EVENT_START,
});

export const RepairStatus = Object.freeze({
  READY: "ready",
  BLOCKED: "blocked",
});

export { REPAIR_BACKEND_FAILURE_KEY } from "./repair-backend-failure.js";

const repairEventHandlers = Object.freeze({
  [EVENT_START]: (_event, deps) => runRepair(deps),
});

/**
 * 自动维修实现。仅回答装备是否已达到下一场战斗的前置条件，不拥有战斗调度。
 * @param {{ makeBackend?: typeof runRepairBackendAutomation, buyMaterials?: typeof runMaterialShopAutomation }} [deps] 测试注入
 */
function runRepair(deps = {}) {
  const makeBackend = deps.makeBackend || runRepairBackendAutomation;
  const buyMaterials = deps.buyMaterials || runMaterialShopAutomation;
  return new Promise((resolve) => {
    let settled = false;
    const finish = (status, detail) => {
      if (settled) return;
      settled = true;
      resolve(Object.freeze({ status, ...detail }));
    };
    const ready = (detail = {}) => finish(RepairStatus.READY, detail);
    const stop = (msg, reason, detail = {}) => {
      document.title = _alert(-1, msg[0], msg[1], msg[2]);
      finish(RepairStatus.BLOCKED, { reason, ...detail });
    };
    const stopBackendFailure = (failure) => {
      const evidence = recordRepairBackendFailure(failure);
      stop(readRepairStopCopy("backendFailure"), "backendFailure", { failure, evidence });
      return evidence;
    };

    try {
      // repairValue 空字符串/null/非数值 → schema 默认（60%）；显式 "0" 仍视为有意。
      const readOptionField = (key, fallback) =>
        runOptionAutomation({ type: OptionEvent.READ_FIELD, key, fallback });
      const rawRepairValue = readOptionField("repairValue", "");
      const numRepairValue = Number(rawRepairValue);
      const opt = {
        repairValue:
          rawRepairValue === "" || rawRepairValue === null || Number.isNaN(numRepairValue)
            ? runOptionSchema({ type: OptionSchemaEvent.READ_DEFAULT, key: "repairValue" })
            : numRepairValue,
        repairBuyMaterials: readOptionField("repairBuyMaterials", false),
        repairCreditCap: readOptionField("repairCreditCap", 50000),
      };
      const backend = makeBackend({ type: RepairBackendEvent.CREATE });
      const repairedIds = [];

      function doRepair(ids) {
        repairedIds.push(...ids);
        try {
          backend.submitRepair(ids, scanAndRepair, stopBackendFailure);
        } catch (error) {
          stopBackendFailure({ kind: "exception", stage: "submitRepair", error: String(error) });
        }
      }

      function applyPlan(plan) {
        switch (plan.action) {
          case "proceed":
            ready({ reason: "equipmentReady", repairedIds: [...repairedIds] });
            return;
          case "stop-stuck":
            stop(readRepairStopCopy("repairStuck"), "repairStuck", { plan });
            return;
          case "repair":
            if (!opt.repairBuyMaterials) {
              doRepair(plan.repairIds);
              return;
            }
            try {
              buyMaterials({
                type: MaterialShopEvent.ENSURE_MATERIALS,
                required: plan.materials,
                option: opt,
                callback: (res) => {
                  if (!res.ok) {
                    stop(readRepairStopCopy(res.reason), res.reason || "materialBuyFailed", {
                      materialResult: res,
                    });
                    return;
                  }
                  doRepair(plan.repairIds);
                },
              });
            } catch (error) {
              stop(readRepairStopCopy("buy-error"), "buy-error", { error: String(error) });
            }
            return;
          default:
            stop(readRepairStopCopy("repairStuck"), "unknownRepairDecision", { plan });
        }
      }

      function scanAndRepair() {
        try {
          backend.fetchState(
            (state) =>
              applyPlan(
                runRepairDecision({
                  type: RepairDecisionEvent.PLAN,
                  option: opt,
                  state,
                  repairedIds,
                })
              ),
            stopBackendFailure
          );
        } catch (error) {
          stopBackendFailure({ kind: "exception", stage: "fetchState", error: String(error) });
        }
      }

      scanAndRepair();
    } catch (error) {
      stopBackendFailure({
        kind: "exception",
        stage: "createRepairWorkflow",
        error: String(error),
      });
    }
  });
}

export function runRepairAutomation(event = { type: EVENT_START }, deps = {}) {
  return repairEventHandlers[event?.type]?.(event, deps) || false;
}
