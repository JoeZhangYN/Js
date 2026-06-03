// 浮动配置按钮（hvAAButton），点击展开/隐藏 optionBox。
import { gE, cE } from "../dom/query.js";
import { optionBox } from "./render.js";
import { g } from "../state/store.js";

export function optionButton(lang) {
  //
  const optionButton = gE("body").appendChild(cE("div"));
  optionButton.className = "hvAAButton";
  optionButton.onclick = function () {
    if (gE("#hvAABox")) {
      gE("#hvAABox").style.display =
        gE("#hvAABox").style.display === "none" ? "block" : "none";
    } else {
      optionBox();
      gE("#hvAATab-Main").style.zIndex = 1;
      // option 已装填时 select[name=lang] 由 render.js 回填循环（if(g("option"))）统一设值，
      // 不再二次覆盖（单一回填路径）；仅首次设置（option 尚未落盘、回填循环跳过）用 lang 兜底。
      if (!g("option")) gE('select[name="lang"]').value = lang;
    }
  };
}
