import { gE } from "../dom/query.js";

const EVENT_READ_CURRENT = "readCurrent";
const BATTLE_LOG_SELECTOR = "#textlog>tbody>tr>td";

export const BattleRoundStartLogEvent = Object.freeze({
  READ_CURRENT: EVENT_READ_CURRENT,
});

function readCurrentRoundStartLog() {
  const rows = Array.from(gE(BATTLE_LOG_SELECTOR, "all") || []).map((row) => row.textContent || "");
  return {
    rows,
    firstText: rows[0] || "",
    initializingText: rows[rows.length - 1] || "",
  };
}

export function runBattleRoundStartLog(event = { type: EVENT_READ_CURRENT }) {
  if (event.type === EVENT_READ_CURRENT) return readCurrentRoundStartLog();
  return { rows: [], firstText: "", initializingText: "" };
}
