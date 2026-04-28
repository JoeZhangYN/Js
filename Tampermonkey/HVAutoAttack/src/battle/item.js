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
 * Stall 模式优先级：关 Spirit → Focus（OC→Channeling）→ Draught → 普攻刷 OC。
 * 关 Spirit 是 step 0：stall 不需要伤害加成（要拖），且 Spirit 每回合耗 1 SP + 10% OC，
 * 与 Focus 同时存在会"OC 两头掉"。关 Spirit 后 OC 自然累积更快，Focus 烧的 OC 也能补回来。
 */
export function stallTopup() {
  const opt = g("option");
  if (opt.stallMode === false) return;
  const snap = collectSnapshot();
  const stall = isStallMode(snap, opt, g("roundNow"), g("roundAll"));
  if (!stall) return;

  // Step 0: 关 Spirit Stance（含防抖：避免和 attack toggle 撞车 / Spirit Stance Disabled 重复触发）
  const lastToggle = g("lastSpiritToggleGlobalTurn") ?? -999;
  const cooldown = opt.spiritToggleMinInterval ?? 3;
  if (
    snap.spiritOn &&
    opt.stallTurnOffSpirit !== false &&
    (g("globalTurn") || 0) - lastToggle >= cooldown
  ) {
    const spiritEl = gE("#ckey_spirit");
    if (spiritEl) {
      spiritEl.click();
      g("lastSpiritToggleGlobalTurn", g("globalTurn") || 0);
      tagEndToTrue();
      if (opt.dynamicHealLog ?? true) {
        console.log(`[stall] Spirit OFF (oc=${snap.oc}, 停止双向耗损)`);
      }
      return;
    }
  }

  // Step 1: Focus（仅当 Spirit 已关或不存在；OC 高 + MP 未满 + 无 Channeling）
  const focusOcMin = opt.stallFocusOcThreshold ?? 60;
  const focusMpMax = opt.stallFocusMpMax ?? 80;
  const focusOn = opt.stallFocus !== false;
  if (
    focusOn &&
    !snap.spiritOn &&
    (snap.oc || 0) >= focusOcMin &&
    (snap.mp ?? 100) < focusMpMax &&
    !snap.playerBuffs.includes("channeling") &&
    gE("#ckey_focus")
  ) {
    gE("#ckey_focus").click();
    tagEndToTrue();
    if (opt.dynamicHealLog ?? true) {
      console.log(`[stall-focus] Focus (oc=${snap.oc}, mp=${snap.mp.toFixed(0)}% < ${focusMpMax}% → Channeling)`);
    }
    return;
  }

  // Fallback：MP/SP Draught（百分比控制）
  const candidates = stallTopupCandidates(snap, opt);
  for (const potId of candidates) {
    const el = gE(`.bti3>div[onmouseover*="${potId}"]`);
    if (el) {
      // T1: 喝药前 pre-state
      recordPreDrink(potId, snap);
      el.click();
      tagEndToTrue();
      if (opt.dynamicHealLog ?? true) {
        console.log(`[stall-topup] drink ${potId} (mp ${snap.mp.toFixed(0)}% / sp ${snap.sp.toFixed(0)}%)`);
      }
      return;
    }
  }
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
