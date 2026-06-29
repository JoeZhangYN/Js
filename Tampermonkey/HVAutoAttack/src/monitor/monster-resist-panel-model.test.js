import { describe, expect, it, vi } from "vitest";
import {
  MonsterResistPanelModelEvent,
  runMonsterResistPanelModel,
} from "./monster-resist-panel-model.js";

describe("monster resist panel model", () => {
  it("builds display rows by monster order identity and cached profiles", async () => {
    const primeProfiles = vi.fn(async () => {});
    const readProfile = vi.fn((id) => (id === 101 ? { attack: "piercing" } : null));

    await expect(
      runMonsterResistPanelModel(
        {
          type: MonsterResistPanelModelEvent.BUILD_ROWS,
          monsterNames: ["Arthropod", "Dragonkin"],
        },
        {
          primeProfiles,
          readProfile,
          readMonsterIdByOrder: () => (order) => [101, 202][order],
        }
      )
    ).resolves.toEqual([
      { name: "Arthropod", info: { attack: "piercing" } },
      { name: "Dragonkin", info: null },
    ]);

    expect(primeProfiles).toHaveBeenCalledWith([101, 202]);
    expect(readProfile).toHaveBeenCalledWith(101);
    expect(readProfile).toHaveBeenCalledWith(202);
  });

  it("drops empty rendered names after priming by order", async () => {
    const primeProfiles = vi.fn(async () => {});

    await expect(
      runMonsterResistPanelModel(
        {
          type: MonsterResistPanelModelEvent.BUILD_ROWS,
          monsterNames: ["Arthropod", ""],
        },
        {
          primeProfiles,
          readProfile: () => null,
          readMonsterIdByOrder: () => (order) => [101, 202][order],
        }
      )
    ).resolves.toEqual([{ name: "Arthropod", info: null }]);
    expect(primeProfiles).toHaveBeenCalledWith([101, 202]);
  });
});
