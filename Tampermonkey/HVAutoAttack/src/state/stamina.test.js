import { describe, it, expect, beforeEach } from "vitest";
import { readStaminaValue } from "./stamina.js";

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("readStaminaValue", () => {
  it("读取 #stamina_readout .fc4.far>div 数值", () => {
    document.body.innerHTML =
      '<div id="stamina_readout"><div class="fc4 far"><div>47</div></div></div>';
    expect(readStaminaValue()).toBe(47);
  });

  it("含前缀文本仍取首个数字", () => {
    document.body.innerHTML =
      '<div id="stamina_readout"><div class="fc4 far"><div>Stamina: 80</div></div></div>';
    expect(readStaminaValue()).toBe(80);
  });

  it("元素缺失 → 0（不崩，优于旧裸 [0]）", () => {
    expect(readStaminaValue()).toBe(0);
  });

  it("无数字 → 0", () => {
    document.body.innerHTML =
      '<div id="stamina_readout"><div class="fc4 far"><div>--</div></div></div>';
    expect(readStaminaValue()).toBe(0);
  });
});
