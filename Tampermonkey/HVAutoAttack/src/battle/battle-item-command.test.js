import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleItemCommandEvent, runBattleItemCommand } from "./battle-item-command.js";

const mocks = vi.hoisted(() => ({
  gE: vi.fn(),
  itemSelector: vi.fn((id) => `#item-${id}`),
}));

vi.mock("../dom/query.js", () => ({ gE: mocks.gE }));
vi.mock("../dom/selectors.js", () => ({ itemSelector: mocks.itemSelector }));

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockClear();
  sessionStorage.clear();
});

describe("runBattleItemCommand", () => {
  it("clicks the current gem button through one command entry", () => {
    const gem = { click: vi.fn() };
    mocks.gE.mockReturnValue(gem);

    expect(runBattleItemCommand({ type: BattleItemCommandEvent.CLICK_GEM })).toBe(true);

    expect(mocks.gE).toHaveBeenCalledWith("#ikey_p");
    expect(gem.click).toHaveBeenCalledTimes(1);
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleCommand"))).toMatchObject({
      command: "item.clickGem",
      result: "accepted",
      reason: "clicked",
    });
  });

  it("clicks an inventory item by id through the item selector", () => {
    const item = { click: vi.fn() };
    mocks.gE.mockReturnValue(item);

    expect(runBattleItemCommand({ type: BattleItemCommandEvent.CLICK_ITEM, itemId: 12101 })).toBe(
      true
    );

    expect(mocks.itemSelector).toHaveBeenCalledWith(12101);
    expect(mocks.gE).toHaveBeenCalledWith("#item-12101");
    expect(item.click).toHaveBeenCalledTimes(1);
  });

  it("runs beforeClick after finding the item and before clicking it", () => {
    const calls = [];
    const item = { click: vi.fn(() => calls.push("click")) };
    mocks.gE.mockReturnValue(item);

    expect(
      runBattleItemCommand({
        type: BattleItemCommandEvent.CLICK_ITEM,
        itemId: 11191,
        beforeClick: () => calls.push("before"),
      })
    ).toBe(true);

    expect(calls).toEqual(["before", "click"]);
  });

  it("records item click failures as not acted", () => {
    const item = {
      click: vi.fn(() => {
        throw new Error("blocked");
      }),
    };
    mocks.gE.mockReturnValue(item);

    expect(runBattleItemCommand({ type: BattleItemCommandEvent.CLICK_ITEM, itemId: 12101 })).toBe(
      false
    );

    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleCommand"))).toMatchObject({
      command: "item.clickItem",
      result: "rejected",
      reason: "clickFailed",
      detail: { itemId: 12101, error: "blocked" },
    });
  });

  it("records before-click hook failures as not acted before clicking the item", () => {
    const item = { click: vi.fn() };
    mocks.gE.mockReturnValue(item);

    expect(
      runBattleItemCommand({
        type: BattleItemCommandEvent.CLICK_ITEM,
        itemId: 12101,
        beforeClick: () => {
          throw new Error("hook failed");
        },
      })
    ).toBe(false);

    expect(item.click).not.toHaveBeenCalled();
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleCommand"))).toMatchObject({
      command: "item.clickItem",
      result: "rejected",
      reason: "beforeClickFailed",
      acted: false,
      failureReason: "beforeClickFailed",
      detail: { itemId: 12101, error: "hook failed" },
    });
  });

  it("does not run beforeClick when the item is missing", () => {
    const beforeClick = vi.fn();
    mocks.gE.mockReturnValue(null);

    expect(
      runBattleItemCommand({
        type: BattleItemCommandEvent.CLICK_ITEM,
        itemId: 11191,
        beforeClick,
      })
    ).toBe(false);

    expect(beforeClick).not.toHaveBeenCalled();
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleCommand"))).toMatchObject({
      command: "item.clickItem",
      result: "rejected",
      reason: "itemMissing",
      detail: { itemId: 11191 },
    });
  });

  it("records unknown item command rejections", () => {
    expect(runBattleItemCommand({ type: "unknown" })).toBe(false);

    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleCommand"))).toMatchObject({
      command: "item.unknown",
      result: "rejected",
      reason: "unknownItemCommand",
      detail: { eventType: "unknown" },
    });
  });

  it("records missing item command events as not acted", () => {
    expect(runBattleItemCommand()).toBe(false);

    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleCommand"))).toMatchObject({
      command: "item.unknown",
      result: "rejected",
      reason: "unknownItemCommand",
      detail: { eventType: null },
    });
  });
});
