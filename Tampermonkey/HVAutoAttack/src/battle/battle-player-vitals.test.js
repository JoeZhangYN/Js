import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattlePlayerVitalsEvent, runBattlePlayerVitals } from "./battle-player-vitals.js";

const mocks = vi.hoisted(() => ({
  g: vi.fn(),
  gE: vi.fn(),
}));

vi.mock("../dom/query.js", () => ({ gE: mocks.gE }));
vi.mock("../state/store.js", () => ({ g: mocks.g }));

beforeEach(() => {
  mocks.g.mockReset();
  mocks.gE.mockReset();
});

describe("runBattlePlayerVitals", () => {
  it("reads legacy battle bars and derives absolute values", () => {
    mocks.gE.mockImplementation((selector, mode) => {
      if (selector === "#vbh") return {};
      if (selector === "#vbh>div>img") return { offsetWidth: 250 };
      if (selector === "#vbm>div>img") return { offsetWidth: 105 };
      if (selector === "#vbs>div>img") return { offsetWidth: 42 };
      if (selector === "#vcp>div>div" && mode !== "all") return {};
      if (selector === "#vcp>div>div" && mode === "all") return [{}, {}, {}, {}];
      if (selector === "#vcp>div>div#vcr" && mode === "all") return [{}];
      if (selector === "#dvrhd") return { textContent: "1000" };
      if (selector === "#dvrm") return { textContent: "500" };
      if (selector === "#dvrs") return { textContent: "400" };
      return null;
    });

    expect(runBattlePlayerVitals({ type: BattlePlayerVitalsEvent.READ_CURRENT })).toMatchObject({
      hp: 50,
      mp: 50,
      sp: 20,
      oc: 75,
      hpAbs: 500,
      mpAbs: 250,
      spAbs: 80,
      hpDeficit: 500,
      mpDeficit: 250,
      spDeficit: 320,
    });
  });

  it("reads modern battle bars and missing max values defensively", () => {
    mocks.gE.mockImplementation((selector) => {
      if (selector === "#vbh") return null;
      if (selector === "#dvbh>div>img") return { offsetWidth: 207 };
      if (selector === "#dvbm>div>img") return { offsetWidth: 414 };
      if (selector === "#dvbs>div>img") return { offsetWidth: 0 };
      if (selector === "#dvrc") return { textContent: "125" };
      if (selector === "#dvrhd") return { textContent: "2000" };
      return null;
    });

    expect(runBattlePlayerVitals()).toMatchObject({
      hp: 50,
      mp: 100,
      sp: 0,
      oc: 125,
      hpMax: 2000,
      mpMax: 0,
      spMax: 0,
      hpAbs: 1000,
      mpAbs: 0,
      spAbs: 0,
    });
  });

  it("mirrors current vitals to legacy runtime state through the entry", () => {
    expect(
      runBattlePlayerVitals({
        type: BattlePlayerVitalsEvent.MIRROR_RUNTIME,
        vitals: { hp: 90, mp: 80, sp: 70, oc: 60 },
      })
    ).toBe(true);

    expect(mocks.g).toHaveBeenCalledWith("hp", 90);
    expect(mocks.g).toHaveBeenCalledWith("mp", 80);
    expect(mocks.g).toHaveBeenCalledWith("sp", 70);
    expect(mocks.g).toHaveBeenCalledWith("oc", 60);
  });

  it("rejects unknown events without touching DOM or runtime state", () => {
    expect(runBattlePlayerVitals({ type: "unknown" })).toEqual({});

    expect(mocks.gE).not.toHaveBeenCalled();
    expect(mocks.g).not.toHaveBeenCalled();
  });
});
