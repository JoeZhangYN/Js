import { describe, expect, it } from "vitest";
import { reserveShrineOffer, rollbackShrineOfferReservation } from "./shrine-offer-reservation.js";

function makeReservationState(type = "Trophy") {
  return {
    state: { equip: { requests: 4 } },
    item: {
      type,
      requests: 10,
      stock: 12,
      bulk: 2,
      max: 6,
      node: { stock: { textContent: "" }, max: { textContent: "" } },
    },
  };
}

describe("Shrine offer reservation", () => {
  it("reserves one actual offer for trophy state", () => {
    const { state, item } = makeReservationState();

    expect(reserveShrineOffer(state, item)).toBe(true);

    expect(item).toMatchObject({ requests: 11, stock: 10, max: 5 });
    expect(item.node.stock.textContent).toBe(10);
    expect(item.node.max.textContent).toBe(5);
    expect(state.equip.requests).toBe(5);
  });

  it("rolls back one failed trophy reservation", () => {
    const { state, item } = makeReservationState();

    rollbackShrineOfferReservation(state, item);

    expect(item).toMatchObject({ requests: 9, stock: 14, max: 7 });
    expect(item.node.stock.textContent).toBe(14);
    expect(item.node.max.textContent).toBe(7);
    expect(state.equip.requests).toBe(3);
  });

  it("does not touch equipment requests for non-trophy offers", () => {
    const { state, item } = makeReservationState("Artifact");

    reserveShrineOffer(state, item);
    rollbackShrineOfferReservation(state, item);

    expect(state.equip.requests).toBe(4);
    expect(item).toMatchObject({ requests: 10, stock: 12, max: 6 });
  });
});
