// 小马验证页自动化编排入口：composition root 只调用本入口。
import { g } from "../state/store.js";
import { riddleAlert } from "./riddle.js";

function openRiddlePopup() {
  window.open(
    window.location.href,
    "riddleWindow",
    "resizable,scrollbars,width=1241,height=707"
  );
}

export function runRiddleAutomation() {
  if (g("option").riddlePopup && !window.opener) {
    openRiddlePopup();
    return;
  }
  riddleAlert();
}
