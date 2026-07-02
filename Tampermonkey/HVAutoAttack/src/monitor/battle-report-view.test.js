import { describe, expect, it } from "vitest";
import { BattleReportViewEvent, runBattleReportViewAutomation } from "./battle-report-view.js";

describe("runBattleReportViewAutomation", () => {
  it("rejects unknown and null view events without rendering report markup", () => {
    expect(runBattleReportViewAutomation({ type: "unknown" })).toBe("");
    expect(runBattleReportViewAutomation(null)).toBe("");
  });

  it("renders a single drop report table body", () => {
    expect(
      runBattleReportViewAutomation({
        type: BattleReportViewEvent.RENDER_DROP_TABLE_BODY,
        report: { mode: "single", rows: [{ key: "#Credit", value: 12 }] },
      })
    ).toContain("<tr><td>#Credit</td><td>12</td></tr>");
  });

  it("renders usage history with section labels and columns", () => {
    const html = runBattleReportViewAutomation({
      type: BattleReportViewEvent.RENDER_USAGE_TABLE_BODY,
      report: {
        mode: "history",
        columns: ["now", "old"],
        sections: [{ key: "magic", rows: [{ key: "Fireball", values: [2, ""] }] }],
      },
    });

    expect(html).toContain("<td>now</td><td>old</td>");
    expect(html).toContain("Magic (Frequency)");
    expect(html).toContain("<tr><td>Fireball</td><td>2</td><td></td></tr>");
  });
});
