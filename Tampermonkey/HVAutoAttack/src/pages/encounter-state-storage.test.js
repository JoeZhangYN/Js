import { describe, expect, it, vi } from "vitest";
import { EncounterStateStorageEvent, runEncounterStateStorage } from "./encounter-state-storage.js";

const state = { date: 1, key: "gm=", count: 1, clear: false };

function memoryStorage(raw = null) {
  return {
    getItem: vi.fn(() => raw),
    setItem: vi.fn(),
  };
}

function deps(overrides = {}) {
  return {
    getValue: undefined,
    setValue: undefined,
    localStorage: memoryStorage(),
    warn: vi.fn(),
    ...overrides,
  };
}

describe("encounter state storage authority", () => {
  it("uses GM as the only authority when GM and local state conflict", () => {
    const runtime = deps({
      getValue: vi.fn(() => state),
      setValue: vi.fn(),
      localStorage: memoryStorage(JSON.stringify({ ...state, key: "local=" })),
    });

    expect(
      runEncounterStateStorage({ type: EncounterStateStorageEvent.READ }, runtime)
    ).toMatchObject({
      ok: true,
      authority: "gm",
      scope: "crossOrigin",
      state,
    });
    expect(runtime.localStorage.getItem).not.toHaveBeenCalled();
  });

  it("fails closed instead of mixing local state when GM encounter state read fails", () => {
    const runtime = deps({
      getValue: vi.fn(() => {
        throw new Error("read blocked");
      }),
      setValue: vi.fn(),
      localStorage: memoryStorage(JSON.stringify(state)),
    });

    expect(
      runEncounterStateStorage({ type: EncounterStateStorageEvent.READ }, runtime)
    ).toMatchObject({
      ok: false,
      authority: "gm",
      reason: "gmReadFailed",
    });
    expect(runtime.localStorage.getItem).not.toHaveBeenCalled();
    expect(runtime.warn).toHaveBeenCalledWith(
      "read-gm",
      expect.objectContaining({ error: "read blocked" })
    );
  });

  it("does not report local fallback as persistence when GM encounter state write fails", () => {
    const runtime = deps({
      getValue: vi.fn(),
      setValue: vi.fn(() => {
        throw new Error("write blocked");
      }),
    });

    expect(
      runEncounterStateStorage({ type: EncounterStateStorageEvent.WRITE, state }, runtime)
    ).toMatchObject({
      ok: false,
      authority: "gm",
      scope: "crossOrigin",
      reason: "gmWriteFailed",
    });
    expect(runtime.localStorage.setItem).not.toHaveBeenCalled();
    expect(runtime.warn).toHaveBeenCalledWith(
      "write-gm",
      expect.objectContaining({ error: "write blocked" })
    );
  });

  it("uses origin-local storage only when both GM APIs are absent", () => {
    const runtime = deps({ localStorage: memoryStorage(JSON.stringify(state)) });

    expect(
      runEncounterStateStorage({ type: EncounterStateStorageEvent.READ }, runtime)
    ).toMatchObject({
      ok: true,
      authority: "local",
      scope: "origin",
      degraded: true,
      state,
    });
  });

  it("fails closed when only half of the GM storage authority exists", () => {
    const runtime = deps({ getValue: vi.fn() });

    expect(
      runEncounterStateStorage({ type: EncounterStateStorageEvent.READ }, runtime)
    ).toMatchObject({
      ok: false,
      authority: "unavailable",
      reason: "partialGmStorage",
    });
    expect(runtime.localStorage.getItem).not.toHaveBeenCalled();
  });
});
