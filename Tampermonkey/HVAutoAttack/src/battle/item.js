// 物品使用：宝石 / 紧急药水 / 卷轴 / stall topup。
// file-size-gate: exempt phase-poc-potion-economy
// Phase 5b-3 wave 2：useGem 已切 PURE decide-gem。
// PoC 经济学：deadSoon 加 isPotionWasteful 防溢出；新增 stallTopup 主动喝 MP/SP pot。
import { gE, isOn } from "../dom/query.js";
import { g, tagEndToTrue } from "../state/store.js";
import { checkCondition } from "../settings/condition-eval.js";
import { collectSnapshot } from "./snapshot.js";
import { decideGem } from "./item/decide-gem.js";
import { dynamicHpThreshold } from "./dynamic-threshold.js";
import { isPotionWasteful, isStallMode, stallTopupCandidates } from "./potion-economy.js";
import { recordPreDrink, getLearnedRecovery } from "../state/recovery-learner.js";

export function useGem() {
  const gemElement = gE("#ikey_p");
  if (!gemElement) return;
  const opt = g("option");
  const snap = collectSnapshot();
  const optEffective = { ...opt };
  if (opt.dynamicHealThreshold && gemElement.textContent === "Health Gem") {
    const dyn = dynamicHpThreshold(snap, opt);
    optEffective.hp1 = dyn;
    if ((opt.dynamicHealLog ?? true) && dyn !== (opt.hp1 ?? 50)) {
      console.log(`[dyn-threshold] Health Gem: hp1 ${opt.hp1 ?? 50} → ${dyn.toFixed(1)} (incoming ${snap.playerIncomingDps?.perTurnP95?.toFixed(0) ?? 0}/turn p95 × ${snap.monsters.filter(m=>!m.isDead).length}怪)`);
    }
  }
  const result = decideGem(optEffective, snap, gemElement.textContent);
  if (result.kind === "click") {
    gE(result.selector).click();
    tagEndToTrue();
    // F: auto-tune 计数本回合用药
    if (opt.autoTune) {
      g("autoTunePotionCount", (g("autoTunePotionCount") || 0) + 1);
    }
  }
}

export function deadSoon() {
  const opt = g("option");
  const name = opt.itemOrderName.split(",");
  const order = opt.itemOrderValue.split(",");
  const snap = opt.noWastePotion ? collectSnapshot() : null;
  for (let i = 0; i < name.length; i++) {
    if (
      opt.item[name[i]] &&
      checkCondition(opt[`item${name[i]}Condition`]) &&
      isOn(order[i])
    ) {
      // PoC: 防溢出 + T1 学到值优先
      if (snap && isPotionWasteful(order[i], snap, opt.potionWasteTolerance ?? 0.7, getLearnedRecovery)) {
        if (opt.dynamicHealLog ?? true) {
          console.log(`[no-waste] skip potion ${order[i]}: deficit too small`);
        }
        continue;
      }
      // T1: 喝药前记录 pre-state，下回合 snapshot 结算 delta → 学习
      if (snap) recordPreDrink(order[i], snap);
      isOn(order[i]).click();
      tagEndToTrue();
      if (opt.autoTune) {
        g("autoTunePotionCount", (g("autoTunePotionCount") || 0) + 1);
      }
      return;
    }
  }
}

/**
 * 顺序尝试候选 action，第一个返 true 的就生效后续不再尝试（Monsterbation `Strongest` 模式借鉴：
 * 把"if-else 早返链"显式声明成 fallback chain）。
 * @param {Array<() => boolean>} actions 每个 action 返 true 表示已 act（含 tagEnd），false 表示跳过
 */
function tryFirst(actions) {
  for (const action of actions) {
    if (action()) return;
  }
}

/**
 * Stall 模式优先级：关 Spirit → Focus（OC→Channeling）→ Draught → 普攻刷 OC。
 * 关 Spirit 是 step 0：stall 不需要伤害加成（要拖），且 Spirit 每回合耗 1 SP + 10% OC，
 * 与 Focus 同时存在会"OC 两头掉"。关 Spirit 后 OC 自然累积更快，Focus 烧的 OC 也能补回来。
 *
 * Phase 5b-4：3 段优先级原本是 `if {...; return} else if ...` 链，重构为显式 `tryFirst([])` fallback chain。
 */
export function stallTopup() {
  const opt = g("option");
  if (opt.stallMode === false) return;
  const snap = collectSnapshot();
  if (!isStallMode(snap, opt, g("roundNow"), g("roundAll"))) return;

  tryFirst([
    () => tryStallSpiritOff(opt, snap),
    () => tryStallFocus(opt, snap),
    () => tryStallDraught(opt, snap),
  ]);
}

/** stall step 0: 关 Spirit Stance（防抖）。 */
function tryStallSpiritOff(opt, snap) {
  if (!snap.spiritOn || opt.stallTurnOffSpirit === false) return false;
  const lastToggle = g("lastSpiritToggleGlobalTurn") ?? -999;
  const cooldown = opt.spiritToggleMinInterval ?? 3;
  if ((g("globalTurn") || 0) - lastToggle < cooldown) return false;
  const spiritEl = gE("#ckey_spirit");
  if (!spiritEl) return false;
  spiritEl.click();
  g("lastSpiritToggleGlobalTurn", g("globalTurn") || 0);
  tagEndToTrue();
  if (opt.dynamicHealLog ?? true) {
    console.log(`[stall] Spirit OFF (oc=${snap.oc}, 停止双向耗损)`);
  }
  return true;
}

/** stall step 1: Focus（OC 高 + MP 未满 + 无 Channeling）。 */
function tryStallFocus(opt, snap) {
  const focusOcMin = opt.stallFocusOcThreshold ?? 60;
  const focusMpMax = opt.stallFocusMpMax ?? 80;
  if (opt.stallFocus === false) return false;
  if (snap.spiritOn) return false;
  if ((snap.oc || 0) < focusOcMin) return false;
  if ((snap.mp ?? 100) >= focusMpMax) return false;
  if (snap.playerBuffs.includes("channeling")) return false;
  const focusEl = gE("#ckey_focus");
  if (!focusEl) return false;
  focusEl.click();
  tagEndToTrue();
  if (opt.dynamicHealLog ?? true) {
    console.log(`[stall-focus] Focus (oc=${snap.oc}, mp=${snap.mp.toFixed(0)}% < ${focusMpMax}% → Channeling)`);
  }
  return true;
}

/** stall step 2: MP/SP Draught 兜底。 */
function tryStallDraught(opt, snap) {
  const candidates = stallTopupCandidates(snap, opt);
  for (const potId of candidates) {
    const el = gE(`.bti3>div[onmouseover*="${potId}"]`);
    if (!el) continue;
    recordPreDrink(potId, snap);
    el.click();
    tagEndToTrue();
    if (opt.dynamicHealLog ?? true) {
      console.log(`[stall-topup] drink ${potId} (mp ${snap.mp.toFixed(0)}% / sp ${snap.sp.toFixed(0)}%)`);
    }
    return true;
  }
  return false;
}

export function useScroll() {
  const scrollLib = {
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
  const scrollFirst = g("option").scrollFirst ? "_scroll" : "";
  let isUsed;
  for (const i in scrollLib) {
    if (
      g("option").scroll[i] &&
      gE(`.bti3>div[onmouseover*="${scrollLib[i].id}"]`) &&
      checkCondition(g("option")[`scroll${i}Condition`])
    ) {
      for (let j = 1; j <= scrollLib[i].mult; j++) {
        if (
          gE(
            `#pane_effects>img[src*="${
              scrollLib[i][`img${j}`]
            }${scrollFirst}"]`
          )
        ) {
          isUsed = true;
          break;
        }
        isUsed = false;
      }
      if (!isUsed) {
        gE(`.bti3>div[onmouseover*="${scrollLib[i].id}"]`).click();
        tagEndToTrue();
        return;
      }
    }
  }
}
