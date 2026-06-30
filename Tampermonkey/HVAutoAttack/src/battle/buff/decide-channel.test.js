// decideChannel 3 段 fallback 链 + recast query 精确匹配回归锁（纯决策，喂 explicit facts 断言 ChannelPlan）。
// file-size-gate: exempt test-verbose（20 用例覆盖三段优先级 + recast query 精确匹配）
import { describe, it, expect } from "vitest";
import { decideChannel } from "./decide-channel.js";

/** 最小 facts 工厂（只填 decideChannel 读到的字段）。channeling 默认 true。 */
function facts(over = {}) {
  return {
    channeling: true,
    skillReady: {},
    playerEffects: [],
    playerBuffs: [],
    ...over,
  };
}

const enabled = (over = {}) => ({ channelSkillSwitch: true, channelSkill: {}, ...over });
const plan = (opt, facts) => decideChannel({ opt, ...facts }).plan;

describe("decideChannel 返 {kind:'channel-plan'}", () => {
  it("包一层 channel-plan", () => {
    const r = decideChannel({ opt: enabled(), ...facts() });
    expect(r.kind).toBe("channel-plan");
    expect(r.plan).toBeTruthy();
  });

  it("channelSkillSwitch 未开 → noop", () => {
    expect(
      plan(
        { channelSkill: { Ha: true }, buffSkillOrderValue: "Ha" },
        facts({
          skillReady: { 412: true },
        })
      )
    ).toEqual({ type: "noop" });
  });

  it("channelSkill 未配置 → noop", () => {
    expect(
      plan(
        { channelSkillSwitch: true },
        facts({
          skillReady: { 412: true },
        })
      )
    ).toEqual({ type: "noop" });
  });

  it("非 channeling → noop", () => {
    expect(
      plan(
        enabled({ channelSkill: { Ha: true }, buffSkillOrderValue: "Ha" }),
        facts({
          channeling: false,
          skillReady: { 412: true },
        })
      )
    ).toEqual({ type: "noop" });
  });
});

describe("第一段：channelSkill 列表", () => {
  it("buff 未上 + skillReady → click BUFF_SKILL_LIB.id", () => {
    // Ha=haste, id=412；playerEffects 无 haste → recast query=true
    const p = plan(
      enabled({ channelSkill: { Ha: true }, buffSkillOrderValue: "Ha" }),
      facts({ skillReady: { 412: true } })
    );
    expect(p).toEqual({ type: "click", skillId: "412" });
  });

  it("buff 已上且剩余>1 → 不重施（recast query=false）", () => {
    const p = plan(
      enabled({ channelSkill: { Ha: true }, buffSkillOrderValue: "Ha" }),
      facts({
        skillReady: { 412: true },
        playerEffects: [{ img: "haste", name: "Hastened", turns: 5 }],
      })
    );
    expect(p).toEqual({ type: "noop" });
  });

  it("buff 剩余<=1 → 重施", () => {
    const p = plan(
      enabled({ channelSkill: { Ha: true }, buffSkillOrderValue: "Ha" }),
      facts({
        skillReady: { 412: true },
        playerEffects: [{ img: "haste", name: "Hastened", turns: 1 }],
      })
    );
    expect(p).toEqual({ type: "click", skillId: "412" });
  });

  it("recast query 精确文件名匹配防 substring 冲突（regen vs regeneration）", () => {
    // Re=regen, id=312；玩家身上是 "regeneration"（非 regen）→ 精确匹配视为未上 → 需重施
    const p = plan(
      enabled({ channelSkill: { Re: true }, buffSkillOrderValue: "Re" }),
      facts({
        skillReady: { 312: true },
        playerEffects: [{ img: "regeneration", name: "Regeneration", turns: 9 }],
      })
    );
    expect(p).toEqual({ type: "click", skillId: "312" });
  });

  it("skillReady=false → 该段不命中，落 noop", () => {
    const p = plan(
      enabled({ channelSkill: { Ha: true }, buffSkillOrderValue: "Ha" }),
      facts({ skillReady: { 412: false } })
    );
    expect(p).toEqual({ type: "noop" });
  });

  it("按 buffSkillOrderValue 序返第一个命中", () => {
    // 序 Pr,Ha：Pr(411) 未 ready → 跳；Ha(412) ready + 未上 → 命中
    const p = plan(
      enabled({ channelSkill: { Pr: true, Ha: true }, buffSkillOrderValue: "Pr,Ha" }),
      facts({ skillReady: { 411: false, 412: true } })
    );
    expect(p).toEqual({ type: "click", skillId: "412" });
  });
});

describe("第二段：channelSkill2", () => {
  it("channelSkill2 + 按序 skillReady → click skillId", () => {
    const p = plan(
      enabled({ channelSkill2: true, channelSkill2OrderValue: "999,888" }),
      facts({ skillReady: { 999: false, 888: true } })
    );
    expect(p).toEqual({ type: "click", skillId: "888" });
  });

  it("第一段命中优先于第二段", () => {
    const p = plan(
      {
        channelSkillSwitch: true,
        channelSkill: { Ha: true },
        buffSkillOrderValue: "Ha",
        channelSkill2: true,
        channelSkill2OrderValue: "888",
      },
      facts({ skillReady: { 412: true, 888: true } })
    );
    expect(p).toEqual({ type: "click", skillId: "412" });
  });

  it("channelSkill2 全 not ready → 落第三段/noop", () => {
    const p = plan(
      enabled({ channelSkill2: true, channelSkill2OrderValue: "888" }),
      facts({ skillReady: { 888: false } })
    );
    expect(p).toEqual({ type: "noop" });
  });
});

describe("第三段：buff 续施", () => {
  it("turns<=1 的 NAME_TO_BUFF_CODE buff → 取 code→lib.id 重施", () => {
    // Hastened → Ha → id 412
    const p = plan(
      enabled(),
      facts({
        skillReady: { 412: true },
        playerEffects: [{ img: "haste", name: "Hastened", turns: 1 }],
      })
    );
    expect(p).toEqual({ type: "click", skillId: "412" });
  });

  it("按 turns 升序：最先消失优先", () => {
    // 两个都 turns<=1：Protection turns=0 先于 Hastened turns=1
    const p = plan(
      enabled(),
      facts({
        skillReady: { 411: true, 412: true },
        playerEffects: [
          { img: "haste", name: "Hastened", turns: 1 },
          { img: "protection", name: "Protection", turns: 0 },
        ],
      })
    );
    expect(p).toEqual({ type: "click", skillId: "411" }); // Protection = Pr = 411
  });

  it("turns>1 不续施", () => {
    const p = plan(
      enabled(),
      facts({
        skillReady: { 412: true },
        playerEffects: [{ img: "haste", name: "Hastened", turns: 3 }],
      })
    );
    expect(p).toEqual({ type: "noop" });
  });

  it("永续（Infinity）buff 不参与续施", () => {
    const p = plan(
      enabled(),
      facts({
        skillReady: { 412: true },
        playerEffects: [{ img: "haste", name: "Hastened", turns: Infinity }],
      })
    );
    expect(p).toEqual({ type: "noop" });
  });

  it("_scroll buff 不参与续施", () => {
    const p = plan(
      enabled(),
      facts({
        skillReady: { 412: true },
        playerEffects: [{ img: "haste_scroll", name: "Hastened", turns: 1 }],
      })
    );
    expect(p).toEqual({ type: "noop" });
  });

  it("Cloak of the Fallen + 无 sparklife + 422 ready → click 422", () => {
    const p = plan(
      enabled(),
      facts({
        skillReady: { 422: true },
        playerEffects: [{ img: "cloak", name: "Cloak of the Fallen", turns: 1 }],
        playerBuffs: ["cloak"],
      })
    );
    expect(p).toEqual({ type: "click", skillId: "422" });
  });

  it("Cloak of the Fallen 但已有 sparklife → 不续 422", () => {
    const p = plan(
      enabled(),
      facts({
        skillReady: { 422: true },
        playerEffects: [{ img: "cloak", name: "Cloak of the Fallen", turns: 1 }],
        playerBuffs: ["cloak", "sparklife"],
      })
    );
    expect(p).toEqual({ type: "noop" });
  });

  it("续施技能未 ready → 不命中", () => {
    const p = plan(
      enabled(),
      facts({
        skillReady: { 412: false },
        playerEffects: [{ img: "haste", name: "Hastened", turns: 1 }],
      })
    );
    expect(p).toEqual({ type: "noop" });
  });
});

describe("全段未命中 → noop", () => {
  it("空 opt + 空 snap → noop", () => {
    expect(plan({}, facts())).toEqual({ type: "noop" });
  });
});
