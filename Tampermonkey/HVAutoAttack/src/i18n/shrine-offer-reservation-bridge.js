import { reserveShrineOffer, rollbackShrineOfferReservation } from "./shrine-offer-reservation.js";

window.HVAA_shrineOfferReservation = Object.freeze({
  reserve: reserveShrineOffer,
  rollback: rollbackShrineOfferReservation,
});
