import { ALL_DEBUFF_ACTION_OPTIONS } from "../data/all-debuff-actions.js";
import { BATTLE_BUFF_ACTION_OPTIONS } from "../data/battle-buff-actions.js";
import { BATTLE_ROUND_TYPE_OPTIONS } from "../data/battle-round-types.js";
import { BATTLE_SCROLL_OPTIONS } from "../data/battle-scrolls.js";
import { BUFF_SKILL_LIB } from "../data/buff-lib.js";
import { CHANNEL_FALLBACK_ORDER_OPTIONS } from "../data/channel-fallback-order.js";
import { DEBUFF_SKILL_LIB } from "../data/debuff-lib.js";
import { IDLE_ARENA_LEVEL_OPTIONS } from "../data/idle-arena-levels.js";
import { ITEM_ORDER_OPTIONS } from "../data/item-order.js";
import { PHYSICAL_SKILL_ORDER_OPTIONS } from "../data/physical-skill-order.js";
import {
  OFFENSIVE_SPELL_ELEMENTS,
  OFFENSIVE_SPELL_LIB,
  OFFENSIVE_SPELL_TIERS,
} from "../data/spell-lib.js";

const EVENT_READ_SUPPORT_BUFF_SKILLS = "readSupportBuffSkills";
const EVENT_READ_BUFF_ACTIONS = "readBuffActions";
const EVENT_READ_CHANNEL_FALLBACK_ORDER = "readChannelFallbackOrder";
const EVENT_READ_CASTABLE_DEBUFF_SKILLS = "readCastableDebuffSkills";
const EVENT_READ_ALL_DEBUFF_ACTIONS = "readAllDebuffActions";
const EVENT_READ_PHYSICAL_SKILL_ORDER = "readPhysicalSkillOrder";
const EVENT_READ_ITEM_ORDER = "readItemOrder";
const EVENT_READ_OFFENSIVE_SPELL_AOE_ROWS = "readOffensiveSpellAoeRows";
const EVENT_READ_IDLE_ARENA_LEVELS = "readIdleArenaLevels";
const EVENT_READ_BATTLE_ROUND_TYPES = "readBattleRoundTypes";
const EVENT_READ_BATTLE_SCROLLS = "readBattleScrolls";

export const SettingsOrderControlEvent = Object.freeze({
  READ_SUPPORT_BUFF_SKILLS: EVENT_READ_SUPPORT_BUFF_SKILLS,
  READ_BUFF_ACTIONS: EVENT_READ_BUFF_ACTIONS,
  READ_CHANNEL_FALLBACK_ORDER: EVENT_READ_CHANNEL_FALLBACK_ORDER,
  READ_CASTABLE_DEBUFF_SKILLS: EVENT_READ_CASTABLE_DEBUFF_SKILLS,
  READ_ALL_DEBUFF_ACTIONS: EVENT_READ_ALL_DEBUFF_ACTIONS,
  READ_PHYSICAL_SKILL_ORDER: EVENT_READ_PHYSICAL_SKILL_ORDER,
  READ_ITEM_ORDER: EVENT_READ_ITEM_ORDER,
  READ_OFFENSIVE_SPELL_AOE_ROWS: EVENT_READ_OFFENSIVE_SPELL_AOE_ROWS,
  READ_IDLE_ARENA_LEVELS: EVENT_READ_IDLE_ARENA_LEVELS,
  READ_BATTLE_ROUND_TYPES: EVENT_READ_BATTLE_ROUND_TYPES,
  READ_BATTLE_SCROLLS: EVENT_READ_BATTLE_SCROLLS,
});

const settingsOrderControlHandlers = Object.freeze({
  [EVENT_READ_SUPPORT_BUFF_SKILLS]: () =>
    Array.from(BUFF_SKILL_LIB.entries()).map(([key, skill]) => ({ key, ...skill })),
  [EVENT_READ_BUFF_ACTIONS]: () => BATTLE_BUFF_ACTION_OPTIONS,
  [EVENT_READ_CHANNEL_FALLBACK_ORDER]: () => CHANNEL_FALLBACK_ORDER_OPTIONS,
  [EVENT_READ_CASTABLE_DEBUFF_SKILLS]: () =>
    Array.from(DEBUFF_SKILL_LIB.entries())
      .filter(([, skill]) => skill.id)
      .map(([key, skill]) => ({ key, ...skill })),
  [EVENT_READ_ALL_DEBUFF_ACTIONS]: () => ALL_DEBUFF_ACTION_OPTIONS,
  [EVENT_READ_PHYSICAL_SKILL_ORDER]: () => PHYSICAL_SKILL_ORDER_OPTIONS,
  [EVENT_READ_ITEM_ORDER]: () => ITEM_ORDER_OPTIONS,
  [EVENT_READ_OFFENSIVE_SPELL_AOE_ROWS]: () =>
    OFFENSIVE_SPELL_ELEMENTS.map(({ code, label }, index) => ({
      code,
      label,
      last: index === OFFENSIVE_SPELL_ELEMENTS.length - 1,
      tiers: OFFENSIVE_SPELL_TIERS.filter((tier) => OFFENSIVE_SPELL_LIB.has(`${code}${tier}`)),
    })),
  [EVENT_READ_IDLE_ARENA_LEVELS]: () => IDLE_ARENA_LEVEL_OPTIONS,
  [EVENT_READ_BATTLE_ROUND_TYPES]: () => BATTLE_ROUND_TYPE_OPTIONS,
  [EVENT_READ_BATTLE_SCROLLS]: () => BATTLE_SCROLL_OPTIONS,
});

export function runSettingsOrderControlCatalog(event) {
  return settingsOrderControlHandlers[event?.type]?.(event);
}
