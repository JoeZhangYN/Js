// 当前体力(stamina)读数收口（应抽尽抽 — 同形态字面量散落 4 处）。
//
// `gE("#stamina_readout .fc4.far>div").textContent.match(/\d+/)[0]*1` 同业务「读玩家当前体力数值」
// 散在 idle-arena(×2) / encounter / init，裸 `[0]` 元素缺失即崩。收口为防御解析：读不到/无数字 → 0（不崩）。
import { gE } from "../dom/query.js";
import { OptionEvent, runOptionAutomation } from "./option.js";

const EVENT_READ_VALUE = "readValue";
const EVENT_SHOULD_RESTORE_FOR_BATTLE = "shouldRestoreForBattle";
const EVENT_SHOULD_STOP_LOBBY = "shouldStopLobby";
const EVENT_SHOULD_RESTORE_FOR_IDLE_ARENA = "shouldRestoreForIdleArena";

export const StaminaEvent = Object.freeze({
  READ_VALUE: EVENT_READ_VALUE,
  SHOULD_RESTORE_FOR_BATTLE: EVENT_SHOULD_RESTORE_FOR_BATTLE,
  SHOULD_STOP_LOBBY: EVENT_SHOULD_STOP_LOBBY,
  SHOULD_RESTORE_FOR_IDLE_ARENA: EVENT_SHOULD_RESTORE_FOR_IDLE_ARENA,
});

/**
 * 读玩家当前体力(stamina)数值。读不到 #stamina_readout 或无数字 → 0（不崩）。
 * @returns {number}
 */
function readStaminaValue() {
  const el = gE("#stamina_readout .fc4.far>div");
  const m = el?.textContent?.match(/\d+/);
  return m ? Number(m[0]) : 0;
}

function readStaminaOptions() {
  return {
    restoreStamina: runOptionAutomation({
      type: OptionEvent.READ_FIELD,
      key: "restoreStamina",
      fallback: false,
    }),
    staminaLow: runOptionAutomation({
      type: OptionEvent.READ_FIELD,
      key: "staminaLow",
      fallback: 0,
    }),
  };
}

function shouldRestoreForBattle() {
  const opt = readStaminaOptions();
  return !!opt.restoreStamina && readStaminaValue() <= opt.staminaLow;
}

function shouldStopLobby() {
  const opt = readStaminaOptions();
  return !opt.restoreStamina && readStaminaValue() <= opt.staminaLow;
}

function shouldRestoreForIdleArena() {
  const value = readStaminaValue();
  const opt = readStaminaOptions();
  return !!opt.restoreStamina && value <= opt.staminaLow && value < 85;
}

export function runStaminaAutomation(event = { type: EVENT_READ_VALUE }) {
  if (event.type === EVENT_READ_VALUE) return readStaminaValue();
  if (event.type === EVENT_SHOULD_RESTORE_FOR_BATTLE) return shouldRestoreForBattle();
  if (event.type === EVENT_SHOULD_STOP_LOBBY) return shouldStopLobby();
  if (event.type === EVENT_SHOULD_RESTORE_FOR_IDLE_ARENA) return shouldRestoreForIdleArena();
  return undefined;
}
