import { describe, expect, it } from "vitest";
import { RepairStateParseEvent, runRepairStateParser } from "./parse-repair-state.js";

function parseArmoryRepairState(pageText) {
  return runRepairStateParser({
    type: RepairStateParseEvent.ARMORY,
    pageText,
  });
}

describe("Armory repair state parser", () => {
  const page = `
    <form id="equipform"><input type="hidden" name="postoken" value="tok_abc123"></form>
    <script>
      var eqitems = {"100":{"m":{"50000":3,"62000":1}},"200":{"m":{"50001":2}},"300":{}};
      var itemdata = {"50000":{"n":"Repair Outfit","c":1},"50001":{"n":"Repair Kit","c":5},"62000":{"n":"Aether Shard","c":0}};
    </script>`;

  it("rejects unknown and null parser events", () => {
    expect(runRepairStateParser({ type: "unknown", pageText: page })).toBeUndefined();
    expect(runRepairStateParser(null)).toBeUndefined();
  });

  it("parses one world-invariant repair state and excludes charm-only requirements", () => {
    expect(parseArmoryRepairState(page)).toEqual({
      token: "tok_abc123",
      equips: [
        {
          id: "100",
          conditionPct: null,
          materials: [{ matId: "50000", name: "Repair Outfit", count: 3 }],
        },
        {
          id: "200",
          conditionPct: null,
          materials: [{ matId: "50001", name: "Repair Kit", count: 2 }],
        },
      ],
    });
  });

  it("parses formatted script objects without silently claiming no repair", () => {
    const formatted = `
      <form><input name="postoken" value="tok_multiline"></form>
      <script>
        var eqitems = {
          "500": { "m": { "50000": 2 } }
        };
        var itemdata = {
          "50000": { "n": "Repair Outfit", "c": 0 }
        };
      </script>`;

    expect(parseArmoryRepairState(formatted)).toMatchObject({
      token: "tok_multiline",
      equips: [
        {
          id: "500",
          materials: [{ matId: "50000", name: "Repair Outfit", count: 2 }],
        },
      ],
    });
  });

  it("returns an empty state when Armory data is absent", () => {
    expect(parseArmoryRepairState("<div>nothing</div>")).toEqual({ token: null, equips: [] });
  });
});
