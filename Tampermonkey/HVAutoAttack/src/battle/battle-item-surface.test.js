import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleItemSurfaceEvent, runBattleItemSurface } from "./battle-item-surface.js";

const mocks = vi.hoisted(() => ({
  gE: vi.fn(),
}));

vi.mock("../dom/query.js", () => ({ gE: mocks.gE }));

beforeEach(() => {
  mocks.gE.mockReset();
});

describe("runBattleItemSurface", () => {
  it("reads current gem name through one query entry", () => {
    mocks.gE.mockReturnValue({ textContent: "Mystic Gem" });

    expect(runBattleItemSurface({ type: BattleItemSurfaceEvent.READ_GEM_NAME })).toBe("Mystic Gem");
    expect(mocks.gE).toHaveBeenCalledWith("#ikey_p");
  });

  it("returns null when no gem is available", () => {
    mocks.gE.mockReturnValue(null);

    expect(runBattleItemSurface()).toBeNull();
    expect(mocks.gE).toHaveBeenCalledWith("#ikey_p");
  });

  it("rejects unknown events without reading item DOM", () => {
    expect(runBattleItemSurface({ type: "unknown" })).toBeNull();
    expect(mocks.gE).not.toHaveBeenCalled();
  });
});
