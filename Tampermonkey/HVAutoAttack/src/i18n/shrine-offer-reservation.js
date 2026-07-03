export function reserveShrineOffer(state, item) {
  item.requests++;
  item.stock -= item.bulk;
  item.max--;
  item.node.stock.textContent = item.stock;
  item.node.max.textContent = item.max;
  if (item.type === "Trophy") {
    state.equip.requests++;
  }
  return true;
}

export function rollbackShrineOfferReservation(state, item) {
  item.requests--;
  item.stock += item.bulk;
  item.max++;
  item.node.stock.textContent = item.stock;
  item.node.max.textContent = item.max;
  if (item.type === "Trophy") {
    state.equip.requests--;
  }
  return true;
}
