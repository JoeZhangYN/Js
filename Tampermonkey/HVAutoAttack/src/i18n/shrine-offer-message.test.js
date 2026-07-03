import { describe, expect, it } from "vitest";
import { classifyShrineOfferMessage } from "./shrine-offer-message.js";

describe("classifyShrineOfferMessage", () => {
  it("ignores Shrine boilerplate and sold remains messages", () => {
    expect(classifyShrineOfferMessage("Snowflake has blessed you with an item!")).toEqual({ kind: "ignore" });
    expect(classifyShrineOfferMessage("Hit Space Bar to offer another item like this.")).toEqual({ kind: "ignore" });
    expect(classifyShrineOfferMessage("Sold the remains for 8 credits")).toEqual({ kind: "ignore" });
  });

  it("classifies reward-producing messages", () => {
    expect(classifyShrineOfferMessage("Exquisite Axe of Slaughter")).toEqual({
      kind: "equip",
      reward: "Exquisite Axe of Slaughter",
      quality: "Exquisite",
    });
    expect(classifyShrineOfferMessage("Received 3x Last Elixir!")).toEqual({
      kind: "reward",
      reward: "3x Last Elixir",
    });
    expect(classifyShrineOfferMessage("Agility was increased by 1")).toEqual({
      kind: "reward",
      reward: "Agility was increased by 1",
    });
  });

  it("classifies accounting and stop messages", () => {
    expect(classifyShrineOfferMessage("Received 1x Peerless Voucher!")).toMatchObject({ kind: "voucher" });
    expect(classifyShrineOfferMessage("Sold it for 100 credits")).toEqual({ kind: "sold" });
    expect(classifyShrineOfferMessage("Salvaged it for 3x Low-Grade Metals")).toEqual({ kind: "salvaged" });
    expect(classifyShrineOfferMessage("Your equipment inventory is full")).toEqual({
      kind: "stop",
      reason: "equipmentInventoryFull",
      message: "Your equipment inventory is full",
    });
    expect(classifyShrineOfferMessage("Snowflake looks confused")).toEqual({
      kind: "stop",
      reason: "unknownShrineResponse",
      message: "Snowflake looks confused",
    });
  });
});
