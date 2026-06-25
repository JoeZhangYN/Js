// pickBestElement 回归锁：按九抗选最弱元素 + 缺 resists 降级 + pool 限定 + 物理抗不参与。
import { describe, it, expect } from "vitest";
import { pickBestElement } from "./pick-element.js";

const resists = (over = {}) => ({
  fire: 0,
  cold: 0,
  elec: 0,
  wind: 0,
  holy: 0,
  dark: 0,
  crushing: 0,
  slashing: 0,
  piercing: 0,
  ...over,
});

describe("pickBestElement", () => {
  it("选最弱(resists 最负)元素 → 对应 attackStatus 编码(holy=5)", () => {
    const t = { resists: resists({ holy: -50, fire: 30 }) };
    expect(pickBestElement(t, {}).element).toBe(5);
  });

  it("全正抗 → 选抗性最小者(cold=2)", () => {
    const t = { resists: resists({ fire: 10, cold: 5, elec: 50, wind: 40, holy: 30, dark: 20 }) };
    expect(pickBestElement(t, {}).element).toBe(2);
  });

  it("缺 resists(未 scan) → null（调用方回退 attackStatus）", () => {
    expect(pickBestElement({ id: 1 }, {}).element).toBeNull();
    expect(pickBestElement(null, {}).element).toBeNull();
  });

  it("autoElementPool 限定候选：弱点 holy 不在池 → 选池内最弱 cold", () => {
    const t = { resists: resists({ holy: -50, cold: -20 }) };
    expect(pickBestElement(t, { autoElementPool: ["fire", "cold", "elec"] }).element).toBe(2);
  });

  it("物理抗(crushing 等)不参与元素选择", () => {
    const t = { resists: resists({ crushing: -99 }) }; // 物理弱但元素全 0
    expect(pickBestElement(t, {}).element).toBe(1); // 选第一个最小元素 fire
  });
});
