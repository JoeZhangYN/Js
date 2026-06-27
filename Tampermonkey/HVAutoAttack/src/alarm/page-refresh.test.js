import { describe, expect, it } from "vitest";
import { planPageRefreshDelayMs } from "./page-refresh.js";

describe("planPageRefreshDelayMs", () => {
  it("returns no delay when periodic page refresh is disabled", () => {
    expect(planPageRefreshDelayMs({ pageRefresh: false, pageRefreshMinutes: 30 })).toBeUndefined();
  });

  it("uses configured minutes with bounded minute jitter", () => {
    expect(
      planPageRefreshDelayMs({ pageRefresh: true, pageRefreshMinutes: 30 }, { jitter: 0 })
    ).toBe(1_800_000);
    expect(
      planPageRefreshDelayMs({ pageRefresh: true, pageRefreshMinutes: 30 }, { jitter: 1 })
    ).toBe(1_860_000);
  });
});
