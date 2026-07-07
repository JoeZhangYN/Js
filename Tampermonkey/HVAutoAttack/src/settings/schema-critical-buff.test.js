import { describe, expect, it } from "vitest";

import { OptionSchemaEvent, runOptionSchema } from "./schema.js";

describe("runOptionSchema critical buff fields", () => {
  it("exposes critical buff pause options through the schema entry", () => {
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "pauseOnCriticalBuffExpire" })
    ).toMatchObject({
      key: "pauseOnCriticalBuffExpire",
      kind: "checkbox",
      default: false,
      group: "Main",
    });
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "criticalBuffMinTurns" })
    ).toMatchObject({
      key: "criticalBuffMinTurns",
      kind: "number",
      default: 2,
      description: {
        l2: " turns (pause when critical buff ≤N & MP low; fill buff names below)",
      },
    });
  });
});
