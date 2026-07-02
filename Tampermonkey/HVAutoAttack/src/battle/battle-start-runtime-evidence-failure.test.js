import { afterEach, describe, expect, it, vi } from "vitest";
import { runBattleStartRuntimeAutomation } from "./battle-start-runtime.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("runBattleStartRuntimeAutomation evidence failure", () => {
  it("rejects unknown events with debug evidence when lifecycle storage is unavailable", () => {
    const deps = {
      readOptionField: vi.fn(),
      read: vi.fn(),
      write: vi.fn(),
      startSpeed: vi.fn(),
    };
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});
    vi.spyOn(window.sessionStorage, "setItem").mockImplementation((key, value) => {
      void key;
      void value;
      throw new Error("quota");
    });

    let result;
    expect(() => {
      result = runBattleStartRuntimeAutomation({ type: "unknown" }, deps);
    }).not.toThrow();
    expect(result).toBe(false);

    expect(deps.readOptionField).not.toHaveBeenCalled();
    expect(deps.read).not.toHaveBeenCalled();
    expect(deps.write).not.toHaveBeenCalled();
    expect(deps.startSpeed).not.toHaveBeenCalled();
    expect(debug).toHaveBeenCalledWith(
      "[HVAA] battle lifecycle",
      expect.objectContaining({
        phase: "unknownStartRuntimeEvent",
        result: false,
        storageWriteOk: false,
        storageWriteError: "quota",
      })
    );
  });
});
