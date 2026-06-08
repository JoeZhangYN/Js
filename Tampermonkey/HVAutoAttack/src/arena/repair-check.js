// 装备耐久检查 + 自动修理触发。
//
// 不变量「装备未修好就不开下一场」：旧版（含 legacy）有三处缺陷导致破坏性死循环——
//   ① json 设值后永不释放 → 修理后的「重扫验证」(pollUntil !json) 永久挂起，lastID 的
//      「同一件再次低于阈值就放弃」止损逻辑形同虚设；
//   ② eqps 跨次扫描只 push 不清空，重扫会累积脏数据；
//   ③ init.js 无条件 setTimeout(idleArena) 与 repair 解耦 → 修理失败也照常开下一场，
//      「带坏装备继续打 → 装备坏得更多 → 再修又失败」无限循环（用户实测痛点）。
// 现重写为顺序链（扫描 → 修第一件 → 重扫验证）：每轮重取 json 自然消除 ① ②；
// idleArena 调度收归本函数 proceed()（init.js 改 else-if 互斥，见该处）解决 ③——
// 仅当全部达标才开下一场，修理失败(同一件修后仍低于阈值)则停机 + 标题告警。
import { gE } from "../dom/query.js";
import { g } from "../state/store.js";
import { post } from "../dom/http.js";
import { idleArena } from "./idle-arena.js";
import { _alert } from "../core/lang.js";

const CONDITION_RE = /Condition: \d+ \/ \d+ \((\d+)%\)/;

export function repairCheck() {
  // 上一轮已尝试修理的装备 id；重扫后仍低于阈值即判定修理失败，停机止损。
  let lastID;

  // 全部达标 / 无需修理 → 若开了闲置竞技场，安排下一场。
  // （repair 开启时 idleArena 由本函数独占调度，init.js 改 else-if 防双重开战。）
  function proceed() {
    if (g("option").idleArena)
      setTimeout(
        idleArena,
        ((g("option").idleArenaTime * (Math.random() * 20 + 90)) / 100) * 1000
      );
  }

  function scanAndRepair() {
    post("?s=Forge&ss=re", (data) => {
      post(
        gE("#mainpane>script[src]", data).src,
        (data1) => {
          const json = JSON.parse(data1.match(/{.*}/)[0]);
          const ids = Array.from(gE(".eqp>[id]", "all", data), (i) =>
            i.id.match(/\d+/)[0]
          );
          // 找第一件耐久 ≤ 阈值、需修理的装备；无 Condition 字段的项跳过（不再裸 [1] 崩溃）。
          const broken = ids.find((id) => {
            const m = json[id]?.d?.match(CONDITION_RE);
            return m && Number(m[1]) <= g("option").repairValue;
          });
          if (!broken) {
            proceed(); // 全部达标 → 继续下一场
            return;
          }
          if (broken === lastID) {
            // 修过这件仍未达标 → 修理失败（信用点不足 / 无法修理）→ 停机，不开下一场，避免装备进一步损坏。
            document.title = _alert(
              -1,
              "⚠ 装备修理失败，已停止自动竞技场，请检查信用点 / 装备",
              "⚠ 裝備修理失敗，已停止自動競技場，請檢查信用點 / 裝備",
              "⚠ Repair failed — idle arena stopped; check credits / equipment"
            );
            return;
          }
          lastID = broken;
          // 修这件 → 回调重新扫描验证是否修好（json 每轮重取，天然解决旧版永不释放的卡死）。
          post("?s=Forge&ss=re", scanAndRepair, `select_item=${broken}`);
        },
        null,
        "text"
      );
    });
  }

  scanAndRepair();
}
