import { describe, expect, it } from "vitest";

import { OptionSchemaEvent, runOptionSchema } from "./schema.js";

describe("runOptionSchema riddle fields", () => {
  it("exposes riddle helper and ML options through the schema entry", () => {
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "riddleHelperUi" })
    ).toMatchObject({
      key: "riddleHelperUi",
      kind: "checkbox",
      default: true,
      defaultOn: true,
      group: "Main",
    });
    expect(runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "mlAnswer" })).toMatchObject({
      key: "mlAnswer",
      kind: "checkbox",
      default: true,
      defaultOn: true,
      group: "Main",
    });
    expect(
      runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "mlBackupOnFail" })
    ).toMatchObject({
      key: "mlBackupOnFail",
      kind: "checkbox",
      default: true,
      defaultOn: true,
      group: "Main",
    });
    expect(runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "mlEndpoint" })).toMatchObject(
      {
        key: "mlEndpoint",
        kind: "text",
        default: "https://rdma.ooguy.com/help2",
        group: "Main",
      }
    );
    expect(runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: "mlApiKey" })).toMatchObject({
      key: "mlApiKey",
      kind: "text",
      default: "",
      group: "Main",
    });
  });
});
