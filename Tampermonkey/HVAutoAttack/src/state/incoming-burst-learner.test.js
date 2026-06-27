// F5 回归锁：进场爆发学习器（运行 max + 类型，按 MID，名归一桥）。
import { describe, it, expect, beforeEach } from "vitest";
import { IncomingBurstLearningEvent, runIncomingBurstLearningAutomation } from "./incoming-burst-learner.js";

const ev = (source, dmg, type) => ({ kind: "player-incoming", source, dmg, type });
const status = [{ monsterId: 100, name: "Orc" }, { monsterId: 200, name: "Goblin" }];

beforeEach(() => localStorage.clear());

const record = (events, monsterStatus = status) =>
  runIncomingBurstLearningAutomation({
    type: IncomingBurstLearningEvent.RECORD_EVENTS,
    events,
    monsterStatus,
  });
const readMap = () => runIncomingBurstLearningAutomation({ type: IncomingBurstLearningEvent.READ_MAP });

describe("incoming-burst-learner", () => {
  it("学单发最大伤害 + 类型（按 MID）", () => {
    record([ev("Orc", 300, "fire"), ev("Orc", 500, "cold")]);
    expect(readMap()[100]).toEqual({ maxHit: 500, type: "cold" });
  });

  it("运行 max：更小不覆盖，更大才更新（类型跟最大）", () => {
    record([ev("Orc", 500, "cold")]);
    record([ev("Orc", 200, "fire")]);
    expect(readMap()[100]).toEqual({ maxHit: 500, type: "cold" });
    record([ev("Orc", 800, "dark")]);
    expect(readMap()[100]).toEqual({ maxHit: 800, type: "dark" });
  });

  it("名归一：'the Orc' 命中 monsterStatus 的 'Orc'", () => {
    record([ev("the Orc", 400, "elec")]);
    expect(readMap()[100]).toEqual({ maxHit: 400, type: "elec" });
  });

  it("dmg<=0 忽略", () => {
    record([ev("Orc", 0, "fire"), ev("Orc", -5, "cold")]);
    expect(readMap()[100]).toBeUndefined();
  });

  it("无法定位 MID（名不在 status）→ 跳", () => {
    record([ev("Dragon", 999, "fire")]);
    expect(Object.keys(readMap())).toHaveLength(0);
  });

  it("非 player-incoming（玩家打怪）不学", () => {
    record([{ kind: "monster-taking", source: "you", target: "Orc", dmg: 999, type: "fire" }]);
    expect(Object.keys(readMap())).toHaveLength(0);
  });
});
