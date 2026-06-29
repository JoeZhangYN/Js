import { describe, expect, it } from "vitest";
import { applyBattleDropLog } from "./drop-recording.js";

function line(text, item) {
  return { item, textContent: text };
}

function item(name, color) {
  return {
    style: { color },
    textContent: `[${name}]`,
  };
}

function apply(drop, battleLog, dropQuality = 0) {
  return applyBattleDropLog(drop, battleLog, {
    dropQuality,
    readItem: (log) => log.item,
  });
}

describe("applyBattleDropLog", () => {
  it("records EXP, credit, crystals, credit drops, and equipment by quality", () => {
    const drop = { "#Credit": 0, "#EXP": 0 };

    apply(drop, [
      line("You gain 12 EXP"),
      line("You gain 34 Credit"),
      line("", item("2x Crystal of Vigor", "rgb(186, 5, 180)")),
      line("", item("Credit 45", "rgb(168, 144, 0)")),
      line("", item("Superior Axe of Slaughter", "rgb(255, 0, 0)")),
    ]);

    expect(drop).toMatchObject({
      "#Credit": 79,
      "#EXP": 12,
      "Crystal of Vigor": 2,
      "Equipment of Superior": 1,
    });
  });

  it("ignores equipment below the configured quality and stops at victory", () => {
    const drop = { "#Credit": 0, "#EXP": 0 };

    apply(
      drop,
      [
        line("", item("Average Sword of Balance", "rgb(255, 0, 0)")),
        line("", item("Legendary Shield of Protection", "rgb(255, 0, 0)")),
        line("You are Victorious!"),
        line("You gain 100 EXP"),
      ],
      5
    );

    expect(drop).toEqual({
      "#Credit": 0,
      "#EXP": 0,
      "Equipment of Legendary": 1,
    });
  });
});
