// 小马验证页自动化编排入口：composition root 只调用本入口。
import { gE } from "../dom/query.js";
import { NavigationEvent, runNavigationAutomation } from "../core/navigate.js";
import { OptionEvent, runOptionAutomation } from "../state/option.js";
import { runRiddleAnsweringSession } from "./riddle.js";

const EVENT_RIDDLE_PAGE = "riddlePage";
const EVENT_BATTLE_POST_RESULT = "battlePostResult";
const EVENT_TEST_POPUP_PRETREAT = "testPopupPretreat";
const RIDDLE_WINDOW_NAME = "riddleWindow";
const RIDDLE_WINDOW_FEATURES = "resizable,scrollbars,width=1241,height=707";

export const RiddleEvent = Object.freeze({
  RIDDLE_PAGE: EVENT_RIDDLE_PAGE,
  BATTLE_POST_RESULT: EVENT_BATTLE_POST_RESULT,
  TEST_POPUP_PRETREAT: EVENT_TEST_POPUP_PRETREAT,
});

function openRiddlePopup() {
  return runNavigationAutomation({
    type: NavigationEvent.OPEN_WINDOW,
    url: window.location.href,
    name: RIDDLE_WINDOW_NAME,
    features: RIDDLE_WINDOW_FEATURES,
  });
}

function isRiddlePopupEnabled() {
  return Boolean(
    runOptionAutomation({
      type: OptionEvent.READ_FIELD,
      key: "riddlePopup",
      fallback: false,
    })
  );
}

function testPopupPretreat(deps = {}) {
  const schedule = deps.schedule || setTimeout;
  schedule(() => {
    const riddleWindow = openRiddlePopup();
    if (riddleWindow) schedule(() => riddleWindow.close(), 200);
  }, 3000);
  return true;
}

function answerCurrentRiddlePage() {
  if (isRiddlePopupEnabled() && !window.opener) {
    openRiddlePopup();
    return;
  }
  runRiddleAnsweringSession();
}

function handleBattlePostResult(data) {
  if (!gE("#riddlecounter", data)) return false;
  if (isRiddlePopupEnabled() && !window.opener) {
    openRiddlePopup();
    return true;
  }
  runNavigationAutomation({ type: NavigationEvent.RELOAD_NOW });
  return true;
}

export function runRiddleAutomation(event = { type: EVENT_RIDDLE_PAGE }) {
  if (event.type === EVENT_TEST_POPUP_PRETREAT) return testPopupPretreat(event.deps);
  if (event.type === EVENT_BATTLE_POST_RESULT) {
    return handleBattlePostResult(event.data);
  }
  answerCurrentRiddlePage();
  return true;
}
