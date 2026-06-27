// 战斗日志解析 + 掉落物追踪。
import { gE } from "../dom/query.js";
import { setValue, getValue, delValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import { g } from "../state/store.js";
import { time } from "../core/time.js";

export function recordBattleDrops(battleLog) {
  const drop = getValue(STORAGE_KEYS.DROP, true) || {
    "#startTime": time(3),
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
  const dropQuality = g("option").dropQuality;

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

    const item = gE("span", log);
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

  if (g("option").recordEach && g("roundNow") === g("roundAll")) {
    const old = getValue(STORAGE_KEYS.DROP_OLD, true) || [];
    drop.__name = getValue(STORAGE_KEYS.BATTLE_CODE);
    drop["#endTime"] = time(3);
    old.push(drop);
    setValue(STORAGE_KEYS.DROP_OLD, old);
    delValue(STORAGE_KEYS.DROP);
  } else {
    setValue(STORAGE_KEYS.DROP, drop);
  }
}
