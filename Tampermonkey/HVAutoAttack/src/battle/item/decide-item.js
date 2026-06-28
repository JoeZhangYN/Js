// PURE: item 4 step 决策（gem / potion / stall topup / scroll）。
// **不读 DOM**：只读 opt / snap。
// 原 item.js 内联的 gE/isOn 探活下沉到 execute-item.js（写路径），判断逻辑全部上提到此处。
// 复用现有纯 helper：decideGem / dynamicHpThreshold / isPotionWasteful / isStallMode /
// stallTopupCandidates / getLearnedRecovery / checkCondition（均不读 DOM 或仅读持久化态）。
import { checkCondition } from "../../settings/condition-eval.js";
import { decideGem } from "./decide-gem.js";
import { dynamicHpThreshold } from "../dynamic-threshold.js";
import { isPotionWasteful, isStallMode, stallTopupCandidates } from "../potion-economy.js";
import {
  RecoveryLearningEvent,
  runRecoveryLearningAutomation,
} from "../../state/recovery-learner.js";

function readRecovery(potionId) {
  return runRecoveryLearningAutomation({
    type: RecoveryLearningEvent.READ_RECOVERY,
    potionId,
  });
}

/**
 * 复刻 useGem。无宝石（snap.gemName 空）→ noop；
 * dynamicHealThreshold 且 Health Gem 时用 dynamicHpThreshold 覆盖 hp1；
 * decideGem 命中 click → {type:"gem"}，否则 noop。
 * @param {object} opt
 * @param {import("../../core/types.js").BattleSnapshot} snap
 * @returns {import("../../core/types.js").ActionResult} { kind:"item-plan", plan }
 */
export function decideGemUse(opt, snap) {
  if (!snap.gemName) return { kind: "item-plan", plan: { type: "noop" } };
  const optEffective = { ...opt };
  if (opt.dynamicHealThreshold && snap.gemName === "Health Gem") {
    optEffective.hp1 = dynamicHpThreshold(snap, opt);
  }
  const result = decideGem(optEffective, snap, snap.gemName);
  return {
    kind: "item-plan",
    plan: result.kind === "click" ? { type: "gem" } : { type: "noop" },
  };
}

/**
 * 复刻 deadSoon。遍历 itemOrderName/itemOrderValue，收集启用 + 条件满足 + （noWaste 时）非浪费
 * 的药品 id（保持原顺序）。isOn 可用性探活归 execute 侧（不在 decide）。
 * @param {object} opt
 * @param {import("../../core/types.js").BattleSnapshot} snap
 * @returns {import("../../core/types.js").ActionResult} { kind:"item-plan", plan }
 */
export function decidePotion(opt, snap) {
  const name = opt.itemOrderName.split(",");
  const order = opt.itemOrderValue.split(",");
  const noWaste = !!opt.noWastePotion;
  const tol = opt.potionWasteTolerance ?? 0.7;
  const candidates = [];
  for (let i = 0; i < name.length; i++) {
    if (!opt.item[name[i]]) continue;
    const cond = opt[`item${name[i]}Condition`];
    if (!checkCondition(cond, snap)) continue;
    // noWaste 防溢出仅作用于"无显式条件"的常开药；用户显式设了条件（含非门带状）且已满足
    //  → "条件符合就该用"，不再被绝对量防溢出悄悄否决（根治 message-1 "条件满足却不放"）。
    const hasExplicitCond = typeof cond !== "undefined";
    if (noWaste && !hasExplicitCond && isPotionWasteful(order[i], snap, tol, readRecovery)) {
      continue;
    }
    candidates.push(order[i]);
  }
  return { kind: "item-plan", plan: { type: "potion", candidates, noWaste } };
}

/**
 * 复刻 stallTopup（含 tryStallSpiritOff / tryStallFocus / tryStallDraught 的判断部分）。
 * 非 stall 模式 → noop；否则按 tryFirst 顺序产出满足条件的 attempts（spirit-off → focus → draught）。
 * 元素探活与点击归 execute 侧；此处只判断条件是否成立。
 * @param {object} opt
 * @param {import("../../core/types.js").BattleSnapshot} snap
 * @returns {import("../../core/types.js").ActionResult} { kind:"item-plan", plan }
 */
export function decideStallTopup(opt, snap) {
  if (opt.stallMode === false) return { kind: "item-plan", plan: { type: "noop" } };
  if (!isStallMode(snap, opt, snap.roundNow, snap.roundAll)) {
    return { kind: "item-plan", plan: { type: "noop" } };
  }

  const attempts = [];

  // step 0: 关 Spirit Stance（防抖）
  const lastToggle = snap.lastSpiritToggleGlobalTurn ?? -999;
  const cooldown = opt.spiritToggleMinInterval ?? 3;
  if (
    snap.spiritOn &&
    opt.stallTurnOffSpirit !== false &&
    (snap.globalTurn || 0) - lastToggle >= cooldown
  ) {
    attempts.push({ kind: "spirit-off" });
  }

  // step 1: Focus（OC 高 + MP 未满 + 无 Channeling）
  if (
    opt.stallFocus !== false &&
    !snap.spiritOn &&
    (snap.oc || 0) >= (opt.stallFocusOcThreshold ?? 60) &&
    (snap.mp ?? 100) < (opt.stallFocusMpMax ?? 80) &&
    !snap.playerBuffs.includes("channeling")
  ) {
    attempts.push({ kind: "focus" });
  }

  // step 2: MP/SP Draught 兜底
  for (const potId of stallTopupCandidates(snap, opt)) {
    attempts.push({ kind: "draught", id: potId });
  }

  return { kind: "item-plan", plan: { type: "stall", attempts } };
}

/**
 * 复刻 useScroll。遍历 scrollLib，对每张卷轴：启用 + 条件满足 + 对应 buff（j=1..mult）全部未上
 * → 收集为候选 item id（保持声明顺序）。原 DOM buff 探测改读 snap.playerBuffs 子串匹配。
 * @param {object} opt
 * @param {import("../../core/types.js").BattleSnapshot} snap
 * @returns {import("../../core/types.js").ActionResult} { kind:"item-plan", plan }
 */
export function decideScroll(opt, snap) {
  const scrollSuffix = opt.scrollFirst ? "_scroll" : "";
  const candidates = [];
  for (const i in SCROLL_LIB) {
    const lib = SCROLL_LIB[i];
    if (!(opt.scroll[i] && checkCondition(opt[`scroll${i}Condition`], snap))) continue;
    // 原 useScroll：j=1..mult 任一 buff 已上 → 视为已用，跳过；全部未上才用
    let alreadyUp = false;
    for (let j = 1; j <= lib.mult; j++) {
      const needle = `${lib[`img${j}`]}${scrollSuffix}`;
      if (snap.playerBuffs.some((b) => b.includes(needle))) {
        alreadyUp = true;
        break;
      }
    }
    if (!alreadyUp) candidates.push(lib.id);
  }
  return { kind: "item-plan", plan: { type: "scroll", candidates } };
}

/** 卷轴库（从 item.js useScroll 内联 scrollLib 原样复制）。 */
const SCROLL_LIB = {
  Go: {
    name: "Scroll of the Gods",
    id: 13299,
    mult: "3",
    img1: "absorb",
    img2: "shadowveil",
    img3: "sparklife",
  },
  Av: {
    name: "Scroll of the Avatar",
    id: 13199,
    mult: "2",
    img1: "haste",
    img2: "protection",
  },
  Pr: {
    name: "Scroll of Protection",
    id: 13111,
    mult: "1",
    img1: "protection",
  },
  Sw: {
    name: "Scroll of Swiftness",
    id: 13101,
    mult: "1",
    img1: "haste",
  },
  Li: {
    name: "Scroll of Life",
    id: 13221,
    mult: "1",
    img1: "sparklife",
  },
  Sh: {
    name: "Scroll of Shadows",
    id: 13211,
    mult: "1",
    img1: "shadowveil",
  },
  Ab: {
    name: "Scroll of Absorption",
    id: 13201,
    mult: "1",
    img1: "absorb",
  },
};
