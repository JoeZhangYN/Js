// BattleSnapshot 收集（Phase 5b-1）。
// 每 turn 入口一次性 batch DOM 读取 → plain object → decide 函数全程纯函数（不再读 DOM）。
//
// **3 铁律**：
// A. snapshot 只存值（number/string/array of plain object），**禁** Element / Node 引用
// B. snapshot 生命周期 = 当前 turn 内（不入 store / setValue）
// C. dispatch 副作用用 selector 字符串重查询 DOM，不用缓存引用
//
// file-size-gate: exempt phase-5b-snapshot
import { gE, isSpiritActive } from "../dom/query.js";
import { g } from "../state/store.js";
import { collectCdMap } from "../state/cd-tracker.js";
import { parseBattleLog, estimatePlayerIncomingDps, estimatePerMonsterDps } from "./log-parser.js";
import { finalizePending } from "../state/recovery-learner.js";
import { parseEffectTurns, parseEffectName } from "./effect-parse.js";

/**
 * 解析一个 effect 容器（玩家 #pane_effects 或怪物 .btm6）内全部 img 为 {img, turns}[]。
 * img = effect 图标文件名（/e/<name>.png 的 <name>）；turns = 剩余回合（永续 → Infinity）。
 * @param {Element|null} container
 * @returns {Array<{img: string, turns: number}>}
 */
function readEffects(container) {
  if (!container) return [];
  return [...container.querySelectorAll("img")].map((img) => ({
    img: img.src.match(/\/e\/(.*?)\.png/)?.[1] || "",
    name: parseEffectName(img), // 显示名（onmouseover 第一个引号串），供 decide 区别于 img 文件名
    turns: parseEffectTurns(img),
  }));
}

/**
 * 解析玩家 #pane_effects buff 列表。
 * @returns {Array<{img: string, turns: number}>}
 */
function readPlayerEffects() {
  return readEffects(gE("#pane_effects"));
}

/**
 * 解析单怪物的 buff/debuff list。
 * @param {Element} mEl `.btm1` 元素
 * @returns {{names: string[], effects: Array<{img: string, turns: number}>}}
 */
function readMonsterBuffs(mEl) {
  const effects = readEffects(mEl.querySelector(".btm6"));
  return { names: effects.map((e) => e.img), effects };
}

/**
 * 解析所有怪物。返回 plain object 数组，**不**含 DOM 引用。
 * @returns {Array<{id:number, order:number, isDead:boolean, hpRatio:number, buffs:string[]}>}
 */
function readMonsters() {
  const els = gE("div.btm1", "all");
  return [...els].map((el, i) => {
    const isDead = el.style.opacity === "0.3" || !!el.querySelector('img[src*="nbardead"]');
    const hpBar = el.querySelector(".btm5 img[src*='nbargreen']");
    const hpRatio = hpBar ? Math.max(0, hpBar.offsetWidth) / 120 : isDead ? 0 : 1;
    const { names, effects } = readMonsterBuffs(el);
    const m2El = el.querySelector(".btm2");
    const isBoss = !!(m2El && m2El.style.background);
    const nameEl = el.querySelector(".btm3");
    const name = nameEl ? nameEl.textContent.trim() : "";
    return {
      id: i === 9 ? 0 : i + 1,
      order: i,
      isDead,
      isBoss,
      name,
      hpRatio,
      buffs: names,
      buffEffects: effects,
    };
  });
}

/**
 * 玩家 hp/mp/sp/oc 读取（兼容 #vbh / #dvbh 双布局）。
 * 返 percentage（hp/mp/sp 0..100）+ 绝对值（hpMax/mpMax/spMax + hpAbs/mpAbs/spAbs）。
 * #dvrhd / #dvrm / #dvrs 是 max 值的 textContent；当前绝对值 = max × percentage / 100。
 */
function readPlayerVitals() {
  let hp, mp, sp, oc;
  if (gE("#vbh")) {
    hp = (gE("#vbh>div>img").offsetWidth / 500) * 100;
    mp = (gE("#vbm>div>img").offsetWidth / 210) * 100;
    sp = (gE("#vbs>div>img").offsetWidth / 210) * 100;
    oc = gE("#vcp>div>div")
      ? (gE("#vcp>div>div", "all").length - gE("#vcp>div>div#vcr", "all").length) * 25
      : 0;
  } else {
    hp = (gE("#dvbh>div>img").offsetWidth / 414) * 100;
    mp = (gE("#dvbm>div>img").offsetWidth / 414) * 100;
    sp = (gE("#dvbs>div>img").offsetWidth / 414) * 100;
    oc = parseInt(gE("#dvrc")?.textContent) || 0;
  }
  const hpMax = parseInt(gE("#dvrhd")?.textContent) || 0;
  const mpMax = parseInt(gE("#dvrm")?.textContent) || 0;
  const spMax = parseInt(gE("#dvrs")?.textContent) || 0;
  return {
    hp, mp, sp, oc,
    hpMax, mpMax, spMax,
    hpAbs: (hp / 100) * hpMax,
    mpAbs: (mp / 100) * mpMax,
    spAbs: (sp / 100) * spMax,
    hpDeficit: hpMax - (hp / 100) * hpMax,
    mpDeficit: mpMax - (mp / 100) * mpMax,
    spDeficit: spMax - (sp / 100) * spMax,
  };
}

/**
 * 读所有可施法 skill 按钮的 ready 状态（opacity 不为 0.5）。
 * Phase 5b-2 给 decide-* 纯函数用，避免它们再调 isOn (DOM)。
 * @returns {Record<string, boolean>}
 */
function readSkillReady() {
  const map = {};
  // Buff IDs 411/412/413/421/422/423/431/432 + Regen 312
  // Debuff IDs 211/212/213/221/222/223/231/232/233
  // Healing IDs 311/312/313
  // Magic IDs 111-163 (18 个)
  // Physical IDs 1101/1111/2{1,2,3}{0,1,2,3,4} 等
  const ids = [
    "111","112","113","121","122","123","131","132","133",
    "141","142","143","151","152","153","161","162","163",
    "211","212","213","221","222","223","231","232","233",
    "311","312","313","411","412","413","421","422","423","431","432",
    "1001","1011","1101","1111",
    "2101","2102","2103","2201","2202","2203","2301","2302","2303",
  ];
  for (const id of ids) {
    const el = document.getElementById(id);
    if (!el) continue;
    map[id] = el.style.opacity !== "0.5";
  }
  return map;
}

/**
 * 一次性 batch DOM read 组装当前 turn snapshot。
 * @returns {import("../core/types.js").BattleSnapshot}
 */
export function collectSnapshot() {
  const monsters = readMonsters();
  const playerEffects = readPlayerEffects();
  const vitals = readPlayerVitals();
  const spiritEl = gE("#ckey_spirit");
  // 战斗日志只解析一遍，两个 DPS 估计复用同一份 events（避免每 turn 重复全量遍历 textlog）
  const battleLog = parseBattleLog();
  // T1: 上回合若有 pending 喝药观测，此处结算 → 学习 delta
  const snapPartial = { ...vitals };
  finalizePending(snapPartial);
  return {
    turn: g("turn") || 0,
    globalTurn: g("globalTurn") || 0,
    ...vitals,
    channeling: !!gE('#pane_effects>img[src*="channeling"]'),
    spiritOn: isSpiritActive(spiritEl),
    monsters,
    aliveCount: monsters.filter((m) => !m.isDead).length,
    // 单怪 HP%（0..100，对齐条件里 hp/mp 口径）：供非门表达"濒死的怪不上 debuff"等。
    ...monsterHpVars(monsters),
    playerBuffs: playerEffects.map((e) => e.img),
    playerEffectTurns: Object.fromEntries(playerEffects.map((e) => [e.img, e.turns])),
    // ether-tap 玩家效果事实（attack ether-tap gate 用，避免 decideAttack 再读 DOM）：
    // 与原 attack.js 同选择器，批在本次 #pane_effects 读里 → 维持"DOM 读一次"。
    etherTapActiveX2: !!gE('#pane_effects>img[onmouseover*="Ether Tap (x2)"]'),
    etherTapExpiring: !!gE('#pane_effects>img[src*="wpn_et"][id*="effect_expire"]'),
    // 深度B：玩家效果明细 [{img,name,turns}]（供 channel/critical 等 decide 用，含显示名+剩余回合）
    playerEffects,
    // 深度B：宝石按钮文案（供 decideGem，PURE 不读 DOM）；无宝石按钮 → null
    gemName: gE("#ikey_p")?.textContent ?? null,
    cdMap: collectCdMap(),
    skillReady: readSkillReady(),
    skillOTOS: g("skillOTOS") || {},
    spellAoe: g("spellAoe") || {},
    attackStatus: g("attackStatus"),
    fightingStyle: g("option")?.fightingStyle || "2",
    // PoC L1：战斗日志解析得 DPS 估计（复用上方 battleLog，本 turn 只解析一遍）
    playerIncomingDps: estimatePlayerIncomingDps(battleLog, g("turn")),
    monsterDpsByName: estimatePerMonsterDps(battleLog, g("turn")),
  };
}

/**
 * 启动时调用，验证铁律 A：snapshot 任一字段不应为 Element/Node。
 * @param {object} snap
 */
export function assertNoDomRefs(snap) {
  const stack = [{ path: "snap", val: snap }];
  while (stack.length) {
    const { path, val } = stack.pop();
    if (val instanceof Element || val instanceof Node) {
      throw new Error(`[snapshot] BUG: ${path} 含 DOM 引用，违反铁律 A`);
    }
    if (val && typeof val === "object") {
      for (const k of Object.keys(val)) stack.push({ path: `${path}.${k}`, val: val[k] });
    }
  }
}

/**
 * snap.monsters 中存活的怪物，按战场 order 升序。
 * 纯函数：不改 snap，返回新数组（[...] 浅拷贝后 sort）。
 * 调用方：main-loop Boss-Imperil step（取全部）/ decide-skill 首怪（取 [0]）。
 * @param {import("../core/types.js").BattleSnapshot} snap
 * @returns {Array<object>} 按 order 升序的存活怪物
 */
export function aliveMonstersByOrder(snap) {
  return [...snap.monsters].sort((a, b) => a.order - b.order).filter((m) => !m.isDead);
}

/**
 * 单怪 HP% 派生量（0..100，对齐条件 hp/mp 口径）。供非门"濒死守卫"等表达：
 * `!soloMonsterHp,4,25` = 仅 1 怪存活且其 HP≤25% 时排除（不放 Drain 等）。
 * 缺省 100（满血）→ 无对应目标态时守卫不触发、不误伤。纯函数（不读 DOM）。
 * @param {import("../core/types.js").MonsterFacts[]} monsters
 * @returns {{soloMonsterHp:number, lowestMonsterHp:number, firstMonsterHp:number}}
 */
export function monsterHpVars(monsters) {
  const alive = monsters.filter((m) => !m.isDead).sort((a, b) => a.order - b.order);
  const pct = (r) => r * 100;
  return {
    soloMonsterHp: alive.length === 1 ? pct(alive[0].hpRatio) : 100,
    lowestMonsterHp: alive.length ? pct(Math.min(...alive.map((m) => m.hpRatio))) : 100,
    firstMonsterHp: alive.length ? pct(alive[0].hpRatio) : 100,
  };
}
