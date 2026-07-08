import { describe, expect, it, vi } from "vitest";
import { DiagnosticConsoleEvent, runDiagnosticConsoleAutomation } from "./diagnostic-console.js";

describe("runDiagnosticConsoleAutomation", () => {
  it("routes diagnostic warnings through the typed console entry", () => {
    const warn = vi.fn();

    expect(
      runDiagnosticConsoleAutomation(
        {
          type: DiagnosticConsoleEvent.WARN,
          args: ["[HVAA] failed", { stage: "write" }],
        },
        { console: { warn } }
      )
    ).toBe(true);

    expect(warn).toHaveBeenCalledWith("[HVAA] failed", { stage: "write" });
  });

  it("isolates console hook failures from diagnostic evidence flows", () => {
    const error = vi.fn(() => {
      throw new Error("console blocked");
    });

    expect(
      runDiagnosticConsoleAutomation(
        {
          type: DiagnosticConsoleEvent.ERROR,
          args: ["[HVAA] failed", new Error("boom")],
        },
        { console: { error } }
      )
    ).toBe(false);
  });

  it("fails closed for unknown diagnostic console events", () => {
    const warn = vi.fn();

    expect(
      runDiagnosticConsoleAutomation({ type: "unknown", args: ["x"] }, { console: { warn } })
    ).toBe(false);
    expect(warn).not.toHaveBeenCalled();
  });
});
