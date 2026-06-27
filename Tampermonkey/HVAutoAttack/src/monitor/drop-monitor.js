// 战斗日志解析 + 掉落物追踪。
import { gE } from "../dom/query.js";
import { setValue, getValue, delValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import { g } from "../state/store.js";
import { TimeEvent, runTimeAutomation } from "../core/time.js";

const EVENT_COMPLETION_REACHED = "completionReached";

export const BattleDropEvent = Object.freeze({
  COMPLETION_REACHED: EVENT_COMPLETION_REACHED,
});

function makeDeps(deps) {
  return {
    delValue: deps.delValue || delValue,
    g: deps.g || g,
    gE: deps.gE || gE,
    getValue: deps.getValue || getValue,
    setValue: deps.setValue || setValue,
    readLocalTimestampLabel:
      deps.readLocalTimestampLabel ||
      (() => runTimeAutomation({ type: TimeEvent.LOCAL_TIMESTAMP_LABEL })),
  };
}

function recordBattleDrops(deps) {
  const battleLog = deps.gE("#textlog>tbody>tr>td", "all");
  const drop = deps.getValue(STORAGE_KEYS.DROP, true) || {
    "#startTime": deps.readLocalTimestampLabel(),
    "#EXP": 0,
    "#Credit": 0,
  };

  const quality = [
    "Crude",
    "Fair",
    "Average",
    "Superior",
    "Exquisite",
    "Magnificent",
    "Legendary",
    "Peerless",
  ];
  const dropQuality = deps.g("option").dropQuality;

  for (const log of battleLog) {
    const text = log.textContent;

    if (text === "You are Victorious!") {
      break;
    }

    if (/^You gain \d+ (EXP|Credit)/.test(text)) {
      const [, amount, type] = text.match(/^You gain (\d+) (EXP|Credit)/);
      drop[`#${type}`] += Number(amount);
      continue;
    }

    const item = deps.gE("span", log);
    if (!item) continue;

    const name = item.textContent.match(/^\[(.*?)\]$/)[1];

    if (item.style.color === "rgb(255, 0, 0)") {
      for (let j = dropQuality; j < quality.length; j++) {
        if (name.includes(quality[j])) {
          const equipmentName = `Equipment of ${name.match(/^\w+/)[0]}`;
          drop[equipmentName] = (drop[equipmentName] || 0) + 1;
          break;
        }
      }
    } else if (item.style.color === "rgb(186, 5, 180)") {
      const [, amount = "1", crystalName = name] = name.match(/^(\d+)x (Crystal of \w+)$/) || [];
      drop[crystalName] = (drop[crystalName] || 0) + Number(amount);
    } else if (item.style.color === "rgb(168, 144, 0)") {
      drop["#Credit"] += Number(name.match(/\d+/)[0]);
    } else {
      drop[name] = (drop[name] || 0) + 1;
    }
  }

  if (deps.g("option").recordEach && deps.g("roundNow") === deps.g("roundAll")) {
    const old = deps.getValue(STORAGE_KEYS.DROP_OLD, true) || [];
    drop.__name = deps.getValue(STORAGE_KEYS.BATTLE_CODE);
    drop["#endTime"] = deps.readLocalTimestampLabel();
    old.push(drop);
    deps.setValue(STORAGE_KEYS.DROP_OLD, old);
    deps.delValue(STORAGE_KEYS.DROP);
  } else {
    deps.setValue(STORAGE_KEYS.DROP, drop);
  }
}

export function runBattleDropAutomation(event = { type: EVENT_COMPLETION_REACHED }, deps = {}) {
  if (event.type !== EVENT_COMPLETION_REACHED) return false;
  recordBattleDrops(makeDeps(deps));
  return true;
}
