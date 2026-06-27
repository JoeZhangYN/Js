import { describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import { BattleDropEvent, runBattleDropAutomation } from "./drop-monitor.js";

function logLine(text, item) {
  const row = document.createElement("td");
  if (item) {
    const span = document.createElement("span");
    span.textContent = `[${item.name}]`;
    span.style.color = item.color;
    row.appendChild(span);
  } else {
    row.textContent = text;
  }
  return row;
}

function deps({ rows, values = {}, option = {}, roundNow = 1, roundAll = 2 }) {
  const setValue = vi.fn((key, value) => {
    values[key] = value;
  });
  const delValue = vi.fn((key) => {
    delete values[key];
  });
  return {
    delValue,
    g: (key) => {
      if (key === "option") return option;
      if (key === "roundNow") return roundNow;
      if (key === "roundAll") return roundAll;
      return undefined;
    },
    gE: (selector, rootOrAll) => {
      if (rootOrAll === "all") return rows;
      return rootOrAll.querySelector(selector);
    },
    getValue: (key) => values[key],
    setValue,
    readLocalTimestampLabel: () => "now",
    values,
  };
}

describe("runBattleDropAutomation", () => {
  it("records EXP, credits, and items through the event entry", () => {
    const runtime = deps({
      option: { dropQuality: 0, recordEach: false },
      rows: [
        logLine("You gain 12 EXP"),
        logLine("You gain 34 Credit"),
        logLine("", { color: "rgb(186, 5, 180)", name: "2x Crystal of Vigor" }),
      ],
    });

    expect(runBattleDropAutomation({ type: BattleDropEvent.COMPLETION_REACHED }, runtime)).toBe(
      true
    );

    expect(runtime.values[STORAGE_KEYS.DROP]).toMatchObject({
      "#Credit": 34,
      "#EXP": 12,
      "Crystal of Vigor": 2,
      "#startTime": "now",
    });
  });

  it("archives the active drop record at the final round", () => {
    const values = {
      [STORAGE_KEYS.BATTLE_CODE]: "AR-10",
      [STORAGE_KEYS.DROP]: { "#Credit": 5, "#EXP": 0, "#startTime": "old" },
    };
    const runtime = deps({
      option: { dropQuality: 0, recordEach: true },
      roundAll: 3,
      roundNow: 3,
      rows: [logLine("You gain 1 Credit")],
      values,
    });

    runBattleDropAutomation({ type: BattleDropEvent.COMPLETION_REACHED }, runtime);

    expect(values[STORAGE_KEYS.DROP]).toBeUndefined();
    expect(values[STORAGE_KEYS.DROP_OLD]).toEqual([
      {
        "#Credit": 6,
        "#EXP": 0,
        "#endTime": "now",
        "#startTime": "old",
        __name: "AR-10",
      },
    ]);
  });
});
