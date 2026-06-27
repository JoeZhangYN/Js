import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  MonsterResistPanelEvent,
  runMonsterResistPanelAutomation,
} from "./monster-resist-panel.js";

beforeEach(() => {
  document.head.innerHTML = "";
  document.body.innerHTML = "";
});

describe("runMonsterResistPanelAutomation", () => {
  it("renders resist rows from the current monster ids", async () => {
    document.body.innerHTML = `
      <div id="hvAABox2"></div>
      <div class="btm1"><span class="btm3">Arthropod</span></div>
      <div class="btm1"><span class="btm3">Dragonkin</span></div>
    `;
    const primeProfiles = vi.fn(async () => {});
    const readProfile = vi.fn((id) =>
      id === 101
        ? {
            attack: "piercing",
            fire: 10,
            cold: -5,
            elec: 0,
            wind: 0,
            holy: 0,
            dark: 0,
            crushing: 0,
            slashing: 0,
            piercing: -10,
          }
        : null
    );

    await runMonsterResistPanelAutomation(
      { type: MonsterResistPanelEvent.REFRESH },
      {
        cE: (tag) => document.createElement(tag),
        document,
        gE: (selector, rootOrAll) => {
          if (rootOrAll === "all") return document.querySelectorAll(selector);
          if (rootOrAll instanceof Element) return rootOrAll.querySelector(selector);
          return document.querySelector(selector);
        },
        readMonsterIdByOrder: () => (order) => [101, 202][order],
        readProfile,
        primeProfiles,
      }
    );

    expect(primeProfiles).toHaveBeenCalledWith([101, 202]);
    expect(readProfile).toHaveBeenCalledWith(101);
    expect(readProfile).toHaveBeenCalledWith(202);
    expect(document.querySelector("#hvAAResist").textContent).toContain("Arthropod");
    expect(document.querySelector("#hvAAResist").textContent).toContain("待 scan");
  });

  it("ignores unknown events", () => {
    expect(runMonsterResistPanelAutomation({ type: "unknown" })).toBeUndefined();
  });
});
