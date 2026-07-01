import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleItemCommandEvent, runBattleItemCommand } from "./battle-item-command.js";

const mocks = vi.hoisted(() => ({
  gE: vi.fn(),
  itemSelector: vi.fn((id) => `#item-${id}`),
}));

vi.mock("../dom/query.js", () => ({ gE: mocks.gE }));
vi.mock("../dom/selectors.js", () => ({ itemSelector: mocks.itemSelector }));

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
  sessionStorage.clear();
});

describe("runBattleItemCommand DOM read failures", () => {
  it("records gem button read failures as not acted", () => {
    mocks.gE.mockImplementation(() => {
      throw new Error("gem read exploded");
    });

    expect(runBattleItemCommand({ type: BattleItemCommandEvent.CLICK_GEM })).toBe(false);

    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleCommand"))).toMatchObject({
      command: "item.clickGem",
      result: "rejected",
      reason: "gemElementReadFailed",
      detail: { error: "gem read exploded" },
    });
  });

  it("records item selector failures as not acted before hooks run", () => {
    const beforeClick = vi.fn();
    mocks.itemSelector.mockImplementation(() => {
      throw new Error("selector exploded");
    });

    expect(
      runBattleItemCommand({
        type: BattleItemCommandEvent.CLICK_ITEM,
        itemId: 12101,
        beforeClick,
      })
    ).toBe(false);

    expect(beforeClick).not.toHaveBeenCalled();
    expect(mocks.gE).not.toHaveBeenCalled();
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleCommand"))).toMatchObject({
      command: "item.clickItem",
      result: "rejected",
      reason: "itemSelectorFailed",
      detail: { itemId: 12101, error: "selector exploded" },
    });
  });

  it("records item element read failures as not acted before hooks run", () => {
    const beforeClick = vi.fn();
    mocks.gE.mockImplementation(() => {
      throw new Error("item read exploded");
    });

    expect(
      runBattleItemCommand({
        type: BattleItemCommandEvent.CLICK_ITEM,
        itemId: 12101,
        beforeClick,
      })
    ).toBe(false);

    expect(beforeClick).not.toHaveBeenCalled();
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleCommand"))).toMatchObject({
      command: "item.clickItem",
      result: "rejected",
      reason: "itemElementReadFailed",
      detail: { itemId: 12101, error: "item read exploded" },
    });
  });
});
