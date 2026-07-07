import { BUFF_SKILL_LIB } from "../data/buff-lib.js";
import { CHANNEL_FALLBACK_ORDER_OPTIONS } from "../data/channel-fallback-order.js";
import { DEBUFF_SKILL_LIB } from "../data/debuff-lib.js";
import { ITEM_ORDER_OPTIONS } from "../data/item-order.js";
import { PHYSICAL_SKILL_ORDER_OPTIONS } from "../data/physical-skill-order.js";

const EVENT_READ_SUPPORT_BUFF_SKILLS = "readSupportBuffSkills";
const EVENT_READ_CHANNEL_FALLBACK_ORDER = "readChannelFallbackOrder";
const EVENT_READ_CASTABLE_DEBUFF_SKILLS = "readCastableDebuffSkills";
const EVENT_READ_PHYSICAL_SKILL_ORDER = "readPhysicalSkillOrder";
const EVENT_READ_ITEM_ORDER = "readItemOrder";

export const SettingsOrderControlEvent = Object.freeze({
  READ_SUPPORT_BUFF_SKILLS: EVENT_READ_SUPPORT_BUFF_SKILLS,
  READ_CHANNEL_FALLBACK_ORDER: EVENT_READ_CHANNEL_FALLBACK_ORDER,
  READ_CASTABLE_DEBUFF_SKILLS: EVENT_READ_CASTABLE_DEBUFF_SKILLS,
  READ_PHYSICAL_SKILL_ORDER: EVENT_READ_PHYSICAL_SKILL_ORDER,
  READ_ITEM_ORDER: EVENT_READ_ITEM_ORDER,
});

const settingsOrderControlHandlers = Object.freeze({
  [EVENT_READ_SUPPORT_BUFF_SKILLS]: () =>
    Array.from(BUFF_SKILL_LIB.entries()).map(([key, skill]) => ({ key, ...skill })),
  [EVENT_READ_CHANNEL_FALLBACK_ORDER]: () => CHANNEL_FALLBACK_ORDER_OPTIONS,
  [EVENT_READ_CASTABLE_DEBUFF_SKILLS]: () =>
    Array.from(DEBUFF_SKILL_LIB.entries())
      .filter(([, skill]) => skill.id)
      .map(([key, skill]) => ({ key, ...skill })),
  [EVENT_READ_PHYSICAL_SKILL_ORDER]: () => PHYSICAL_SKILL_ORDER_OPTIONS,
  [EVENT_READ_ITEM_ORDER]: () => ITEM_ORDER_OPTIONS,
});

export function runSettingsOrderControlCatalog(event) {
  return settingsOrderControlHandlers[event?.type]?.(event);
}
