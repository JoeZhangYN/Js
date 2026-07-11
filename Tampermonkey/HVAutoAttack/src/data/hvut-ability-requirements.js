// file-size-gate: exempt data-table-HVUT能力等级与AP纯数据SOT
const CURRENT_REQUIREMENTS = {
  "HP Tank": {
    unlock: [0, 25, 50, 75, 100, 120, 150, 200, 250, 300],
    point: [1, 2, 3, 3, 4, 4, 4, 5, 5, 5],
  },
  "MP Tank": {
    unlock: [0, 30, 60, 90, 120, 160, 210, 260, 310, 350],
    point: [1, 2, 3, 3, 4, 4, 4, 5, 5, 5],
  },
  "SP Tank": {
    unlock: [0, 40, 80, 120, 170, 220, 270, 330, 390, 450],
    point: [1, 2, 3, 3, 4, 4, 4, 5, 5, 5],
  },
  "Better Health Pots": {
    unlock: [0, 100, 200, 300, 400],
    point: [1, 2, 3, 4, 5],
  },
  "Better Mana Pots": {
    unlock: [0, 80, 140, 220, 380],
    point: [2, 3, 5, 7, 9],
  },
  "Better Spirit Pots": {
    unlock: [0, 90, 160, 240, 400],
    point: [2, 3, 5, 7, 9],
  },
  "1H Damage": {
    unlock: [0, 100, 200],
    point: [2, 3, 5],
  },
  "1H Accuracy": {
    unlock: [50, 150],
    point: [1, 2],
  },
  "1H Block": {
    unlock: [250],
    point: [3],
  },
  "2H Damage": {
    unlock: [0, 100, 200],
    point: [2, 3, 5],
  },
  "2H Accuracy": {
    unlock: [50, 150],
    point: [1, 2],
  },
  "2H Parry": {
    unlock: [50, 200],
    point: [2, 3],
  },
  "DW Damage": {
    unlock: [0, 100, 200],
    point: [2, 3, 5],
  },
  "DW Accuracy": {
    unlock: [50, 150],
    point: [1, 2],
  },
  "DW Crit": {
    unlock: [250],
    point: [3],
  },
  "Staff Spell Damage": {
    unlock: [0, 100, 200],
    point: [2, 3, 5],
  },
  "Staff Accuracy": {
    unlock: [50, 150, 300],
    point: [1, 2, 3],
  },
  "Staff Damage": {
    unlock: [0],
    point: [3],
  },
  "Cloth Spellacc": {
    unlock: [0, 120, 240],
    point: [2, 3, 5],
  },
  "Cloth Spellcrit": {
    unlock: [0, 40, 90, 130, 190],
    point: [1, 2, 3, 5, 7],
  },
  "Cloth Castspeed": {
    unlock: [150, 250],
    point: [2, 5],
  },
  "Cloth MP": {
    unlock: [0, 60, 110, 170, 230, 290, 350],
    point: [1, 2, 3, 3, 4, 4, 5],
  },
  "Light Acc": {
    unlock: [0],
    point: [3],
  },
  "Light Crit": {
    unlock: [0, 40, 90, 130, 190],
    point: [1, 2, 3, 5, 7],
  },
  "Light Speed": {
    unlock: [150, 250],
    point: [2, 5],
  },
  "Light HP/MP": {
    unlock: [0, 60, 110, 170, 230, 290, 350],
    point: [1, 2, 3, 3, 4, 4, 5],
  },
  "Heavy Crush": {
    unlock: [0, 75, 150],
    point: [3, 5, 7],
  },
  "Heavy Prcg": {
    unlock: [0, 75, 150],
    point: [3, 5, 7],
  },
  "Heavy Slsh": {
    unlock: [0, 75, 150],
    point: [3, 5, 7],
  },
  "Heavy HP": {
    unlock: [0, 60, 110, 170, 230, 290, 350],
    point: [1, 2, 3, 3, 4, 4, 5],
  },
  "Better Weaken": {
    unlock: [70, 100, 130, 190, 250],
    point: [1, 2, 3, 5, 7],
  },
  "Faster Weaken": {
    unlock: [80, 165, 250],
    point: [3, 5, 7],
  },
  "Better Imperil": {
    unlock: [130, 175, 230, 285, 330],
    point: [1, 2, 3, 4, 5],
  },
  "Faster Imperil": {
    unlock: [140, 225, 310],
    point: [3, 5, 7],
  },
  "Better Blind": {
    unlock: [110, 130, 160, 190, 220],
    point: [1, 2, 3, 4, 5],
  },
  "Faster Blind": {
    unlock: [120, 215, 275],
    point: [1, 2, 3],
  },
  "Mind Control": {
    unlock: [80, 130, 170],
    point: [1, 3, 5],
  },
  "Better Silence": {
    unlock: [120, 170, 215],
    point: [3, 5, 7],
  },
  "Better Immobilize": {
    unlock: [250, 295, 340, 370, 400],
    point: [1, 2, 3, 4, 5],
  },
  "Better Slow": {
    unlock: [30, 50, 75, 105, 135],
    point: [1, 2, 3, 4, 5],
  },
  "Better Drain": {
    unlock: [20, 50, 90],
    point: [2, 3, 5],
  },
  "Faster Drain": {
    unlock: [30, 70, 110, 150, 200],
    point: [1, 2, 3, 4, 5],
  },
  "Ether Theft": {
    unlock: [150],
    point: [5],
  },
  "Spirit Theft": {
    unlock: [150],
    point: [5],
  },
  "Better Haste": {
    unlock: [60, 75, 90, 110, 130],
    point: [1, 2, 3, 4, 5],
  },
  "Better Shadow Veil": {
    unlock: [90, 105, 120, 135, 155],
    point: [1, 2, 3, 5, 7],
  },
  "Better Absorb": {
    unlock: [40, 60, 80],
    point: [1, 2, 3],
  },
  "Stronger Spirit": {
    unlock: [200, 220, 240, 265, 285],
    point: [1, 2, 3, 4, 5],
  },
  "Better Heartseeker": {
    unlock: [140, 185, 225, 265, 305, 345, 385],
    point: [1, 2, 3, 4, 5, 6, 7],
  },
  "Better Arcane Focus": {
    unlock: [175, 205, 245, 285, 325, 365, 405],
    point: [1, 2, 3, 4, 5, 6, 7],
  },
  "Better Regen": {
    unlock: [50, 70, 95, 145, 195, 245, 295, 375, 445, 500],
    point: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  },
  "Better Cure": {
    unlock: [0, 35, 65],
    point: [2, 3, 5],
  },
  "Better Spark": {
    unlock: [100, 125, 150],
    point: [2, 3, 5],
  },
  "Better Protection": {
    unlock: [40, 55, 75, 95, 120],
    point: [1, 2, 3, 4, 5],
  },
  "Flame Spike Shield": {
    unlock: [10, 65, 140, 220, 300],
    point: [3, 1, 2, 3, 4],
  },
  "Frost Spike Shield": {
    unlock: [10, 65, 140, 220, 300],
    point: [3, 1, 2, 3, 4],
  },
  "Shock Spike Shield": {
    unlock: [10, 65, 140, 220, 300],
    point: [3, 1, 2, 3, 4],
  },
  "Storm Spike Shield": {
    unlock: [10, 65, 140, 220, 300],
    point: [3, 1, 2, 3, 4],
  },
  Conflagration: {
    unlock: [50, 100, 150, 200, 250, 300, 400],
    point: [3, 4, 5, 6, 8, 10, 12],
  },
  Cryomancy: {
    unlock: [50, 100, 150, 200, 250, 300, 400],
    point: [3, 4, 5, 6, 8, 10, 12],
  },
  Havoc: {
    unlock: [50, 100, 150, 200, 250, 300, 400],
    point: [3, 4, 5, 6, 8, 10, 12],
  },
  Tempest: {
    unlock: [50, 100, 150, 200, 250, 300, 400],
    point: [3, 4, 5, 6, 8, 10, 12],
  },
  Sorcery: {
    unlock: [70, 140, 210, 280, 350],
    point: [1, 2, 3, 4, 5],
  },
  Elementalism: {
    unlock: [85, 170, 255, 340, 425],
    point: [2, 3, 5, 7, 9],
  },
  Archmage: {
    unlock: [90, 180, 270, 360, 450],
    point: [5, 7, 9, 12, 15],
  },
  "Better Corruption": {
    unlock: [75, 150],
    point: [3, 5],
  },
  "Better Disintegrate": {
    unlock: [175, 250],
    point: [5, 7],
  },
  "Better Ragnarok": {
    unlock: [250, 325, 400],
    point: [7, 9, 12],
  },
  "Ripened Soul": {
    unlock: [150, 300, 450],
    point: [7, 10, 15],
  },
  "Dark Imperil": {
    unlock: [175, 225, 275, 325, 375],
    point: [2, 3, 5, 7, 9],
  },
  "Better Smite": {
    unlock: [75, 150],
    point: [3, 5],
  },
  "Better Banish": {
    unlock: [175, 250],
    point: [5, 7],
  },
  "Better Paradise": {
    unlock: [250, 325, 400],
    point: [7, 9, 12],
  },
  "Soul Fire": {
    unlock: [150, 300, 450],
    point: [7, 10, 15],
  },
  "Holy Imperil": {
    unlock: [175, 225, 275, 325, 375],
    point: [2, 3, 5, 7, 9],
  },
};

function freezeRequirementCatalog(catalog) {
  for (const requirement of Object.values(catalog)) {
    Object.freeze(requirement.unlock);
    Object.freeze(requirement.point);
    Object.freeze(requirement);
  }
  return Object.freeze(catalog);
}

export const HvutAbilityRequirementCatalog = freezeRequirementCatalog(CURRENT_REQUIREMENTS);
