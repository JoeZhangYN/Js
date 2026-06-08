// Commit 4：runRules 编排语义回归锁（when 门控 / decide→dispatch / acted 短路）。
import { describe, it, expect, beforeEach, vi } from "vitest";
import { runRules } from "./step-runner.js";
import { g } from "../state/store.js";

beforeEach(() => {
  g("end", false);
});

describe("runRules", () => {
  it("when=false → 跳过该 rule 的 decide", () => {
    const decide = vi.fn(() => ({ kind: "noop" }));
    runRules([{ name: "g", when: () => false, decide }], {}, {});
    expect(decide).not.toHaveBeenCalled();
  });

  it("when=true → 调用 decide", () => {
    const decide = vi.fn(() => ({ kind: "noop" }));
    runRules([{ name: "g", when: () => true, decide }], {}, {});
    expect(decide).toHaveBeenCalledOnce();
  });

  it("acting rule(delegate 设 end) → 短路后续 rule", () => {
    const after = vi.fn(() => ({ kind: "noop" }));
    runRules(
      [
        { name: "act", decide: () => ({ kind: "delegate", name: "act", run: () => g("end", true) }) },
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
    runRules([{ name: "a", decide: a }, { name: "b", decide: b }], {}, {});
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
});
