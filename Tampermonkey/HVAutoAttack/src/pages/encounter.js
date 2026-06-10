// 遭遇检测：non-combat 页面的事件入口。
import { gE, cE } from "../dom/query.js";
import { setValue, getValue, delValue } from "../state/storage.js";
import { g } from "../state/store.js";
import { _alert } from "../core/lang.js";
import { post } from "../dom/http.js";
import { goto, openUrl } from "../core/navigate.js";
import { time } from "../core/time.js";
import { readStaminaValue } from "../state/stamina.js";

export function encounterCheck() {
  const timeNow = time(0);
  const encounter =
    getValue("encounter") &&
    getValue("encounter", true).dateNow === g("dateNow")
      ? getValue("encounter", true)
      : {
          dateNow: g("dateNow"),
          time: 0,
        };
  if (
    !encounter.lastTime ||
    (timeNow - encounter.lastTime >= 30 * 60 * 1000 && encounter.time < 24)
  ) {
    if (
      g("option").restoreStamina &&
      readStaminaValue() <= g("option").staminaLow
    ) {
      post(window.location.href, goto, "recover=stamina");
      return;
    }
    encounter.lastTime = timeNow;
    setValue("encounter", encounter);
    openUrl("https://e-hentai.org/news.php?encounter");
    return;
  }
  let lastEncounter;
  if (gE(".lastEncounter")) {
    lastEncounter = gE(".lastEncounter");
  } else {
    lastEncounter = gE("body").appendChild(cE("a"));
    lastEncounter.className = "lastEncounter";
    lastEncounter.title = `${time(3, encounter.lastTime)}\nEncounter TIme: ${
      encounter.time
    }`;
    lastEncounter.href = "https://e-hentai.org/news.php?encounter";
    lastEncounter.onclick = function () {
      if (
        encounter.time >= 24 &&
        _alert(1, "是否重置", "是否重置", "Whether to reset")
      )
        delValue("encounter");
    };
  }
  lastEncounter.innerHTML = `${Math.floor(
    (timeNow - encounter.lastTime) / 1000 / 60
  )}<l0>分钟前</l0><l1>分鐘前</l1><l2> mins before</l2>`;
  setTimeout(
    encounterCheck,
    (1 * 60 * 1000 * (Math.random() * 10 + 95)) / 100
  );
}
