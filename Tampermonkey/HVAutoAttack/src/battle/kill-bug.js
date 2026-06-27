// HV 战斗 bug 检测：连续相同战斗代码超阈值则重载。
import { gE } from "../dom/query.js";
import { NavigationEvent, runNavigationAutomation } from "../core/navigate.js";

export function killBug() {
  // 在 HentaiVerse 发生导致 turn 损失的 bug 时发出警告并移除问题元素: https://ehwiki.org/wiki/HentaiVerse_Bugs_%26_Errors#Combat
  const bugLog = gE('#textlog > tbody > tr > td[class="tlb"]', "all");
  const isBug =
    /(Slot is currently not usable)|(Item does not exist)|(Inventory slot is empty)|(You do not have a powerup gem)/;
  for (let i = 0; i < bugLog.length; i++) {
    if (bugLog[i].textContent.match(isBug)) {
      bugLog[i].className = "tlbWARN";
      setTimeout(() => {
        // 间隔时间以避免持续刷新
        runNavigationAutomation({ type: NavigationEvent.RELOAD_NOW }); // 刷新移除问题元素
      }, 700);
    } else {
      bugLog[i].className = "tlbQRA";
    }
  }
}
