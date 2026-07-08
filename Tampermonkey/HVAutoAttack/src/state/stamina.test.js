import { describe, it, expect, beforeEach, vi } from "vitest";
import { STAMINA_RECOVERY_FAILURE_KEY, StaminaEvent, runStaminaAutomation } from "./stamina.js";

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  runNavigationAutomation: vi.fn(),
  runOptionAutomation: vi.fn(),
}));

vi.mock("../dom/http.js", () => ({ post: mocks.post }));
vi.mock("../core/navigate.js", () => ({
  NavigationEvent: Object.freeze({ RELOAD_NOW: "reloadNow" }),
  NavigationReloadReason: Object.freeze({ STAMINA_RECOVERY: "staminaRecovery" }),
  runNavigationAutomation: mocks.runNavigationAutomation,
}));
vi.mock("./option.js", () => ({
  OptionEvent: Object.freeze({ READ_FIELD: "readField" }),
  runOptionAutomation: mocks.runOptionAutomation,
}));

function mockOptions(option = {}) {
  mocks.runOptionAutomation.mockImplementation((event) =>
    Object.prototype.hasOwnProperty.call(option, event.key) ? option[event.key] : event.fallback
  );
}

beforeEach(() => {
  document.body.innerHTML = "";
  sessionStorage.clear();
  window.history.replaceState(null, "", "/battle");
  mocks.post.mockReset();
  mocks.runNavigationAutomation.mockReset();
  mocks.runOptionAutomation.mockReset();
  vi.restoreAllMocks();
  mockOptions();
});

const readValue = () => runStaminaAutomation({ type: StaminaEvent.READ_VALUE });

describe("stamina entry", () => {
  it("读取 #stamina_readout .fc4.far>div 数值", () => {
    document.body.innerHTML =
      '<div id="stamina_readout"><div class="fc4 far"><div>47</div></div></div>';
    expect(readValue()).toBe(47);
  });

  it("含前缀文本仍取首个数字", () => {
    document.body.innerHTML =
      '<div id="stamina_readout"><div class="fc4 far"><div>Stamina: 80</div></div></div>';
    expect(readValue()).toBe(80);
  });

  it("元素缺失 → 0（不崩，优于旧裸 [0]）", () => {
    expect(readValue()).toBe(0);
  });

  it("无数字 → 0", () => {
    document.body.innerHTML =
      '<div id="stamina_readout"><div class="fc4 far"><div>--</div></div></div>';
    expect(readValue()).toBe(0);
  });

  it("decides battle restore from restore switch and low threshold", () => {
    document.body.innerHTML =
      '<div id="stamina_readout"><div class="fc4 far"><div>25</div></div></div>';
    mockOptions({ restoreStamina: true, staminaLow: 30 });
    expect(runStaminaAutomation({ type: StaminaEvent.SHOULD_RESTORE_FOR_BATTLE })).toBe(true);
    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({
      type: "readField",
      key: "restoreStamina",
      fallback: false,
    });
    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({
      type: "readField",
      key: "staminaLow",
      fallback: 0,
    });
  });

  it("decides lobby stop only when restore is disabled and stamina is low", () => {
    document.body.innerHTML =
      '<div id="stamina_readout"><div class="fc4 far"><div>25</div></div></div>';
    mockOptions({ restoreStamina: false, staminaLow: 30 });
    expect(runStaminaAutomation({ type: StaminaEvent.SHOULD_STOP_LOBBY })).toBe(true);
    mockOptions({ restoreStamina: true, staminaLow: 30 });
    expect(runStaminaAutomation({ type: StaminaEvent.SHOULD_STOP_LOBBY })).toBe(false);
  });

  it("keeps idle arena restore below both configured low and hard 85 caps", () => {
    document.body.innerHTML =
      '<div id="stamina_readout"><div class="fc4 far"><div>84</div></div></div>';
    mockOptions({ restoreStamina: true, staminaLow: 90 });
    expect(runStaminaAutomation({ type: StaminaEvent.SHOULD_RESTORE_FOR_IDLE_ARENA })).toBe(true);
    document.body.innerHTML =
      '<div id="stamina_readout"><div class="fc4 far"><div>85</div></div></div>';
    expect(runStaminaAutomation({ type: StaminaEvent.SHOULD_RESTORE_FOR_IDLE_ARENA })).toBe(false);
  });

  it("claims stamina recovery through one command entry", () => {
    expect(runStaminaAutomation({ type: StaminaEvent.CLAIM_RECOVERY })).toBe(true);

    expect(mocks.post).toHaveBeenCalledWith(
      "http://localhost:3000/battle",
      expect.any(Function),
      "recover=stamina",
      undefined,
      expect.any(Function)
    );

    const reload = mocks.post.mock.calls[0][1];
    reload();
    expect(mocks.runNavigationAutomation).toHaveBeenCalledWith({
      type: "reloadNow",
      reason: "staminaRecovery",
    });
  });

  it("records stamina recovery POST failures without claiming reload success", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(runStaminaAutomation({ type: StaminaEvent.CLAIM_RECOVERY })).toBe(true);

    const failure = mocks.post.mock.calls[0][4];
    failure({ kind: "networkError", href: "/battle", attempts: 4 });

    expect(mocks.runNavigationAutomation).not.toHaveBeenCalled();
    expect(STAMINA_RECOVERY_FAILURE_KEY).toBe("HVAA:lastStaminaRecoveryFailure");
    expect(JSON.parse(sessionStorage.getItem(STAMINA_RECOVERY_FAILURE_KEY))).toMatchObject({
      capability: "staminaRecovery",
      stage: "claimRecoveryPost",
      failure: { kind: "networkError", href: "/battle", attempts: 4 },
    });
    expect(warn).toHaveBeenCalledWith(
      "[HVAA] stamina recovery request failed",
      expect.objectContaining({
        capability: "staminaRecovery",
        stage: "claimRecoveryPost",
      })
    );
  });

  it("keeps stamina recovery failure handling when diagnostics are blocked", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {
      throw new Error("console blocked");
    });
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(key, value) {
      if (key === STAMINA_RECOVERY_FAILURE_KEY) throw new Error("session blocked");
      return Reflect.apply(originalSetItem, this, [key, value]);
    });

    expect(runStaminaAutomation({ type: StaminaEvent.CLAIM_RECOVERY })).toBe(true);
    const failure = mocks.post.mock.calls[0][4];

    expect(() => failure({ kind: "networkError", href: "/battle" })).not.toThrow();
    expect(mocks.runNavigationAutomation).not.toHaveBeenCalled();
  });

  it("rejects unknown and null stamina events without reading or writing state", () => {
    const querySelector = vi.spyOn(document, "querySelector");

    expect(runStaminaAutomation({ type: "unknown" })).toBeUndefined();
    expect(runStaminaAutomation(null)).toBeUndefined();
    expect(querySelector).not.toHaveBeenCalled();
    expect(mocks.runOptionAutomation).not.toHaveBeenCalled();
    expect(mocks.post).not.toHaveBeenCalled();
  });
});
