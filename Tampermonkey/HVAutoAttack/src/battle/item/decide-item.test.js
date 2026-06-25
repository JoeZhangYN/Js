// item 4 step PURE decide 回归锁（纯决策，喂 mock snap 断言 ItemPlan；decide 不读 DOM）。
// file-size-gate: exempt test-verbose（19 用例覆盖 gem/potion/stall/scroll 四 step）
import { describe, it, expect, beforeEach } from "vitest";
import {
  decideGemUse,
  decidePotion,
  decideStallTopup,
  decideScroll,
} from "./decide-item.js";
import { g } from "../../state/store.js";

/** 最小 snap 工厂（只填 decide-item 及其纯 callee 读到的字段）。 */
function snap(over = {}) {
  return {
    hp: 100,
    mp: 100,
    sp: 100,
    oc: 0,
    spiritOn: false,
    globalTurn: 100,
    gemName: null,
    view: [],
    playerBuffs: [],
    hpDeficit: 0,
    mpDeficit: 0,
    spDeficit: 0,
    ...over,
  };
}

const gemPlan = (opt, s) => decideGemUse(opt, s).plan;
const potionPlan = (opt, s) => decidePotion(opt, s).plan;
const stallPlan = (opt, s) => decideStallTopup(opt, s).plan;
const scrollPlan = (opt, s) => decideScroll(opt, s).plan;

beforeEach(() => {
  g("option", {});
  g("roundNow", undefined);
  g("roundAll", undefined);
  g("globalTurn", undefined);
  g("lastSpiritToggleGlobalTurn", undefined);
});

describe("decideGemUse", () => {
  it("无宝石（gemName 空）→ noop", () => {
    expect(gemPlan({}, snap({ gemName: null }))).toEqual({ type: "noop" });
  });

  it("Health Gem + hp<=hp1 → gem", () => {
    const p = gemPlan({ hp1: 50 }, snap({ gemName: "Health Gem", hp: 30 }));
    expect(p).toEqual({ type: "gem" });
  });

  it("Health Gem + hp 高于阈值 → noop", () => {
    const p = gemPlan({ hp1: 50 }, snap({ gemName: "Health Gem", hp: 90 }));
    expect(p).toEqual({ type: "noop" });
  });

  it("Mystic Gem 恒触发 → gem", () => {
    expect(gemPlan({}, snap({ gemName: "Mystic Gem" }))).toEqual({ type: "gem" });
  });

  it("dynamicHealThreshold：样本不足 → fallback hp1，hp 高于则 noop", () => {
    // playerIncomingDps.sampleCount<2 → dynamicHpThreshold 返 fallback(hp1=50)
    const s = snap({
      gemName: "Health Gem",
      hp: 60,
      playerIncomingDps: { sampleCount: 0, perTurnP95: 0 },
    });
    expect(gemPlan({ dynamicHealThreshold: true, hp1: 50 }, s)).toEqual({ type: "noop" });
  });
});

describe("decidePotion", () => {
  const baseOpt = {
    itemOrderName: "Hp,Mp",
    itemOrderValue: "11191,11291",
    item: { Hp: true, Mp: true },
  };

  it("启用 + 无条件门控 → 全收集（保持顺序）", () => {
    const p = potionPlan({ ...baseOpt }, snap());
    expect(p).toEqual({ type: "potion", candidates: ["11191", "11291"], noWaste: false });
  });

  it("item 开关关 → 不收集该项", () => {
    const p = potionPlan({ ...baseOpt, item: { Hp: false, Mp: true } }, snap());
    expect(p.candidates).toEqual(["11291"]);
  });

  it("条件不满足 → 过滤该项", () => {
    // itemHpCondition: hp < 50（比较符 2=<）；hp=90 不满足 → Hp 被过滤
    const p = potionPlan(
      { ...baseOpt, itemHpCondition: [["hp,2,50"]] },
      snap({ hp: 90 })
    );
    expect(p.candidates).toEqual(["11291"]);
  });

  it("noWaste：无显式条件 + deficit 太小（浪费）→ 过滤", () => {
    // 11191 Health Draught fallback recovery=200；hpDeficit=10 < 200*0.7 → 浪费跳过
    const p = potionPlan(
      { ...baseOpt, noWastePotion: true },
      snap({ hpDeficit: 10, mpDeficit: 999 })
    );
    expect(p).toEqual({ type: "potion", candidates: ["11291"], noWaste: true });
  });

  it("noWaste：显式条件满足 → 尊重条件不过滤（即便绝对量算浪费）", () => {
    // Hp 显式 hp<50 满足(hp=30) + hpDeficit=10(绝对量浪费)→ 仍保留:"条件符合就该用"(message-1 修正)
    const p = potionPlan(
      { ...baseOpt, noWastePotion: true, itemHpCondition: [["hp,2,50"]] },
      snap({ hp: 30, hpDeficit: 10, mpDeficit: 999 })
    );
    expect(p.candidates).toEqual(["11191", "11291"]);
  });
});

describe("decideStallTopup", () => {
  /** 进入 stall 模式的 snap：仅 1 怪存活 + hpPercent 高 + OC 未满。 */
  function stallSnap(over = {}) {
    return snap({
      view: [{ id: 1, isDead: false, hpPercent: 0.8 }],
      oc: 100,
      ...over,
    });
  }
  function enterStall() {
    g("roundNow", 1);
    g("roundAll", 3); // roundNow < roundAll
  }

  it("stallMode===false → noop", () => {
    enterStall();
    expect(stallPlan({ stallMode: false }, stallSnap())).toEqual({ type: "noop" });
  });

  it("非 stall 模式（末轮）→ noop", () => {
    g("roundNow", 3);
    g("roundAll", 3); // roundNow >= roundAll
    expect(stallPlan({}, stallSnap())).toEqual({ type: "noop" });
  });

  it("Spirit 开 + 过冷却 → spirit-off attempt", () => {
    enterStall();
    g("globalTurn", 100);
    g("lastSpiritToggleGlobalTurn", 90); // 100-90>=3
    const p = stallPlan({}, stallSnap({ spiritOn: true }));
    expect(p.type).toBe("stall");
    expect(p.attempts).toContainEqual({ kind: "spirit-off" });
  });

  it("Spirit 关 + OC 够 + MP 未满 + 无 channeling → focus attempt", () => {
    enterStall();
    const p = stallPlan(
      {},
      stallSnap({ spiritOn: false, oc: 100, mp: 50, playerBuffs: [] })
    );
    expect(p.attempts).toContainEqual({ kind: "focus" });
  });

  it("MP 低于 floor → draught attempt（11291）", () => {
    enterStall();
    const p = stallPlan(
      {},
      stallSnap({ spiritOn: false, oc: 0, mp: 30, sp: 100, playerBuffs: [] })
    );
    expect(p.attempts).toContainEqual({ kind: "draught", id: 11291 });
  });
});

describe("decideScroll", () => {
  it("启用 + buff 未上 → 收集 scroll item id", () => {
    // Pr = Scroll of Protection（id 13111, img1 "protection"）
    const p = scrollPlan(
      { scroll: { Pr: true } },
      snap({ playerBuffs: [] })
    );
    expect(p.candidates).toContain(13111);
  });

  it("对应 buff 已上 → 不收集", () => {
    const p = scrollPlan(
      { scroll: { Pr: true } },
      snap({ playerBuffs: ["protection"] })
    );
    expect(p.candidates).not.toContain(13111);
  });

  it("scrollFirst：buff 名需带 _scroll 后缀才算已上", () => {
    // scrollFirst 开 → 检查 "protection_scroll"；只有 "protection" → 视为未上 → 仍收集
    const p = scrollPlan(
      { scroll: { Pr: true }, scrollFirst: true },
      snap({ playerBuffs: ["protection"] })
    );
    expect(p.candidates).toContain(13111);
  });

  it("scroll 开关关 → 不收集", () => {
    const p = scrollPlan({ scroll: { Pr: false } }, snap());
    expect(p.candidates).not.toContain(13111);
  });

  it("多 img 卷轴（Go mult=3）：任一 buff 已上 → 不收集", () => {
    // Go img2 "shadowveil" 已上 → 整张不收集
    const p = scrollPlan(
      { scroll: { Go: true } },
      snap({ playerBuffs: ["shadowveil"] })
    );
    expect(p.candidates).not.toContain(13299);
  });
});
