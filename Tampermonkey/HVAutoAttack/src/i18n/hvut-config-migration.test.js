import { describe, expect, it } from "vitest";
import {
  getHvutConfigCarryKeys,
  getHvutConfigNamespace,
  migrateLegacyHvutMonsterLabLog,
  normalizeLegacyHvutPrices,
  normalizeHvutConfigSettings,
} from "./hvut-config-migration.js";

describe("HVUT config migration", () => {
  it("selects the storage namespace from segment identity", () => {
    expect(getHvutConfigNamespace({ isIsekai: false })).toBe("hvut");
    expect(getHvutConfigNamespace({ isIsekai: true })).toBe("hvuti");
  });

  it("keeps persistent-only legacy equipment names in persistent migration", () => {
    expect(getHvutConfigCarryKeys({ isIsekai: false })).toEqual([
      "equipnames",
      "equipset",
      "ch_style",
      "se_settings",
      "ss_log",
      "ml_log",
    ]);
  });

  it("does not carry persistent-only legacy equipment names in Isekai migration", () => {
    expect(getHvutConfigCarryKeys({ isIsekai: true })).toEqual([
      "equipset",
      "ch_style",
      "se_settings",
      "ss_log",
      "ml_log",
    ]);
  });

  it("upgrades legacy equipCode string and aligns settings with defaults", () => {
    const defaults = {
      equipCode: { EQUIP: "default", CATEGORY: "category" },
      keep: true,
      nested: { value: 1 },
    };

    expect(
      normalizeHvutConfigSettings(
        {
          equipCode: "{$name}",
          keep: false,
          orphan: "remove",
        },
        defaults
      )
    ).toEqual({
      equipCode: { EQUIP: "{$name}", CATEGORY: "category" },
      keep: false,
      nested: { value: 1 },
    });
  });

  it("migrates legacy Monster Lab logs without mutating the original", () => {
    const gift = Array.from({ length: 46 }, (_, index) => `gift-${index}`);
    const legacy = [
      null,
      {
        pa: [{ value: 1, to: 2 }],
        er: [{ value: 3, to: 4 }],
        ct: [{ value: 5, to: 6, max: 7 }],
        gift,
        selected: "old",
      },
    ];

    const migrated = migrateLegacyHvutMonsterLabLog(legacy);

    expect(migrated[0]).toEqual({ version: 1 });
    expect(migrated[1]).toMatchObject({
      pa: [[1, 2]],
      er: [[3, 4]],
      ct: [[5, 6, 7]],
    });
    expect(migrated[1].gift).toBeUndefined();
    expect(migrated[1].selected).toBeUndefined();
    expect(migrated[1].gifts.slice(28, 33)).toEqual(["gift-40", "gift-41", "gift-42", "gift-43", "gift-44"]);
    expect(legacy[0]).toBeNull();
    expect(legacy[1].gift).toBe(gift);
  });

  it("flattens legacy nested price groups without mutating the original", () => {
    const prices = {
      Materials: { "Crystal of Vigor": 12 },
      "Health Potion": 20,
    };

    expect(normalizeLegacyHvutPrices(prices)).toEqual({
      "Crystal of Vigor": 12,
      "Health Potion": 20,
    });
    expect(prices).toEqual({
      Materials: { "Crystal of Vigor": 12 },
      "Health Potion": 20,
    });
  });
});
