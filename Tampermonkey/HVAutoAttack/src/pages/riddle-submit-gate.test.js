import { describe, expect, it, vi } from "vitest";
import { createRiddleSubmitGate } from "./riddle-submit-gate.js";

async function flushGate() {
  for (let index = 0; index < 5; index += 1) await Promise.resolve();
}

describe("riddle durable submit gate", () => {
  it("releases exactly one submit only after persistence resolves", async () => {
    let resolvePersistence;
    const persistAttempt = vi.fn(() => new Promise((resolve) => (resolvePersistence = resolve)));
    const releaseSubmit = vi.fn();
    const recordAttempt = vi.fn();
    const gate = createRiddleSubmitGate({ persistAttempt, releaseSubmit, recordAttempt });
    const first = { preventDefault: vi.fn(), stopImmediatePropagation: vi.fn() };
    const duplicate = { preventDefault: vi.fn(), stopImmediatePropagation: vi.fn() };

    expect(gate.handleClick(first)).toBe(false);
    expect(gate.handleClick(duplicate)).toBe(false);
    expect(persistAttempt).toHaveBeenCalledOnce();
    expect(releaseSubmit).not.toHaveBeenCalled();
    resolvePersistence({ outcome: "written" });
    await flushGate();

    expect(releaseSubmit).toHaveBeenCalledOnce();
    expect(recordAttempt).toHaveBeenCalledOnce();
    expect(gate.handleClick({})).toBe(true);
    expect(gate.inspect()).toBe("completed");
  });

  it("continues the game submission after optional sample persistence fails", async () => {
    const releaseSubmit = vi.fn();
    const onFailure = vi.fn();
    const gate = createRiddleSubmitGate({
      persistAttempt: () => Promise.reject(new Error("quota")),
      releaseSubmit,
      onFailure,
    });

    gate.handleClick({ preventDefault() {}, stopImmediatePropagation() {} });
    await flushGate();

    expect(onFailure).toHaveBeenCalledWith(expect.objectContaining({ message: "quota" }));
    expect(releaseSubmit).toHaveBeenCalledOnce();
  });

  it("classifies a bounded persistence timeout and still releases exactly once", async () => {
    vi.useFakeTimers();
    const releaseSubmit = vi.fn();
    const onFailure = vi.fn();
    const gate = createRiddleSubmitGate({
      persistAttempt: () => new Promise(() => {}),
      releaseSubmit,
      onFailure,
      timeoutMs: 50,
    });

    gate.handleClick({ preventDefault() {}, stopImmediatePropagation() {} });
    await vi.advanceTimersByTimeAsync(50);

    expect(onFailure).toHaveBeenCalledWith(
      expect.objectContaining({ message: "riddle sample persistence timed out after 50ms" })
    );
    expect(releaseSubmit).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });
});
