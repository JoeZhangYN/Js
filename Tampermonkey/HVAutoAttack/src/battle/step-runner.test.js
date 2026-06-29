// runRules 编排语义回归锁：decide→dispatch / acted 短路。
import { describe, it, expect, vi } from "vitest";
import { runRules } from "./step-runner.js";

describe("runRules", () => {
  it("acting rule(dispatch 返 acted) → 短路后续 rule", () => {
    const after = vi.fn(() => ({ kind: "noop" }));
    runRules(
      [
        { name: "act", decide: () => ({ kind: "halt", reason: "acted" }) },
        { name: "after", decide: after },
      ],
      {},
      {}
    );
    expect(after).not.toHaveBeenCalled();
  });

  it("全 noop → 全部 decide 被调用、不短路", () => {
    const a = vi.fn(() => ({ kind: "noop" }));
    const b = vi.fn(() => ({ kind: "noop" }));
    runRules(
      [
        { name: "a", decide: a },
        { name: "b", decide: b },
      ],
      {},
      {}
    );
    expect(a).toHaveBeenCalledOnce();
    expect(b).toHaveBeenCalledOnce();
  });

  it("decide 收到 (snap, opt)", () => {
    const snap = { aliveCount: 3 };
    const opt = { foo: 1 };
    const decide = vi.fn(() => ({ kind: "noop" }));
    runRules([{ name: "x", decide }], snap, opt);
    expect(decide).toHaveBeenCalledWith(snap, opt);
  });

  it("旧 rule.when 不再是 runner 协议，业务门控必须在 decide 内返回 noop", () => {
    const decide = vi.fn(() => ({ kind: "noop" }));
    runRules([{ name: "legacy", when: () => false, decide }], {}, {});
    expect(decide).toHaveBeenCalledOnce();
  });
});
