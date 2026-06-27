// 小马验证页自动化编排入口：composition root 只调用本入口。
import { gE } from "../dom/query.js";
import { goto } from "../core/navigate.js";
import { g } from "../state/store.js";
import { riddleAlert } from "./riddle.js";

const EVENT_RIDDLE_PAGE = "riddlePage";
const EVENT_BATTLE_POST_RESULT = "battlePostResult";

export const RiddleEvent = Object.freeze({
  RIDDLE_PAGE: EVENT_RIDDLE_PAGE,
  BATTLE_POST_RESULT: EVENT_BATTLE_POST_RESULT,
});

function openRiddlePopup() {
  window.open(
    window.location.href,
    "riddleWindow",
    "resizable,scrollbars,width=1241,height=707"
  );
}

function answerCurrentRiddlePage() {
  if (g("option").riddlePopup && !window.opener) {
    openRiddlePopup();
    return;
  }
  riddleAlert();
}

function handleBattlePostResult(data) {
  if (!gE("#riddlecounter", data)) return false;
  if (g("option").riddlePopup && !window.opener) {
    openRiddlePopup();
    return true;
  }
  goto();
  return true;
}

export function runRiddleAutomation(event = { type: EVENT_RIDDLE_PAGE }) {
  if (event.type === EVENT_BATTLE_POST_RESULT) {
    return handleBattlePostResult(event.data);
  }
  answerCurrentRiddlePage();
  return true;
}
