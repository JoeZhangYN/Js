const EQUIPMENT_QUALITIES = [
  "Crude",
  "Fair",
  "Average",
  "Superior",
  "Exquisite",
  "Magnificent",
  "Legendary",
  "Peerless",
];

function addDrop(drop, name, amount = 1) {
  drop[name] = (drop[name] || 0) + amount;
}

function recordEquipmentDrop(drop, name, dropQuality) {
  for (let index = dropQuality; index < EQUIPMENT_QUALITIES.length; index++) {
    if (name.includes(EQUIPMENT_QUALITIES[index])) {
      addDrop(drop, `Equipment of ${name.match(/^\w+/)[0]}`);
      break;
    }
  }
}

function recordItemDrop(drop, item, dropQuality) {
  const name = item.textContent.match(/^\[(.*?)\]$/)[1];
  if (item.style.color === "rgb(255, 0, 0)") {
    recordEquipmentDrop(drop, name, dropQuality);
  } else if (item.style.color === "rgb(186, 5, 180)") {
    const [, amount = "1", crystalName = name] = name.match(/^(\d+)x (Crystal of \w+)$/) || [];
    addDrop(drop, crystalName, Number(amount));
  } else if (item.style.color === "rgb(168, 144, 0)") {
    addDrop(drop, "#Credit", Number(name.match(/\d+/)[0]));
  } else {
    addDrop(drop, name);
  }
}

function recordTextDrop(drop, text) {
  const [, amount, type] = text.match(/^You gain (\d+) (EXP|Credit)/);
  addDrop(drop, `#${type}`, Number(amount));
}

export function applyBattleDropLog(drop, battleLog, { dropQuality, readItem }) {
  for (const log of battleLog) {
    const text = log.textContent;
    if (text === "You are Victorious!") break;
    if (/^You gain \d+ (EXP|Credit)/.test(text)) {
      recordTextDrop(drop, text);
      continue;
    }
    const item = readItem(log);
    if (item) recordItemDrop(drop, item, dropQuality);
  }
  return drop;
}
