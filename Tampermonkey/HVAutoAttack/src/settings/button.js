// 浮动配置按钮（hvAAButton），点击展开/隐藏 optionBox。
import { gE, cE } from "../dom/query.js";
import { optionBox } from "./render.js";

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
      gE('select[name="lang"]').value = lang;
    }
  };
}
