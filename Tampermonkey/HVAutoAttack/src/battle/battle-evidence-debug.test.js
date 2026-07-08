import { describe, expect, it, vi } from "vitest";
import { safeDebug } from "./battle-evidence-debug.js";

describe("battle evidence debug", () => {
  it("routes default evidence debug output through the typed diagnostic console entry", () => {
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});
    const evidence = { phase: "pageReady", storageWriteOk: true };

    expect(safeDebug({}, "[HVAA] battle automation", evidence)).toBe(true);

    expect(debug).toHaveBeenCalledWith("[HVAA] battle automation", evidence);
    debug.mockRestore();
  });
});
