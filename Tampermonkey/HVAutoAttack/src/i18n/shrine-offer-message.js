export function classifyShrineOfferMessage(message) {
  const msg = String(message ?? "");
  if (!msg || /Snowflake has blessed you|Hit Space Bar to offer/.test(msg) || msg === "Received:") {
    return { kind: "ignore" };
  }
  if (msg.includes("Peerless Voucher")) return { kind: "voucher", message: msg };
  const equip = /^(Crude|Fair|Average|Superior|Exquisite|Magnificent|Legendary|Peerless) .+/.exec(msg);
  if (equip) return { kind: "equip", reward: msg, quality: equip[1] };
  const received = /^Received (.*?)!?$/.exec(msg);
  if (received) return { kind: "reward", reward: received[1] };
  if (/was increased by 1|has increased by one/.test(msg)) return { kind: "reward", reward: msg };
  if (msg.includes("Sold it for")) return { kind: "sold" };
  if (msg.includes("Salvaged it for")) return { kind: "salvaged" };
  if (msg.includes("Sold the remains for")) return { kind: "ignore" };
  return { kind: "stop", message: msg };
}
