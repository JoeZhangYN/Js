// BattleSnapshot 收集（Phase 5b-1）。
// 每 turn 入口一次性 batch DOM 读取 → plain object → decide 函数全程纯函数（不再读 DOM）。
//
// **3 铁律**：
// A. snapshot 只存值（number/string/array of plain object），**禁** Element / Node 引用
// B. snapshot 生命周期 = 当前 turn 内（不入 store / setValue）
// C. dispatch 副作用用 selector 字符串重查询 DOM，不用缓存引用
//
// file-size-gate: exempt phase-5b-snapshot
import { gE } from "../dom/query.js";
import { g } from "../state/store.js";
import { collectCdMap } from "../state/cd-tracker.js";
import { parseBattleLog, estimatePlayerIncomingDps, estimatePerMonsterDps } from "./log-parser.js";
import { finalizePending } from "../state/recovery-learner.js";

/**
 * 解析单个 onmouseover 的 set_infopane_effect 第 3 参数。
 * 数字 → 剩余回合；'autocast' / 'permanent' / 其他字符串 → Infinity（视为永续，无需续施）。
 * @param {Element} img
 * @returns {number}
 */
function parseEffectTurns(img) {
  const onmouseover = img.getAttribute("onmouseover");
  // 解析失败统一返 Infinity（保守：buff 已存在时不误判过期，省 MP；
  //  真过期时 img 元素整个会从 pane_effects 移除，playerEffectTurns[img] 为 undefined → 触发 recast）
  if (!onmouseover) return Infinity;
  const m = onmouseover.match(/\(.*,.*, (.*?)\)$/);
  if (!m) return Infinity;
  const v = m[1].trim();
  if (v.startsWith("'") || v.startsWith('"')) return Infinity;
  const n = parseInt(v);
  return isNaN(n) ? Infinity : n;
}

/**
 * 解析玩家 #pane_effects buff 列表。
 * @returns {Array<{img: string, turns: number}>}
 */
function readPlayerEffects() {
  const pane = gE("#pane_effects");
  if (!pane) return [];
  const imgs = pane.querySelectorAll("img");
  return [...imgs].map((img) => ({
    img: img.src.match(/\/e\/(.*?)\.png/)?.[1] || "",
    turns: parseEffectTurns(img),
  }));
}

/**
 * 解析单怪物的 buff/debuff list。
 * @param {Element} mEl `.btm1` 元素
 * @returns {{names: string[], effects: Array<{img: string, turns: number}>}}
 */
function readMonsterBuffs(mEl) {
  const btm6 = mEl.querySelector(".btm6");
  if (!btm6) return { names: [], effects: [] };
  const imgs = [...btm6.querySelectorAll("img")];
  const effects = imgs.map((img) => ({
    img: img.src.match(/\/e\/(.*?)\.png/)?.[1] || "",
    turns: parseEffectTurns(img),
  }));
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
  // T1: 上回合若有 pending 喝药观测，此处结算 → 学习 delta
  const snapPartial = { ...vitals };
  finalizePending(snapPartial);
  return {
    turn: g("turn") || 0,
    globalTurn: g("globalTurn") || 0,
    ...vitals,
    channeling: !!gE('#pane_effects>img[src*="channeling"]'),
    spiritOn: !!(spiritEl && spiritEl.src.includes("spirit_a")),
    monsters,
    aliveCount: monsters.filter((m) => !m.isDead).length,
    playerBuffs: playerEffects.map((e) => e.img),
    playerEffectTurns: Object.fromEntries(playerEffects.map((e) => [e.img, e.turns])),
    cdMap: collectCdMap(),
    skillReady: readSkillReady(),
    skillOTOS: g("skillOTOS") || {},
    spellAoe: g("spellAoe") || {},
    attackStatus: g("attackStatus"),
    fightingStyle: g("option")?.fightingStyle || "2",
    // PoC L1：战斗日志解析得 DPS 估计
    playerIncomingDps: estimatePlayerIncomingDps(parseBattleLog(), g("turn")),
    monsterDpsByName: estimatePerMonsterDps(parseBattleLog(), g("turn")),
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
