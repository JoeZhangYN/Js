import { describe, expect, it, vi } from "vitest";
import {
  createCustomDictionaryCapability,
  CUSTOM_DICTIONARY_STORAGE_KEY,
  CustomDictionaryEvent,
} from "./custom-dictionary.js";

function documentWith(entries) {
  return JSON.stringify({ schemaVersion: 1, entries });
}

describe("custom dictionary capability", () => {
  it("shares one fixed key and resolves both directions without World arguments", () => {
    const values = new Map([
      [
        CUSTOM_DICTIONARY_STORAGE_KEY,
        { schemaVersion: 1, entries: [{ group: "topMenu", source: "Equipment", zhCN: "装备" }] },
      ],
    ]);
    const dictionary = createCustomDictionaryCapability({
      gmGetValue: (key) => values.get(key),
      gmSetValue: (key, value) => values.set(key, value),
      warn: vi.fn(),
    });

    expect(
      dictionary.run({
        type: CustomDictionaryEvent.RESOLVE_FORWARD,
        group: "topMenu",
        source: "Equipment",
      })
    ).toBe("装备");
    expect(
      dictionary.run({
        type: CustomDictionaryEvent.RESOLVE_REVERSE,
        group: "topMenu",
        zhCN: "裝備",
      })
    ).toBe("Equipment");
    expect([...values.keys()]).toEqual([CUSTOM_DICTIONARY_STORAGE_KEY]);
  });

  it("merges imports by group and source with incoming entries winning", () => {
    const values = new Map();
    const dictionary = createCustomDictionaryCapability({
      gmGetValue: (key) => values.get(key),
      gmSetValue: (key, value) => values.set(key, value),
      warn: vi.fn(),
    });

    expect(
      dictionary.run({
        type: CustomDictionaryEvent.IMPORT_TEXT,
        text: documentWith([
          { group: "topMenu", source: "Stamina", zhCN: "精力" },
          { group: "topMenu", source: "Character", zhCN: "人物" },
        ]),
      }).ok
    ).toBe(true);
    expect(
      dictionary.run({
        type: CustomDictionaryEvent.IMPORT_TEXT,
        text: documentWith([{ group: "topMenu", source: "Stamina", zhCN: "体力" }]),
      }).document.entries
    ).toEqual([
      { group: "topMenu", source: "Stamina", zhCN: "体力" },
      { group: "topMenu", source: "Character", zhCN: "人物" },
    ]);
  });

  it("fails closed without claiming a malformed import or failed write succeeded", () => {
    const warn = vi.fn();
    const dictionary = createCustomDictionaryCapability({
      gmGetValue: () => undefined,
      gmSetValue: () => {
        throw new Error("quota");
      },
      warn,
    });

    expect(
      dictionary.run({ type: CustomDictionaryEvent.IMPORT_TEXT, text: "{}" })
    ).toMatchObject({ ok: false, reason: "invalidDocument" });
    expect(
      dictionary.run({
        type: CustomDictionaryEvent.IMPORT_TEXT,
        text: documentWith([{ group: "menu", source: "Character", zhCN: "角色" }]),
      })
    ).toMatchObject({ ok: false, reason: "storageWriteFailed" });
    expect(warn).toHaveBeenCalled();
  });
});
