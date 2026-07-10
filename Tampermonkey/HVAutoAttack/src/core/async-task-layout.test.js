import { describe, expect, it, vi } from "vitest";
import { AsyncTaskLayoutEvent, runAsyncTaskLayout } from "./async-task-layout.js";

function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("async task layout", () => {
  it("arranges every independent task before the final convergence wait", async () => {
    const scheduled = [];
    const execute = vi.fn((item) => item * 2);
    const schedule = vi.fn((task, delayMs) => {
      const pending = deferred();
      scheduled.push({ task, delayMs, pending });
      return pending.promise;
    });

    const result = runAsyncTaskLayout({
      type: AsyncTaskLayoutEvent.PARALLEL,
      items: [1, 2, 3],
      execute,
      schedule,
      staggerMs: 300,
    });

    expect(schedule.mock.calls.map(([, delay]) => delay)).toEqual([0, 300, 600]);
    expect(execute).not.toHaveBeenCalled();
    for (const entry of scheduled) entry.pending.resolve(await entry.task());
    await expect(result).resolves.toEqual([2, 4, 6]);
  });

  it("keeps a causal sequence ordered and can stop after a rejected result", async () => {
    const execute = vi.fn(async (item) => ({ item, accepted: item < 2 }));

    const results = await runAsyncTaskLayout({
      type: AsyncTaskLayoutEvent.SEQUENTIAL,
      items: [1, 2, 3],
      execute,
      shouldContinue: (result) => result.accepted,
    });

    expect(results.map((result) => result.item)).toEqual([1, 2]);
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it("runs identities in parallel while serializing tasks within each identity", async () => {
    const pending = new Map([
      ["a1", deferred()],
      ["a2", deferred()],
      ["b1", deferred()],
    ]);
    const started = [];
    const result = runAsyncTaskLayout({
      type: AsyncTaskLayoutEvent.GROUPED,
      items: ["a1", "a2", "b1"],
      identityOf: (item) => item[0],
      execute: (item) => {
        started.push(item);
        return pending.get(item).promise;
      },
    });
    await Promise.resolve();
    expect(started).toEqual(["a1", "b1"]);

    pending.get("a1").resolve("A1");
    await Promise.resolve();
    expect(started).toEqual(["a1", "b1", "a2"]);
    pending.get("a2").resolve("A2");
    pending.get("b1").resolve("B1");
    await expect(result).resolves.toEqual(["A1", "A2", "B1"]);
  });
});
