// 战斗 HUD 渲染：左上角显示当前回合 / 怪物剩余 / 时间等。
import { gE, cE } from "../dom/query.js";
import { g } from "../state/store.js";

export function battleInfo() {
  let logElement = gE(".hvAALog");
  if (!logElement) {
    logElement = gE("#hvAABox2").appendChild(cE("div"));
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
    `Turns: ${g("turn")}`,
    `<br>Speed: ${g("runSpeed")} t/s`,
    `<br>Round: ${g("roundNow")}/${g("roundAll")}`,
    `<br><l0>攻击模式</l0><l1>攻擊模式</l1><l2>Attack Mode</l2>: ${
      status[g("attackStatus")]
    }`,
    `<br><l0>敌人</l0><l1>敌人</l1><l2>Monsters</l2>: ${g(
      "monsterAlive"
    )}/${g("monsterAll")}`,
    `<br><l0>战役模式</l0><l1>戰役模式</l1><l2>Type</l2>: ${battleInfoType(
      g("roundType")
    )}`,
  ].join("");
  document.title = `${g("turn")}||${g("runSpeed")}||${g("roundNow")}/${g(
    "roundAll"
  )}||${g("monsterAlive")}/${g("monsterAll")}`;
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
