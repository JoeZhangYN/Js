// 战斗事件监听：eventStart / eventEnd 虚拟节点 + 回合切换 + post 拉新数据。
// 风险点：内嵌 fakeApiCall 字符串 + 多个闭包变量。Phase 5 不重构此文件。
// file-size-gate: exempt phase-4-monolith
import { gE, cE } from "../dom/query.js";
import { delValue } from "../state/storage.js";
import { g } from "../state/store.js";
import { scheduleReload } from "../core/navigate.js";
import { post } from "../dom/http.js";
import { time } from "../core/time.js";
import { setAlarm } from "../alarm/alarm.js";
import { MAIN_URL } from "../env.js";
import {
  BattleMonitorEvent,
  runBattleMonitorAutomation,
} from "../monitor/battle-monitor-automation.js";
import { RiddleEvent, runRiddleAutomation } from "../pages/riddle-automation.js";
import { newRound } from "./new-round.js";
import { main } from "./main-loop.js";

export function reloader() {
  let delayAlert;
  let delayReload;
  const eventStart = cE("a");
  eventStart.id = "eventStart";
  eventStart.onclick = function () {
    if (g("option").delayAlert)
      delayAlert = setTimeout(setAlarm, g("option").delayAlertTime * 1000);
    if (g("option").delayReload)
      delayReload = scheduleReload(g("option").delayReloadTime);
    runBattleMonitorAutomation({ type: BattleMonitorEvent.ACTION_STARTED });
  };
  gE("body").appendChild(eventStart);
  const eventEnd = cE("a");
  eventEnd.id = "eventEnd";
  eventEnd.onclick = function () {
    const timeNow = time(0);
    g("runSpeed", (1000 / (timeNow - g("timeNow"))).toFixed(2));
    g("timeNow", timeNow);
    if (g("option").delayAlert) clearTimeout(delayAlert);
    if (g("option").delayReload) clearTimeout(delayReload);
    const monsterDead = gE('img[src*="nbardead"]', "all").length;
    g("monsterAlive", g("monsterAll") - monsterDead);
    const bossDead = gE(
      'div.btm1[style*="opacity"] div.btm2[style*="background"]',
      "all"
    ).length;
    g("bossAlive", g("bossAll") - bossDead);
    runBattleMonitorAutomation({ type: BattleMonitorEvent.ACTION_ENDED });
    if (gE("#btcp")) {
      runBattleMonitorAutomation({
        type: BattleMonitorEvent.COMPLETION_REACHED,
      });
      if (g("monsterAlive") > 0) {
        // Defeat
        setAlarm("Defeat");
        delValue(2);
      } else if (g("roundNow") !== g("roundAll")) {
        // Next Round
        gE("#pane_completion").removeChild(gE("#btcp"));
        post(window.location.href, (data) => {
          if (
            runRiddleAutomation({
              type: RiddleEvent.BATTLE_POST_RESULT,
              data,
            })
          ) return;
          gE("#battle_main").replaceChild(
            gE("#battle_right", data),
            gE("#battle_right")
          );
          gE("#battle_main").replaceChild(
            gE("#battle_left", data),
            gE("#battle_left")
          );
          unsafeWindow.battle = new unsafeWindow.Battle();
          unsafeWindow.battle.clear_infopane();
          newRound();
          main();
        });
      } else if (g("roundNow") === g("roundAll")) {
        // Victory
        setAlarm("Victory");
        delValue(2);
        scheduleReload(3);
      }
    } else {
      main();
    }
  };
  gE("body").appendChild(eventEnd);
  window.sessionStorage.delay = g("option").delay;
  window.sessionStorage.delay2 = g("option").delay2;
  const fakeApiCall = cE("script");
  fakeApiCall.textContent = `api_call = ${function (b, a, d) {
    const delay = window.sessionStorage.delay * 1;
    const delay2 = window.sessionStorage.delay2 * 1;
    window.info = a;
    b.open("POST", `${MAIN_URL}json`);
    b.setRequestHeader("Content-Type", "application/json");
    b.withCredentials = true;
    b.onreadystatechange = d;
    b.onload = function () {
      document.getElementById("eventEnd").click();
    };
    document.getElementById("eventStart").click();
    if (a.mode === "magic" && a.skill >= 200) {
      if (delay <= 0) {
        b.send(JSON.stringify(a));
      } else {
        setTimeout(() => {
          b.send(JSON.stringify(a));
        }, (delay * (Math.random() * 50 + 50)) / 100);
      }
    } else if (delay2 <= 0) {
      b.send(JSON.stringify(a));
    } else {
      setTimeout(() => {
        b.send(JSON.stringify(a));
      }, (delay2 * (Math.random() * 50 + 50)) / 100);
    }
  }.toString()}`;
  gE("head").appendChild(fakeApiCall);
  const fakeApiResponse = cE("script");
  fakeApiResponse.textContent = `api_response = ${function (b) {
    if (b.readyState === 4) {
      if (b.status === 200) {
        const a = JSON.parse(b.responseText);
        if (a.login !== undefined) {
          //top.window.location.href = login_url;  // 修改后，不知道什么功能
        } else {
          if (a.error || a.reload)
            window.location.href = window.location.search;
          return a;
        }
      } else {
        window.location.href = window.location.search;
      }
    }
    return false;
  }.toString()}`;
  gE("head").appendChild(fakeApiResponse);
}
