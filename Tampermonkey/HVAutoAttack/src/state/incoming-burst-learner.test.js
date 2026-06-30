// F5 回归锁：进场爆发学习器（运行 max + 类型，按 MID，名归一桥）。
import { describe, it, expect, beforeEach } from "vitest";
import { setValue } from "./storage.js";
import { STORAGE_KEYS } from "./persist-keys.js";
import {
  IncomingBurstLearningEvent,
  runIncomingBurstLearningAutomation,
} from "./incoming-burst-learner.js";

const ev = (source, dmg, type) => ({ kind: "player-incoming", source, dmg, type });
const identities = [
  { monsterId: 100, name: "Orc" },
  { monsterId: 200, name: "Goblin" },
];

beforeEach(() => localStorage.clear());

const record = (events, monsterIdentities = identities) =>
  runIncomingBurstLearningAutomation({
    type: IncomingBurstLearningEvent.RECORD_EVENTS,
    events,
    monsterIdentities,
  });
const readMap = () =>
  runIncomingBurstLearningAutomation({ type: IncomingBurstLearningEvent.READ_MAP });

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

  it("名归一：'the Orc' 命中 monster identity 的 'Orc'", () => {
    record([ev("the Orc", 400, "elec")]);
    expect(readMap()[100]).toEqual({ maxHit: 400, type: "elec" });
  });

  it("dmg<=0 忽略", () => {
    record([ev("Orc", 0, "fire"), ev("Orc", -5, "cold")]);
    expect(readMap()[100]).toBeUndefined();
  });

  it("无法定位 MID（名不在 identity map）→ 跳", () => {
    record([ev("Dragon", 999, "fire")]);
    expect(Object.keys(readMap())).toHaveLength(0);
  });

  it("非 player-incoming（玩家打怪）不学", () => {
    record([{ kind: "monster-taking", source: "you", target: "Orc", dmg: 999, type: "fire" }]);
    expect(Object.keys(readMap())).toHaveLength(0);
  });

  it("normalizes learned burst storage before reading and updating", () => {
    setValue(STORAGE_KEYS.LEARNED_INCOMING_BURST, {
      100.9: { maxHit: "500.5", type: "" },
      200: { maxHit: "bad", type: "cold" },
      bad: { maxHit: 999, type: "fire" },
    });

    expect(readMap()).toEqual({ 100: { maxHit: 500.5, type: "unknown" } });
    record([ev("Orc", "800.5", "")], [{ monsterId: "100.9", name: "Orc" }]);
    expect(readMap()).toEqual({ 100: { maxHit: 800.5, type: "unknown" } });
  });

  it("ignores unknown incoming burst learning events", () => {
    record([ev("Orc", 500, "cold")]);
    expect(runIncomingBurstLearningAutomation({ type: "unknown" })).toBeUndefined();
    expect(readMap()).toEqual({ 100: { maxHit: 500, type: "cold" } });
  });
});
