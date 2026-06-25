// 目标选择业务能力（PURE 具名策略集）：把"这个技能该打哪只怪"散落在各 decide 的口径收敛成一处。
// 各 decide 声明用哪个具名策略派生目标，不再各自内联 sort / highestHp / 邻居偏移——根治目标漂移。
// 输入均为统一怪物视图(UnifiedMonster)或其存活子集；纯函数，不读 DOM / 不调 g。
// **保留策略多样性**：不同业务意图(最快杀 / 存活最久 / AoE 覆盖 / boss 窗口)各自具名，
// 不强行并成一个万能函数(那是假内聚)。

/**
 * finWeight 最小（攻击默认首怪：综合权重最优，含 debuff 加权）。
 * @param {import("../core/types.js").UnifiedMonster[]} alive 存活怪
 * @returns {import("../core/types.js").UnifiedMonster|undefined}
 */
export function firstByFinWeight(alive) {
  if (!alive || !alive.length) return undefined;
  return alive.reduce((best, m) => (m.finWeight < best.finWeight ? m : best));
}

/**
 * order 最小存活（AoE 锚 / 非 Drain 单体 debuff 首怪）。
 * @param {import("../core/types.js").UnifiedMonster[]} alive
 * @returns {import("../core/types.js").UnifiedMonster|undefined}
 */
export function firstByOrder(alive) {
  if (!alive || !alive.length) return undefined;
  return alive.reduce((best, m) => (m.order < best.order ? m : best));
}

/**
 * 当前绝对血最多（Drain 目标：存活最久 → debuff/吸血生效时间最长；boss 绝对血远超小怪 → 天然 boss 优先）。
 * 同 hpAbsNow 取 order 最小（稳定 first）。
 * @param {import("../core/types.js").UnifiedMonster[]} alive
 * @returns {import("../core/types.js").UnifiedMonster|undefined}
 */
export function highestAbsHp(alive) {
  if (!alive || !alive.length) return undefined;
  return alive.reduce((best, m) => {
    if (m.hpAbsNow > best.hpAbsNow) return m;
    if (m.hpAbsNow === best.hpAbsNow && m.order < best.order) return m;
    return best;
  });
}

/**
 * 恒打目标自身（取消任何邻居偏移）。Drain 用：既已选定血最多的怪，就把技能点在它身上。
 * @param {{id:number}} m
 * @returns {number} mkey id
 */
export function selfTarget(m) {
  return m.id;
}

/**
 * AoE 邻居锚点：AoE≥2 且邻居存活 → 打 order 邻居(backward 覆盖 [self,next])，否则打自己。
 * 全员 debuff 的合法覆盖优化（自 can-apply.pickAoeTarget 迁入重命名）。
 * @param {{id:number}} self
 * @param {{id:number,isDead:boolean}|undefined} next 排序后下一只（可能不存在/已死）
 * @param {number} aoeCount
 * @returns {number} mkey id
 */
export function aoeNeighborAnchor(self, next, aoeCount) {
  return aoeCount >= 2 && next && !next.isDead ? next.id : self.id;
}

/**
 * AoE 覆盖窗口：滑动窗口选覆盖最多 needy 目标的位置（boss-Imperil 用，backward 窗口 [c-aoe+1, c]）。
 * tie-break：相同覆盖时优先 click needy 自身（保证它必被击中）。无 needy 覆盖 → null。
 * @param {import("../core/types.js").UnifiedMonster[]} alive 按 order 升序的存活怪
 * @param {number} aoe AoE 覆盖数
 * @param {(m:import("../core/types.js").UnifiedMonster)=>boolean} isNeedy 是否待施目标
 * @returns {import("../core/types.js").UnifiedMonster|null}
 */
export function bossCoverageWindow(alive, aoe, isNeedy) {
  let bestIdx = -1,
    bestCov = -1,
    bestSelfNeed = false;
  for (let c = 0; c < alive.length; c++) {
    const start = Math.max(0, c - aoe + 1);
    let cov = 0;
    for (let i = start; i <= c; i++) if (isNeedy(alive[i])) cov++;
    const selfNeed = isNeedy(alive[c]);
    if (cov > bestCov || (cov === bestCov && selfNeed && !bestSelfNeed)) {
      bestCov = cov;
      bestIdx = c;
      bestSelfNeed = selfNeed;
    }
  }
  return bestIdx >= 0 && bestCov > 0 ? alive[bestIdx] : null;
}
