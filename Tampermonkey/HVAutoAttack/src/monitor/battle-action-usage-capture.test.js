import { describe, expect, it, vi } from "vitest";
import {
  BattleActionUsageCaptureEvent,
  runBattleActionUsageCapture,
} from "./battle-action-usage-capture.js";

function deps({ info, recordUsage = true, elements = {}, log = [] } = {}) {
  return {
    g: vi.fn((key) => (key === "option" ? { recordUsage } : undefined)),
    gE: vi.fn((selector, mode) => {
      if (selector === "#textlog>tbody>tr>td" && mode === "all") return log;
      return elements[selector];
    }),
    unsafeWindow: { info },
  };
}

function clearPendingUsage() {
  runBattleActionUsageCapture(
    { type: BattleActionUsageCaptureEvent.ACTION_STARTED },
    deps({ recordUsage: false })
  );
}

describe("runBattleActionUsageCapture", () => {
  it("captures magic usage cost from the selected action element", () => {
    clearPendingUsage();
    const spell = {
      textContent: "Fiery Blast",
      getAttribute: vi.fn(() => "foo('a', 'b', 'c', 12, 34, 5)"),
    };

    expect(
      runBattleActionUsageCapture(
        { type: BattleActionUsageCaptureEvent.ACTION_STARTED },
        deps({
          info: { mode: "magic", skill: "#spell" },
          elements: { "#spell": spell },
        })
      )
    ).toEqual({ mode: "magic", magic: "Fiery Blast", mp: 12, oc: 34 });
  });

  it("captures item usage from the battle item pane", () => {
    clearPendingUsage();

    expect(
      runBattleActionUsageCapture(
        { type: BattleActionUsageCaptureEvent.ACTION_STARTED },
        deps({
          info: { mode: "items", skill: "Health Potion" },
          elements: {
            '#pane_item div[id^="ikey"][onclick*="skill(\'Health Potion\')"]': {
              textContent: "Health Potion x3",
            },
          },
        })
      )
    ).toEqual({ mode: "items", item: "Health Potion x3" });
  });

  it("attaches the battle log when the action ends", () => {
    clearPendingUsage();
    const log = [{ textContent: "You hit a monster for 10 damage" }];

    runBattleActionUsageCapture(
      { type: BattleActionUsageCaptureEvent.ACTION_STARTED },
      deps({ info: { mode: "attack", skill: "attack" } })
    );

    expect(
      runBattleActionUsageCapture(
        { type: BattleActionUsageCaptureEvent.ACTION_ENDED },
        deps({ log })
      )
    ).toEqual({ mode: "attack", log });
  });

  it("clears pending usage when recording is disabled", () => {
    runBattleActionUsageCapture(
      { type: BattleActionUsageCaptureEvent.ACTION_STARTED },
      deps({ info: { mode: "attack", skill: "attack" } })
    );
    runBattleActionUsageCapture(
      { type: BattleActionUsageCaptureEvent.ACTION_STARTED },
      deps({ recordUsage: false })
    );

    expect(
      runBattleActionUsageCapture(
        { type: BattleActionUsageCaptureEvent.ACTION_ENDED },
        deps({ log: [{ textContent: "old log" }] })
      )
    ).toBeUndefined();
  });
});
