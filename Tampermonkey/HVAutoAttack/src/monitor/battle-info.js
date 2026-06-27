// 战斗 HUD 渲染：左上角显示当前回合 / 怪物剩余 / 时间等。
import { gE, cE } from "../dom/query.js";
import { g } from "../state/store.js";

const EVENT_REFRESH = "refresh";

export const BattleHudEvent = Object.freeze({
  REFRESH: EVENT_REFRESH,
});

function makeDeps(deps) {
  return {
    cE: deps.cE || cE,
    document: deps.document || document,
    g: deps.g || g,
    gE: deps.gE || gE,
  };
}

function refreshBattleHud(deps) {
  let logElement = deps.gE(".hvAALog");
  if (!logElement) {
    logElement = deps.gE("#hvAABox2").appendChild(deps.cE("div"));
    logElement.className = "hvAALog";
  }
  const status = [
    "<l0>物理</l0><l1>物理</l1><l2>Physical</l2>",
    "<l0>火</l0><l1>火</l1><l2>Fire</l2>",
    "<l0>冰</l0><l1>冰</l1><l2>Cold</l2>",
    "<l0>雷</l0><l1>雷</l1><l2>Elec</l2>",
    "<l0>风</l0><l1>風</l1><l2>Wind</l2>",
    "<l0>圣</l0><l1>聖</l1><l2>Divine</l2>",
    "<l0>暗</l0><l1>暗</l1><l2>Forbidden</l2>",
  ];
  logElement.innerHTML = [
    `Turns: ${deps.g("turn")}`,
    `<br>Speed: ${deps.g("runSpeed")} t/s`,
    `<br>Round: ${deps.g("roundNow")}/${deps.g("roundAll")}`,
    `<br><l0>攻击模式</l0><l1>攻擊模式</l1><l2>Attack Mode</l2>: ${
      status[deps.g("attackStatus")]
    }`,
    `<br><l0>敌人</l0><l1>敌人</l1><l2>Monsters</l2>: ${deps.g(
      "monsterAlive"
    )}/${deps.g("monsterAll")}`,
    `<br><l0>战役模式</l0><l1>戰役模式</l1><l2>Type</l2>: ${battleInfoType(
      deps.g("roundType")
    )}`,
  ].join("");
  deps.document.title = `${deps.g("turn")}||${deps.g("runSpeed")}||${deps.g("roundNow")}/${deps.g(
    "roundAll"
  )}||${deps.g("monsterAlive")}/${deps.g("monsterAll")}`;
}

function battleInfoType(type) {
  switch (type) {
    case "ar":
      return "Arena";
    case "ba":
      return "Random Encounter";
    case "rb":
      return "Ring of Blood";
    case "tw":
      return "The Tower";
    case "iw":
      return "Item World";
    case "gr":
      return "GrindFest";
  }
}

export function runBattleHudAutomation(event = { type: EVENT_REFRESH }, deps = {}) {
  if (event.type !== EVENT_REFRESH) return false;
  refreshBattleHud(makeDeps(deps));
  return true;
}
