import { afterEach, describe, expect, it, vi } from "vitest";
import { submitRiddleAnswerCommand } from "./riddle-submit-command.js";

const mocks = vi.hoisted(() => ({
  runDiagnosticConsoleAutomation: vi.fn(),
}));

vi.mock("../core/diagnostic-console.js", () => ({
  DiagnosticConsoleEvent: Object.freeze({ WARN: "warn" }),
  runDiagnosticConsoleAutomation: mocks.runDiagnosticConsoleAutomation,
}));

afterEach(() => {
  document.body.innerHTML = "";
  sessionStorage.clear();
  mocks.runDiagnosticConsoleAutomation.mockReset();
  vi.restoreAllMocks();
});

function renderRiddleForm() {
  document.body.innerHTML = `
    <div id="riddler1">
      <div><div><input type="checkbox"></div></div>
      <div><div><input type="checkbox"></div></div>
      <div><div><input type="checkbox"></div></div>
      <div><div><input type="checkbox"></div></div>
      <div><div><input type="checkbox"></div></div>
      <div><div><input type="checkbox"></div></div>
    </div>
    <button id="riddlesubmit" disabled></button>
  `;
}

function expectSubmitFailure(stage) {
  expect(JSON.parse(sessionStorage.getItem("HVAA:lastRiddleSubmitFailure"))).toMatchObject({
    capability: "riddleSubmit",
    stage,
  });
}

describe("riddle submit command", () => {
  it("selects answer checkboxes and clicks the enabled submit button", () => {
    renderRiddleForm();
    const submitted = vi.fn();
    document.getElementById("riddlesubmit").addEventListener("click", submitted);

    expect(submitRiddleAnswerCommand(["ra"])).toBe(true);

    expect(document.querySelectorAll("input")[1].checked).toBe(true);
    expect(document.getElementById("riddlesubmit").disabled).toBe(false);
    expect(submitted).toHaveBeenCalledTimes(1);
  });

  it("records missing riddle form without claiming a submitted action", () => {
    expect(submitRiddleAnswerCommand(["ra"])).toBe(false);

    expect(mocks.runDiagnosticConsoleAutomation).toHaveBeenCalledWith({
      type: "warn",
      args: ["[HVAA][riddle] submit failed", expect.objectContaining({ stage: "missing-riddler" })],
    });
    expectSubmitFailure("missing-riddler");
  });

  it("records click failures without throwing", () => {
    renderRiddleForm();
    vi.spyOn(HTMLButtonElement.prototype, "click").mockImplementation(() => {
      throw new Error("submit blocked");
    });

    let acted = true;
    expect(() => {
      acted = submitRiddleAnswerCommand(["ra"]);
    }).not.toThrow();
    expect(acted).toBe(false);
    expectSubmitFailure("click-submit");
  });
});
