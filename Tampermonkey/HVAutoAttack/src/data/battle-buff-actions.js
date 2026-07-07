import { BUFF_SKILL_LIB } from "./buff-lib.js";

export const DRAUGHT_BUFF_OPTIONS = Object.freeze([
  Object.freeze({ key: "HD", label: "Health Draught", itemId: 11191, img: "healthpot" }),
  Object.freeze({ key: "MD", label: "Mana Draught", itemId: 11291, img: "manapot" }),
  Object.freeze({ key: "SD", label: "Spirit Draught", itemId: 11391, img: "spiritpot" }),
  Object.freeze({ key: "FV", label: "Flower Vase", itemId: 19111, img: "flowers" }),
  Object.freeze({ key: "BG", label: "Bubble-Gum", itemId: 19131, img: "gum" }),
]);

export const BATTLE_BUFF_ACTION_OPTIONS = Object.freeze([
  ...DRAUGHT_BUFF_OPTIONS,
  ...Array.from(BUFF_SKILL_LIB.entries()).map(([key, skill]) =>
    Object.freeze({
      key,
      label: skill.name,
      skillId: skill.id,
      img: skill.img,
    })
  ),
]);
