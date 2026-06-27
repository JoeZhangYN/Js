import { describe, expect, it, vi } from "vitest";
import {
  MonsterScanLearningEvent,
  runMonsterScanLearningAutomation,
} from "./monster-db-scan.js";

class FakeMutationObserver {
  static instances = [];

  constructor(callback) {
    this.callback = callback;
    this.observe = vi.fn();
    FakeMutationObserver.instances.push(this);
  }

  emit(node) {
    this.callback([{ addedNodes: [node] }]);
  }
}

function makeScanNode(html) {
  const node = document.createElement("tr");
  node.innerHTML = html;
  return node;
}

describe("runMonsterScanLearningAutomation", () => {
  it("stores valid scan results and reports a stored event", async () => {
    FakeMutationObserver.instances = [];
    const monsterEl = document.createElement("div");
    monsterEl.innerHTML = "clean";
    const setCachedMonster = vi.fn();
    const setMonsterById = vi.fn(async () => {});
    const setMonsterHp = vi.fn();
    const onStored = vi.fn();
    const info = {
      lastUpdate: "2026-06-27",
      maxHP: 12345,
      monsterName: "Dragon",
    };

    expect(
      runMonsterScanLearningAutomation(
        { type: MonsterScanLearningEvent.START, onStored },
        {
          checkScanResultValidity: () => true,
          g: () => [{ level: 500, monsterId: 101, name: "Dragon" }],
          gE: (selector, root) => {
            if (selector === "#textlog>tbody") return document.createElement("tbody");
            if (selector === "div.btm1") return [monsterEl];
            if (selector === ".btm3") return { textContent: "Dragon" };
            return root?.querySelector?.(selector) ?? null;
          },
          MutationObserver: FakeMutationObserver,
          parseScanResult: () => ({ ...info }),
          setCachedMonster,
          setMonsterById,
          setMonsterHp,
          time: () => "2026-06-27",
        }
      )
    ).toBe(true);

    FakeMutationObserver.instances[0].emit(makeScanNode("<td>Scanning Dragon</td>"));
    await Promise.resolve();

    expect(setMonsterById).toHaveBeenCalledWith({
      ...info,
      monsterId: 101,
    });
    expect(setCachedMonster).toHaveBeenCalledWith(101, {
      ...info,
      monsterId: 101,
    });
    expect(setMonsterHp).toHaveBeenCalledWith(101, 500, 12345, "2026-06-27");
    expect(onStored).toHaveBeenCalledTimes(1);
  });

  it("does nothing when the battle log is missing", () => {
    expect(
      runMonsterScanLearningAutomation(
        { type: MonsterScanLearningEvent.START },
        {
          gE: () => null,
          MutationObserver: FakeMutationObserver,
        }
      )
    ).toBe(false);
  });
});
