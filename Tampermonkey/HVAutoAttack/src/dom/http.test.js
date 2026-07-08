import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  runDiagnosticConsoleAutomation: vi.fn(),
}));

vi.mock("../core/diagnostic-console.js", () => ({
  DiagnosticConsoleEvent: Object.freeze({ WARN: "warn" }),
  runDiagnosticConsoleAutomation: mocks.runDiagnosticConsoleAutomation,
}));

import { HTTP_REQUEST_FAILURE_KEY, post } from "./http.js";

const OriginalXHR = window.XMLHttpRequest;

afterEach(() => {
  window.XMLHttpRequest = OriginalXHR;
  window.sessionStorage.clear();
  vi.useRealTimers();
  mocks.runDiagnosticConsoleAutomation.mockReset();
  vi.restoreAllMocks();
});

function installXhr(makeResponse) {
  window.XMLHttpRequest = vi.fn(function XMLHttpRequest() {
    this.open = vi.fn();
    this.setRequestHeader = vi.fn();
    this.send = vi.fn(() => {
      const response = makeResponse();
      Object.assign(this, response);
      this.onload?.({ target: this });
    });
  });
}

function installErrorXhr() {
  window.XMLHttpRequest = vi.fn(function XMLHttpRequest() {
    this.open = vi.fn();
    this.setRequestHeader = vi.fn();
    this.send = vi.fn(() => {
      this.onerror?.({});
    });
  });
}

describe("post", () => {
  it("reports non-success HTTP status instead of silently dropping the request", () => {
    const success = vi.fn();
    const failure = vi.fn();
    installXhr(() => ({ status: 500, response: "server error" }));

    post("/battle", success, null, "text", failure);

    expect(success).not.toHaveBeenCalled();
    expect(failure).toHaveBeenCalledWith({
      capability: "httpRequest",
      stage: "finalFailure",
      kind: "httpStatus",
      href: "/battle",
      method: "GET",
      responseType: "text",
      status: 500,
      response: "server error",
    });
    expect(JSON.parse(sessionStorage.getItem(HTTP_REQUEST_FAILURE_KEY))).toMatchObject({
      capability: "httpRequest",
      stage: "finalFailure",
      kind: "httpStatus",
      href: "/battle",
    });
    expect(mocks.runDiagnosticConsoleAutomation).toHaveBeenCalledWith({
      type: "warn",
      args: [
        "[HVAA] HTTP request failed",
        expect.objectContaining({ stage: "finalFailure", kind: "httpStatus" }),
      ],
    });
  });

  it("reports final network failure after retry attempts are exhausted", async () => {
    vi.useFakeTimers();
    const success = vi.fn();
    const failure = vi.fn();
    installErrorXhr();

    post("/battle", success, null, "text", failure);
    await vi.runAllTimersAsync();

    expect(success).not.toHaveBeenCalled();
    expect(failure).toHaveBeenCalledWith({
      capability: "httpRequest",
      stage: "finalFailure",
      kind: "networkError",
      href: "/battle",
      method: "GET",
      responseType: "text",
      attempts: 4,
      maxAttempts: 4,
    });
    expect(window.XMLHttpRequest).toHaveBeenCalledTimes(4);
    expect(JSON.parse(sessionStorage.getItem(HTTP_REQUEST_FAILURE_KEY))).toMatchObject({
      capability: "httpRequest",
      stage: "finalFailure",
      kind: "networkError",
      href: "/battle",
      attempts: 4,
      maxAttempts: 4,
    });
  });

  it("records retry evidence before the final network failure", async () => {
    vi.useFakeTimers();
    installErrorXhr();

    post("/battle", vi.fn(), null, "text", vi.fn());
    await vi.advanceTimersByTimeAsync(1000);

    expect(JSON.parse(sessionStorage.getItem(HTTP_REQUEST_FAILURE_KEY))).toMatchObject({
      capability: "httpRequest",
      stage: "retryScheduled",
      kind: "networkError",
      href: "/battle",
      retryDelayMs: 2000,
      attempts: 2,
    });
  });

  it("records final failures even when no caller failure handler exists", () => {
    installXhr(() => ({ status: 403, response: "forbidden" }));

    post("/battle", vi.fn(), "a=1", "text");

    expect(JSON.parse(sessionStorage.getItem(HTTP_REQUEST_FAILURE_KEY))).toMatchObject({
      capability: "httpRequest",
      stage: "finalFailure",
      kind: "httpStatus",
      method: "POST",
      responseType: "text",
      status: 403,
    });
  });

  it("keeps failure callbacks working when diagnostics are blocked", async () => {
    vi.useFakeTimers();
    mocks.runDiagnosticConsoleAutomation.mockImplementation(() => false);
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(key, value) {
      if (key === HTTP_REQUEST_FAILURE_KEY) throw new Error("storage blocked");
      return Reflect.apply(originalSetItem, this, [key, value]);
    });
    const failure = vi.fn();
    installErrorXhr();

    post("/battle", vi.fn(), null, "text", failure);
    await vi.runAllTimersAsync();

    expect(failure).toHaveBeenCalledWith(
      expect.objectContaining({
        capability: "httpRequest",
        stage: "finalFailure",
        kind: "networkError",
      })
    );
  });
});
