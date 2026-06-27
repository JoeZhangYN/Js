// 装备品质浮动范围数据
// file-size-gate: exempt data-table-装备品质数值区间纯数据 SOT
// offline 模式：QUALITY_CONFIG 每品质 [min, max] + cap（强化上限）

/**
 * @typedef {keyof typeof QUALITY_CONFIG} QualityKey
 * @typedef {{range:[number, number], cap: number}} QualityConfig
 */
export const QUALITY_CONFIG = {
  Peerless: { range: [200, 200], cap: 50 },
  Legendary: { range: [170, 200], cap: 40 },
  Magnificent: { range: [150, 180], cap: 30 },
  Exquisite: { range: [120, 160], cap: 20 },
  Superior: { range: [90, 130], cap: 20 },
  Average: { range: [60, 100], cap: 20 },
  Fair: { range: [30, 70], cap: 20 },
  Crude: { range: [0, 40], cap: 20 },
};

/** 中文品质名 → 英文 key */
export const QUALITY_CN_MAP = {
  "☯无双☯": "Peerless",
  "✪传奇✪": "Legendary",
  "☆史诗☆": "Magnificent",
  "✧精良✧": "Exquisite",
  上等: "Superior",
  中等: "Average",
  劣质: "Fair",
  粗糙: "Crude",
};

/** 英文品质 key → 中文显示名（由 QUALITY_CN_MAP 反转派生，单源不漂移） */
export const QUALITY_EN_TO_CN = Object.fromEntries(
  Object.entries(QUALITY_CN_MAP).map(([cn, en]) => [en, cn])
);
