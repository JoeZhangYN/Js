import { afterEach, describe, expect, it, vi } from "vitest";
import { post } from "./http.js";

const OriginalXHR = window.XMLHttpRequest;

afterEach(() => {
  window.XMLHttpRequest = OriginalXHR;
  vi.useRealTimers();
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
      kind: "httpStatus",
      href: "/battle",
      status: 500,
      response: "server error",
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
      kind: "networkError",
      href: "/battle",
      retries: 4,
    });
    expect(window.XMLHttpRequest).toHaveBeenCalledTimes(4);
  });
});
