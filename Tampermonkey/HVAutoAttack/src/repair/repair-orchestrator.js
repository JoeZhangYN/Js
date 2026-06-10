// 自动维修编排器（SHELL）：大厅页顺序异步 IO 链——扫描 → 决策 → 缺料买齐/停机 → 修 → 复验 → 开下一场。
// 替代旧 src/arena/repair-check.js（已删）。维修业务能力单一入口 `runRepair()`，两世界后端走端口对应。
//
// 不变量「装备未修好就不开下一场」：旧版（含 legacy）有三处缺陷导致破坏性死循环——
//   ① json 设值后永不释放 → 修理后的「重扫验证」永久挂起，lastID 止损形同虚设；
//   ② eqps 跨次扫描只 push 不清空，重扫累积脏数据；
//   ③ init.js 无条件开下一场与 repair 解耦 → 修理失败也照常开下一场，
//      「带坏装备继续打 → 坏得更多 → 再修又失败」无限循环（用户实测痛点）。
// 现重写：① ② 由「每轮 backend.fetchState 重取页 + 纯 decideRepair 算止损」天然消除；
//   ③ 由 init.js else-if 互斥（idleArena 调度收归本能力 proceed()，仅全达标才开下一场）解决。
// 缺料止损升级（用户要求「联动商店买齐再修，设上限」）：缺料且开 repairBuyMaterials → material-shop 端口
//   在 cap/余额/库存内自动买齐再修；超限/买不到 → 停机 + 标题三语告警（保留「修不动止损」语义）。
import { g } from "../state/store.js";
import { getOption } from "../state/option.js";
import { _alert } from "../core/lang.js";
import { isIsekai } from "../env.js";
import { idleArena } from "../arena/idle-arena.js";
import { makeRepairBackend } from "./repair-backend.js";
import { decideRepair } from "./decide-repair.js";
import { ensureMaterials } from "./material-shop.js";
import { getOptionDefault } from "../settings/schema.js";

/** 买料失败 reason → 三语停机文案。 */
const BUY_FAIL_MSG = {
  "credit-cap": ["⚠ 维修缺料，购买花费超过单轮上限，已停机", "⚠ 維修缺料，購買花費超過單輪上限，已停機", "⚠ Repair stopped: material cost exceeds per-run cap"],
  "insufficient-credits": ["⚠ 维修缺料，信用点不足，已停机", "⚠ 維修缺料，信用點不足，已停機", "⚠ Repair stopped: not enough credits for materials"],
  "no-stock": ["⚠ 维修缺料，物品商店库存不足，已停机", "⚠ 維修缺料，物品商店庫存不足，已停機", "⚠ Repair stopped: item shop out of stock"],
  "unknown-item": ["⚠ 维修缺料，无法识别所需材料，已停机", "⚠ 維修缺料，無法識別所需材料，已停機", "⚠ Repair stopped: unknown material"],
  "buy-error": ["⚠ 维修买料请求出错，已停机", "⚠ 維修買料請求出錯，已停機", "⚠ Repair stopped: buy request error"],
};
const STUCK_MSG = ["⚠ 装备修理失败，已停止自动竞技场，请检查信用点 / 装备", "⚠ 裝備修理失敗，已停止自動競技場，請檢查信用點 / 裝備", "⚠ Repair failed — idle arena stopped; check credits / equipment"];

/** 默认 idleArena 调度（与旧 repair-check.js proceed 同：jitter 90%-110%）。 */
function scheduleIdleArenaDefault() {
  setTimeout(
    idleArena,
    ((g("option").idleArenaTime * (Math.random() * 20 + 90)) / 100) * 1000
  );
}

/**
 * 自动维修入口。仅战斗外（init.js 战斗外分支）调用；repair 开启时 idleArena 由本函数独占调度。
 * @param {{ makeBackend?: typeof makeRepairBackend, buyMaterials?: typeof ensureMaterials, scheduleIdleArena?: () => void }} [deps] 测试注入
 */
export function runRepair(deps = {}) {
  const makeBackend = deps.makeBackend || makeRepairBackend;
  const buyMaterials = deps.buyMaterials || ensureMaterials;
  const scheduleIdleArena = deps.scheduleIdleArena || scheduleIdleArenaDefault;

  // repairValue 空字符串/null/非数值 → schema 默认（60%）。getOption 的 fallback 只挡 undefined，挡不住
  // 「开了维修但没填阈值」存的空字符串 ""，也挡不住 type=text 输入框里的非法值 "abc"（Number→NaN）；
  // 不兜底则 threshold=0 → 几乎不修（用户实测痛点）。注：用户显式填 "0" 视为有意（只修完全损坏），保留。
  const rawRepairValue = getOption("repairValue", "");
  const numRepairValue = Number(rawRepairValue);
  const opt = {
    repairValue:
      rawRepairValue === "" || rawRepairValue === null || Number.isNaN(numRepairValue)
        ? getOptionDefault("repairValue")
        : numRepairValue,
    repairBuyMaterials: getOption("repairBuyMaterials", false),
    repairCreditCap: getOption("repairCreditCap", 50000),
  };
  const backend = makeBackend(isIsekai);
  const repairedIds = []; // 本会话止损态：已提交修理的 id 累积（decideRepair 据此判 stuck）

  // 全达标 / 无需修理 → 若开了闲置竞技场，安排下一场（idleArena 调度收归本能力，init.js else-if 互斥）。
  function proceed() {
    if (g("option").idleArena) scheduleIdleArena();
  }
  function stop(msg) {
    document.title = _alert(-1, msg[0], msg[1], msg[2]);
  }
  function doRepair(ids) {
    repairedIds.push(...ids);
    backend.submitRepair(ids, scanAndRepair); // 修 → 回调重扫复验
  }

  function scanAndRepair() {
    backend.fetchState((state) => {
      const plan = decideRepair(opt, state, repairedIds);
      switch (plan.action) {
        case "proceed":
          proceed();
          return;
        case "stop-stuck":
          stop(STUCK_MSG);
          return;
        case "repair":
          if (opt.repairBuyMaterials) {
            buyMaterials(plan.materials, opt, (res) => {
              if (!res.ok) {
                stop(BUY_FAIL_MSG[res.reason] || STUCK_MSG);
                return;
              }
              doRepair(plan.repairIds);
            });
          } else {
            doRepair(plan.repairIds);
          }
          return;
        default:
          return;
      }
    });
  }

  scanAndRepair();
}
