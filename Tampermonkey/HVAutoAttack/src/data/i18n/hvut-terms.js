// hv-utils 自渲染面板的「精确术语」翻译 SSOT（英文逻辑值 → 简体中文，精确查表）。
//
// 背景：equip-dict / interface-dict 的词典是为外部 DOM 正则翻译组织的（key 含 '>'/正则/通配，
// 如 '>Staff '、'Weapons?'），不适合 hv-utils 自渲染时对裸术语（'Staff'）做精确查表。
// 本文件是 hv-utils 标签类术语（法师属性 / 装备分类 / 能力分类）的精确 exact-lookup SSOT，
// 由 G3 从 hv-utils.js 内嵌的 HVUT_CN 提取归位（消除 IIFE 内嵌翻译表漂移），经 window.HVAA_i18n.t() 桥消费。
// 逻辑值/比较/键一律用英文；本表仅显示层。值与外部 DOM 词典保持一致（同术语同中文）。

/** 法师属性 spell_type 值域 ['Fire','Cold','Elec','Wind','Holy','Dark'] */
export const SPELL_TYPE = {
  'Fire': '火焰', 'Cold': '冰冷', 'Elec': '闪电',
  'Wind': '疾风', 'Holy': '神圣', 'Dark': '黑暗',
};

/** 装备分类 eq.info.category 值域（带 " Weapon" 后缀） */
export const EQ_CATEGORY = {
  'One-handed Weapon': '单手武器', 'Two-handed Weapon': '双手武器',
  'Staff': '法杖', 'Shield': '盾牌',
  'Cloth Armor': '布甲', 'Light Armor': '轻甲', 'Heavy Armor': '重甲',
  'Unknown': '未知',
};

/** 能力点分类 ab.category 值域（无 " Weapon" 后缀） */
export const AB_CATEGORY = {
  'General': '通用',
  'One-handed': '单手', 'Two-handed': '双手', 'Dual-wielding': '双持',
  'Staff': '法杖',
  'Cloth Armor': '布甲', 'Light Armor': '轻甲', 'Heavy Armor': '重甲',
  'Elemental': '元素魔法', 'Divine': '神圣魔法', 'Forbidden': '黑暗魔法',
  'Supportive 1': '增益魔法 1', 'Deprecating 1': '减益魔法 1',
  'Supportive 2': '增益魔法 2', 'Deprecating 2': '减益魔法 2',
};
