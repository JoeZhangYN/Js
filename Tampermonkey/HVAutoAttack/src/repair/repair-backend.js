// 维修后端端口（真多态 + 工厂）：两世界各一实现，**唯一封装端点 / POST body / 页面解析的差异**。
// 这是维修业务能力的真实 bounded context 边界——与 HV 服务器的维修 HTTP 契约，两世界完全不同、可独立演进。
//
//   主世界 Persistent：GET `?s=Bazaar&ss=am&screen=repair`（原文取 eqitems/itemdata/postoken）；
//   异世界 Isekai：    GET `?s=Bazaar&ss=am&screen=repair`（原文取 eqitems/itemdata/postoken）；
//                      单件修 POST `postoken=${token}&eqids[]=${eid}`（postoken 由 fetchState 取，闭包内持有）。
//
// 统一端口形状 `{ fetchState(cb, onFailure), submitRepair(ids, cb, onFailure) }`——orchestrator 世界无关编排，isIsekai 仅在工厂分发一次。
// 逐件修（两世界都不批量）：止损/复验语义两世界同构；submitRepair 保留 ids 数组签名（不阉割批量能力），
// 编排器只传单元素，未来批量优化改编排器一处。
import { post as realPost } from "../dom/http.js";
import { RepairStateParseEvent, runRepairStateParser } from "./parse-repair-state.js";

const ARMORY_URL = "?s=Bazaar&ss=am&screen=repair";
const EVENT_CREATE = "create";

export const RepairBackendEvent = Object.freeze({
  CREATE: EVENT_CREATE,
});

const repairBackendEventHandlers = Object.freeze({
  [EVENT_CREATE]: (event, deps) => makeRepairBackend(Boolean(event.isIsekai), deps),
});

/**
 * @param {boolean} isIsekai env.isIsekai
 * @param {(href:string, func:Function, parm?:string, type?:string, onFailure?:Function)=>void} [_post] 测试注入（默认真实 post）
 * @returns {{ fetchState:(cb:Function,onFailure?:Function)=>void, submitRepair:(ids:string[], cb:Function,onFailure?:Function)=>void }}
 */
function makeRepairBackend(isIsekai, deps = {}) {
  const post = deps.post || realPost;
  let token = null; // isekai postoken：fetchState 取、submitRepair 用（每轮 fetchState 刷新，天然防过期）

  return {
    fetchState(cb, onFailure) {
      post(
        ARMORY_URL,
        (text) => {
          const state = runRepairStateParser({
            type: RepairStateParseEvent.ISEKAI,
            pageText: text,
            isIsekai,
          });
          token = state.token;
          cb(state);
        },
        null,
        "text",
        onFailure
      );
    },
    submitRepair(ids, cb, onFailure) {
      post(ARMORY_URL, () => cb(), `postoken=${token}&eqids[]=${ids[0]}`, undefined, onFailure);
    },
  };
}

export function runRepairBackendAutomation(event, deps = {}) {
  return repairBackendEventHandlers[event?.type]?.(event, deps);
}
