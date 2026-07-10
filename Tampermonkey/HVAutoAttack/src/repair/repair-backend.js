// 维修后端能力：两世界使用相同 Armory HTTP 契约和相同业务调用。
// world 不参与此能力；工厂只绑定 POST 端口，实例闭包持有每轮 postoken。
// 逐件修（两世界都不批量）：止损/复验语义两世界同构；submitRepair 保留 ids 数组签名（不阉割批量能力），
// 编排器只传单元素，未来批量优化改编排器一处。
import { post as realPost } from "../dom/http.js";
import { RepairStateParseEvent, runRepairStateParser } from "./parse-repair-state.js";

const ARMORY_URL = "?s=Bazaar&ss=am&screen=repair";
const EVENT_CREATE = "create";

export const RepairBackendEvent = Object.freeze({
  CREATE: EVENT_CREATE,
});

/**
 * @param {(href:string, func:Function, parm?:string, type?:string, onFailure?:Function)=>void} [_post] 测试注入（默认真实 post）
 * @returns {{ fetchState:(cb:Function,onFailure?:Function)=>void, submitRepair:(ids:string[], cb:Function,onFailure?:Function)=>void }}
 */
function makeRepairBackend(post) {
  let token = null;

  return {
    fetchState(cb, onFailure) {
      post(
        ARMORY_URL,
        (text) => {
          const state = runRepairStateParser({
            type: RepairStateParseEvent.ARMORY,
            pageText: text,
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

export function createRepairBackendCapability(deps = {}) {
  const post = deps.post || realPost;
  return Object.freeze({
    create() {
      return makeRepairBackend(post);
    },
  });
}

const currentRepairBackend = createRepairBackendCapability();

export function runRepairBackendAutomation(event, deps = {}) {
  if (event?.type !== EVENT_CREATE) return undefined;
  return (deps.post ? createRepairBackendCapability(deps) : currentRepairBackend).create();
}
