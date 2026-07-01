import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  recordNavigationDecision: vi.fn(),
  writeNavigationAudit: vi.fn(),
  reportPreviousNavigationAudit: vi.fn(),
  installExternalUnloadAudit: vi.fn(),
}));

vi.mock("./navigation-decision-evidence.js", () => ({
  recordNavigationDecision: mocks.recordNavigationDecision,
}));

vi.mock("./navigation-audit.js", () => ({
  writeNavigationAudit: mocks.writeNavigationAudit,
  reportPreviousNavigationAudit: mocks.reportPreviousNavigationAudit,
  installExternalUnloadAudit: mocks.installExternalUnloadAudit,
}));

describe("runNavigationAutomation recording failure tolerance", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    mocks.recordNavigationDecision.mockReset();
    mocks.writeNavigationAudit.mockReset();
    mocks.reportPreviousNavigationAudit.mockReset();
    mocks.installExternalUnloadAudit.mockReset();
  });

  it("keeps URL navigation opened when navigation recording throws", async () => {
    const { NavigationEvent, NavigationRedirectReason, runNavigationAutomation } =
      await import("./navigate.js");
    const opened = { close: vi.fn() };
    const open = vi.spyOn(window, "open").mockImplementation(() => opened);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    mocks.recordNavigationDecision.mockImplementation(() => {
      throw new Error("decision failed");
    });
    mocks.writeNavigationAudit.mockImplementation(() => {
      throw new Error("audit failed");
    });

    const result = runNavigationAutomation({
      type: NavigationEvent.OPEN_URL,
      reason: NavigationRedirectReason.ENCOUNTER_ENTRY,
      url: "https://hentaiverse.org/encounter.php",
      newTab: true,
    });

    expect(result).toBe(true);
    expect(open).toHaveBeenCalledWith("https://hentaiverse.org/encounter.php", "_blank");
  });

  it("keeps URL navigation opened when navigation recording and warning both throw", async () => {
    const { NavigationEvent, NavigationRedirectReason, runNavigationAutomation } =
      await import("./navigate.js");
    const opened = { close: vi.fn() };
    const open = vi.spyOn(window, "open").mockImplementation(() => opened);
    vi.spyOn(console, "warn").mockImplementation(() => {
      throw new Error("console failed");
    });
    mocks.recordNavigationDecision.mockImplementation(() => {
      throw new Error("decision failed");
    });
    mocks.writeNavigationAudit.mockImplementation(() => {
      throw new Error("audit failed");
    });

    expect(() =>
      runNavigationAutomation({
        type: NavigationEvent.OPEN_URL,
        reason: NavigationRedirectReason.ENCOUNTER_ENTRY,
        url: "https://hentaiverse.org/encounter.php",
        newTab: true,
      })
    ).not.toThrow();

    expect(open).toHaveBeenCalledWith("https://hentaiverse.org/encounter.php", "_blank");
  });

  it("keeps accepted scheduled reload timer when decision recording throws", async () => {
    vi.useFakeTimers();
    const { NavigationEvent, NavigationReloadReason, runNavigationAutomation } =
      await import("./navigate.js");
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    mocks.recordNavigationDecision.mockImplementation(() => {
      throw new Error("decision failed");
    });

    const timer = runNavigationAutomation({
      type: NavigationEvent.SCHEDULE_RELOAD,
      reason: NavigationReloadReason.ACTION_WATCHDOG,
      milliseconds: 250,
    });

    expect(timer).toBeTruthy();
    expect(vi.getTimerCount()).toBe(1);
    clearTimeout(timer);
  });

  it("keeps rejected navigation events rejected when rejection recording throws", async () => {
    const { NavigationEvent, runNavigationAutomation } = await import("./navigate.js");
    const open = vi.spyOn(window, "open").mockImplementation(() => ({ close: vi.fn() }));
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    mocks.recordNavigationDecision.mockImplementation(() => {
      throw new Error("decision failed");
    });

    expect(
      runNavigationAutomation({
        type: NavigationEvent.OPEN_URL,
        url: "https://hentaiverse.org/encounter.php",
      })
    ).toBe(false);
    expect(open).not.toHaveBeenCalled();
  });
});
