export function createDefaultUsageStats() {
  return {
    self: {
      _turn: 0,
      _round: 0,
      _battle: 0,
      _monster: 0,
      _boss: 0,
      evade: 0,
      miss: 0,
      focus: 0,
    },
    restore: {},
    items: {},
    magic: {},
    damage: {},
    hurt: {
      mp: 0,
      oc: 0,
      _avg: 0,
      _count: 0,
      _total: 0,
      _mavg: 0,
      _mcount: 0,
      _mtotal: 0,
      _pavg: 0,
      _pcount: 0,
      _ptotal: 0,
    },
    proficiency: {},
  };
}
