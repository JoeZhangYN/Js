// 维修后端端口（真多态 + 工厂）：两世界各一实现，**唯一封装端点 / POST body / 页面解析的差异**。
// 这是维修业务能力的真实 bounded context 边界——与 HV 服务器的维修 HTTP 契约，两世界完全不同、可独立演进。
//
//   主世界 Persistent：GET `?s=Forge&ss=re`（页 + dynjs 脚本两次取）；单件修 POST `select_item=${eid}`。
//   异世界 Isekai：    GET `?s=Bazaar&ss=am&screen=repair`（原文取 eqitems/itemdata/postoken）；
//                      单件修 POST `postoken=${token}&eqids[]=${eid}`（postoken 由 fetchState 取，闭包内持有）。
//
// 统一端口形状 `{ fetchState(cb), submitRepair(ids, cb) }`——orchestrator 世界无关编排，isIsekai 仅在工厂分发一次。
// 逐件修（两世界都不批量）：止损/复验语义两世界同构；submitRepair 保留 ids 数组签名（不阉割批量能力），
// 编排器只传单元素，未来批量优化改编排器一处。
import { post as realPost } from "../dom/http.js";
import { gE } from "../dom/query.js";
import { RepairStateParseEvent, runRepairStateParser } from "./parse-repair-state.js";

const FORGE_URL = "?s=Forge&ss=re";
const ARMORY_URL = "?s=Bazaar&ss=am&screen=repair";
const EVENT_CREATE = "create";

export const RepairBackendEvent = Object.freeze({
  CREATE: EVENT_CREATE,
});

/**
 * @param {boolean} isIsekai env.isIsekai
 * @param {(href:string, func:Function, parm?:string, type?:string)=>void} [_post] 测试注入（默认真实 post）
 * @returns {{ fetchState:(cb:Function)=>void, submitRepair:(ids:string[], cb:Function)=>void }}
 */
function makeRepairBackend(isIsekai, deps = {}) {
  const post = deps.post || realPost;
  let token = null; // isekai postoken：fetchState 取、submitRepair 用（每轮 fetchState 刷新，天然防过期）

  if (isIsekai) {
    return {
      fetchState(cb) {
        post(
          ARMORY_URL,
          (text) => {
            const state = runRepairStateParser({
              type: RepairStateParseEvent.ISEKAI,
              pageText: text,
            });
            token = state.token;
            cb(state);
          },
          null,
          "text"
        );
      },
      submitRepair(ids, cb) {
        const id = ids[0];
        post(ARMORY_URL, () => cb(), `postoken=${token}&eqids[]=${id}`);
      },
    };
  }

  return {
    fetchState(cb) {
      post(FORGE_URL, (pageDoc) => {
        // dynjs 脚本：对齐 HVUT `script[src*="/dynjs/"]`（旧 `#mainpane>script[src]` 在真实维修页取不到
        // → 空耐久 → 静默不修）；保留旧选择器作 fallback。
        const scriptEl =
          gE('script[src*="/dynjs/"]', pageDoc) || gE("#mainpane>script[src]", pageDoc);
        if (!scriptEl) {
          // 维修页无 dynjs 脚本（异常页）→ 空状态（orchestrator 会 proceed，不崩）
          cb(
            runRepairStateParser({
              type: RepairStateParseEvent.PERSISTENT,
              pageDoc,
              dynjsText: "",
            })
          );
          return;
        }
        // dynjs 内容随耐久变化但 URL 稳定 → 必须 cache-bust，否则修后复验（orchestrator 修一件后回调
        // scanAndRepair 重取）命中缓存读到修理前旧耐久 → 误判「修不动」stop-stuck 停掉挂机
        // （对齐 HVUT load_dynjs 的 `src + '?t=' + Date.now()`）。
        const dynjsUrl =
          scriptEl.src + (scriptEl.src.includes("?") ? "&" : "?") + "t=" + Date.now();
        post(
          dynjsUrl,
          (dynjsText) =>
            cb(
              runRepairStateParser({
                type: RepairStateParseEvent.PERSISTENT,
                pageDoc,
                dynjsText,
              })
            ),
          null,
          "text"
        );
      });
    },
    submitRepair(ids, cb) {
      post(FORGE_URL, () => cb(), `select_item=${ids[0]}`);
    },
  };
}

export function runRepairBackendAutomation(event, deps = {}) {
  if (event.type !== EVENT_CREATE) return undefined;
  return makeRepairBackend(Boolean(event.isIsekai), deps);
}
