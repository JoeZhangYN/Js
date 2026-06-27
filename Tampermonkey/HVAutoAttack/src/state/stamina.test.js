import { describe, it, expect, beforeEach } from "vitest";
import { StaminaEvent, runStaminaAutomation } from "./stamina.js";
import { g } from "./store.js";

beforeEach(() => {
  document.body.innerHTML = "";
  g("option", {});
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
    g("option", { restoreStamina: true, staminaLow: 30 });
    expect(runStaminaAutomation({ type: StaminaEvent.SHOULD_RESTORE_FOR_BATTLE })).toBe(true);
  });

  it("decides lobby stop only when restore is disabled and stamina is low", () => {
    document.body.innerHTML =
      '<div id="stamina_readout"><div class="fc4 far"><div>25</div></div></div>';
    g("option", { restoreStamina: false, staminaLow: 30 });
    expect(runStaminaAutomation({ type: StaminaEvent.SHOULD_STOP_LOBBY })).toBe(true);
    g("option", { restoreStamina: true, staminaLow: 30 });
    expect(runStaminaAutomation({ type: StaminaEvent.SHOULD_STOP_LOBBY })).toBe(false);
  });

  it("keeps idle arena restore below both configured low and hard 85 caps", () => {
    document.body.innerHTML =
      '<div id="stamina_readout"><div class="fc4 far"><div>84</div></div></div>';
    g("option", { restoreStamina: true, staminaLow: 90 });
    expect(runStaminaAutomation({ type: StaminaEvent.SHOULD_RESTORE_FOR_IDLE_ARENA })).toBe(true);
    document.body.innerHTML =
      '<div id="stamina_readout"><div class="fc4 far"><div>85</div></div></div>';
    expect(runStaminaAutomation({ type: StaminaEvent.SHOULD_RESTORE_FOR_IDLE_ARENA })).toBe(false);
  });
});
