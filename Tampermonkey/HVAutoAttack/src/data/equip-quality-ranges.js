// 装备品质浮动范围数据
// offline 模式：QUALITY_CONFIG 每品质 [min, max] + cap（强化上限）
// live 模式：manualRanges 手动覆盖在线数据库错误的 lmax（reasoningtheory.net）

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
  "上等": "Superior",
  "中等": "Average",
  "劣质": "Fair",
  "粗糙": "Crude",
};

// 部分 lmax 在 reasoningtheory 服务器上有错，下面覆盖修正
export const manualRanges = {
  Oak: {
    Legendary: {
      "Magic Damage": { "all | all": { max: 31.98 } },
      "Holy EDB": { "Hallowed | Heimdall": { max: 42.68 } },
      Elemental: { "all | all": { max: 6.45 } },
      Divine: { "all | all": { max: 6.45 } },
      Supportive: { "all | not!Earth-walker": { max: 11.81 } },
      "Counter-Resist": { "all | all": { max: 13.58 } },
      Intelligence: { "all | all": { max: 4.82 } },
      Wisdom: { "all | all": { max: 7.22 } },
    },
  },
  Willow: {
    Legendary: {
      "Magic Damage": { "all | Destruction": { max: 51.71 } },
      "Fire EDB": { "Fiery | all": { max: 11.32 } },
      "Cold EDB": { "Arctic | all": { max: 11.32 } },
      "Elec EDB": { "Shocking | all": { max: 18.56 } },
      "Wind EDB": { "Tempestuous | all": { max: 18.56 } },
      "Dark EDB": { "Demonic | all": { max: 26.6 } },
      Elemental: { "all | all": { max: 6.14 } },
      Forbidden: { "all | all": { max: 6.14 } },
      Deprecating: { "all | not!Curse-weaver": { max: 11.81 } },
      "Counter-Resist": { "all | all": { max: 13.58 } },
      Intelligence: { "all | all": { max: 4.82 } },
      Wisdom: { "all | all": { max: 7.22 } },
    },
  },
  Katalox: {
    Legendary: {
      "Magic Damage": {
        "all | Destruction": { max: 52.2 },
        "all | not!Destruction": { max: 32.39 },
      },
      "Holy EDB": {
        "Hallowed | Heimdall": { max: 37.84 },
        "Hallowed | not!Heimdall": { max: 21.76 },
      },
      "Dark EDB": {
        "Demonic | Fenrir": { max: 37.84 },
        "Demonic | not!Fenrir": { max: 21.76 },
      },
      Divine: {
        "all | Heaven-sent": { max: 16.24 },
        "all | not!Heaven-sent": { max: 8.28 },
      },
      Forbidden: {
        "all | Demon-fiend": { max: 16.24 },
        "all | not!Demon-fiend": { max: 8.28 },
      },
      Deprecating: { "all | all": { max: 6.14 } },
      Intelligence: { "all | all": { max: 7.22 } },
      Wisdom: { "all | all": { max: 4.82 } },
    },
  },
  Redwood: {
    Legendary: {
      "Magic Damage": {
        "all | Destruction": { max: 51.71 },
        "all | not!Destruction": { max: 31.98 },
      },
      "Fire EDB": {
        "Fiery | Surtr": { max: 37.85 },
        "Fiery | not!Surtr": { max: 21.77 },
      },
      "Cold EDB": {
        "Arctic | Niflheim": { max: 37.85 },
        "Arctic | not!Niflheim": { max: 21.77 },
      },
      "Elec EDB": {
        "Shocking | Mjolnir": { max: 37.85 },
        "Shocking | not!Mjolnir": { max: 21.77 },
      },
      "Wind EDB": {
        "Tempestuous | Freyr": { max: 37.85 },
        "Tempestuous | not!Freyr": { max: 21.77 },
      },
      Elemental: {
        "all | Elementalist": { max: 16.24 },
        "all | not!Elementalist": { max: 8.29 },
      },
      Supportive: { "all | all": { max: 4.31 } },
      Deprecating: { "all | all": { max: 4.31 } },
      Intelligence: { "all | all": { max: 6.32 } },
      Wisdom: { "all | all": { max: 6.32 } },
    },
  },
  Phase: {
    Cap: {
      Legendary: {
        "Magic Damage": { "Radiant | all": { max: 4.23 } },
        "Spell Crit Damage": { "Mystic | all": { max: 3.91 } },
        "Casting Speed": { "Charged | all": { max: 3.47 } },
        "Mana Conservation": { "Frugal | all": { max: 3.61 } },
        "Fire EDB": { "all | Surtr": { max: 16.97 } },
        "Cold EDB": { "all | Niflheim": { max: 16.97 } },
        "Elec EDB": { "all | Mjolnir": { max: 16.97 } },
        "Wind EDB": { "all | Freyr": { max: 16.97 } },
        "Holy EDB": { "all | Heimdall": { max: 16.97 } },
        "Dark EDB": { "all | Fenrir": { max: 16.97 } },
      },
    },
    Robe: {
      Legendary: {
        "Magic Damage": { "Radiant | all": { max: 4.9 } },
        "Spell Crit Damage": { "Mystic | all": { max: 4.67 } },
        "Casting Speed": { "Charged | all": { max: 4.06 } },
        "Mana Conservation": { "Frugal | all": { max: 4.11 } },
        "Fire EDB": { "all | Surtr": { max: 20.18 } },
        "Cold EDB": { "all | Niflheim": { max: 20.18 } },
        "Elec EDB": { "all | Mjolnir": { max: 20.18 } },
        "Wind EDB": { "all | Freyr": { max: 20.18 } },
        "Holy EDB": { "all | Heimdall": { max: 20.18 } },
        "Dark EDB": { "all | Fenrir": { max: 20.18 } },
      },
    },
    Gloves: {
      Legendary: {
        "Magic Damage": { "Radiant | all": { max: 3.9 } },
        "Spell Crit Damage": { "Mystic | all": { max: 3.53 } },
        "Casting Speed": { "Charged | all": { max: 3.18 } },
        "Mana Conservation": { "Frugal | all": { max: 3.41 } },
        "Fire EDB": { "all | Surtr": { max: 15.36 } },
        "Cold EDB": { "all | Niflheim": { max: 15.36 } },
        "Elec EDB": { "all | Mjolnir": { max: 15.36 } },
        "Wind EDB": { "all | Freyr": { max: 15.36 } },
        "Holy EDB": { "all | Heimdall": { max: 15.36 } },
        "Dark EDB": { "all | Fenrir": { max: 15.36 } },
      },
    },
    Pants: {
      Legendary: {
        "Magic Damage": { "Radiant | all": { max: 4.56 } },
        "Spell Crit Damage": { "Mystic | all": { max: 4.29 } },
        "Casting Speed": { "Charged | all": { max: 3.77 } },
        "Mana Conservation": { "Frugal | all": { max: 3.91 } },
        "Fire EDB": { "all | Surtr": { max: 18.58 } },
        "Cold EDB": { "all | Niflheim": { max: 18.58 } },
        "Elec EDB": { "all | Mjolnir": { max: 18.58 } },
        "Wind EDB": { "all | Freyr": { max: 18.58 } },
        "Holy EDB": { "all | Heimdall": { max: 18.58 } },
        "Dark EDB": { "all | Fenrir": { max: 18.58 } },
      },
    },
    Shoes: {
      Legendary: {
        "Magic Damage": { "Radiant | all": { max: 3.57 } },
        "Spell Crit Damage": { "Mystic | all": { max: 3.15 } },
        "Casting Speed": { "Charged | all": { max: 2.89 } },
        "Mana Conservation": { "Frugal | all": { max: 3.11 } },
        "Fire EDB": { "all | Surtr": { max: 13.75 } },
        "Cold EDB": { "all | Niflheim": { max: 13.75 } },
        "Elec EDB": { "all | Mjolnir": { max: 13.75 } },
        "Wind EDB": { "all | Freyr": { max: 13.75 } },
        "Holy EDB": { "all | Heimdall": { max: 13.75 } },
        "Dark EDB": { "all | Fenrir": { max: 13.75 } },
      },
    },
  },
  Cotton: {
    Cap: {
      Legendary: {
        "Casting Speed": { "Charged | all": { max: 3.47 } },
        "Mana Conservation": { "Frugal | all": { max: 3.61 } },
        Elemental: { "all | Elementalist": { max: 8.29 } },
        Divine: { "all | Heaven-sent": { max: 8.29 } },
        Forbidden: { "all | Demon-fiend": { max: 8.29 } },
        Supportive: { "all | Earth-walker": { max: 8.29 } },
        Deprecating: { "all | Curse-weaver": { max: 8.29 } },
      },
    },
    Robe: {
      Legendary: {
        "Casting Speed": { "Charged | all": { max: 4.06 } },
        "Mana Conservation": { "Frugal | all": { max: 4.11 } },
        Elemental: { "all | Elementalist": { max: 9.89 } },
        Divine: { "all | Heaven-sent": { max: 9.89 } },
        Forbidden: { "all | Demon-fiend": { max: 9.89 } },
        Supportive: { "all | Earth-walker": { max: 9.89 } },
        Deprecating: { "all | Curse-weaver": { max: 9.89 } },
      },
    },
    Gloves: {
      Legendary: {
        "Casting Speed": { "Charged | all": { max: 3.18 } },
        "Mana Conservation": { "Frugal | all": { max: 3.41 } },
        Elemental: { "all | Elementalist": { max: 7.5 } },
        Divine: { "all | Heaven-sent": { max: 7.5 } },
        Forbidden: { "all | Demon-fiend": { max: 7.5 } },
        Supportive: { "all | Earth-walker": { max: 7.5 } },
        Deprecating: { "all | Curse-weaver": { max: 7.5 } },
      },
    },
    Pants: {
      Legendary: {
        "Casting Speed": { "Charged | all": { max: 3.77 } },
        "Mana Conservation": { "Frugal | all": { max: 3.91 } },
        Elemental: { "all | Elementalist": { max: 9.09 } },
        Divine: { "all | Heaven-sent": { max: 9.09 } },
        Forbidden: { "all | Demon-fiend": { max: 9.09 } },
        Supportive: { "all | Earth-walker": { max: 9.09 } },
        Deprecating: { "all | Curse-weaver": { max: 9.09 } },
      },
    },
    Shoes: {
      Legendary: {
        "Casting Speed": { "Charged | all": { max: 2.89 } },
        "Mana Conservation": { "Frugal | all": { max: 3.11 } },
        Elemental: { "all | Elementalist": { max: 6.7 } },
        Divine: { "all | Heaven-sent": { max: 6.7 } },
        Forbidden: { "all | Demon-fiend": { max: 6.7 } },
        Supportive: { "all | Earth-walker": { max: 6.7 } },
        Deprecating: { "all | Curse-weaver": { max: 6.7 } },
      },
    },
  },
};
