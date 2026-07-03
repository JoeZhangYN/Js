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

function readDropItemName(item) {
  const match = item.textContent.match(/^\[(.*?)\]$/);
  return match ? match[1] : null;
}

function recordEquipmentDrop(drop, name, dropQuality) {
  for (let index = dropQuality; index < EQUIPMENT_QUALITIES.length; index++) {
    if (name.includes(EQUIPMENT_QUALITIES[index])) {
      const quality = name.match(/^\w+/)?.[0];
      if (quality) addDrop(drop, `Equipment of ${quality}`);
      break;
    }
  }
}

function recordItemDrop(drop, item, dropQuality) {
  const name = readDropItemName(item);
  if (!name) return false;
  if (item.style.color === "rgb(255, 0, 0)") {
    recordEquipmentDrop(drop, name, dropQuality);
  } else if (item.style.color === "rgb(186, 5, 180)") {
    const [, amount = "1", crystalName = name] = name.match(/^(\d+)x (Crystal of \w+)$/) || [];
    addDrop(drop, crystalName, Number(amount));
  } else if (item.style.color === "rgb(168, 144, 0)") {
    const amount = name.match(/\d+/)?.[0];
    if (!amount) return false;
    addDrop(drop, "#Credit", Number(amount));
  } else {
    addDrop(drop, name);
  }
  return true;
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
