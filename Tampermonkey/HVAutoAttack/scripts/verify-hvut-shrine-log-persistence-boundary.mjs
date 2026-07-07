import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const mainTarget = path.normalize("src/main.js");
const classifierTarget = path.normalize("src/i18n/shrine-offer-message.js");
const classifierBridgeTarget = path.normalize("src/i18n/shrine-offer-message-bridge.js");
const classifierTestTarget = path.normalize("src/i18n/shrine-offer-message.test.js");
const reservationTarget = path.normalize("src/i18n/shrine-offer-reservation.js");
const reservationBridgeTarget = path.normalize("src/i18n/shrine-offer-reservation-bridge.js");
const reservationTestTarget = path.normalize("src/i18n/shrine-offer-reservation.test.js");
const diagnosticTarget = path.normalize("src/core/diagnostic-evidence-keys.js");
const diagnosticTest = path.normalize("src/core/diagnostic-evidence.test.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const mainText = fs.readFileSync(path.join(root, mainTarget), "utf8");
const classifierText = fs.readFileSync(path.join(root, classifierTarget), "utf8");
const classifierBridgeText = fs.readFileSync(path.join(root, classifierBridgeTarget), "utf8");
const classifierTestText = fs.readFileSync(path.join(root, classifierTestTarget), "utf8");
const reservationText = fs.readFileSync(path.join(root, reservationTarget), "utf8");
const reservationBridgeText = fs.readFileSync(path.join(root, reservationBridgeTarget), "utf8");
const reservationTestText = fs.readFileSync(path.join(root, reservationTestTarget), "utf8");
const diagnosticText = fs.readFileSync(path.join(root, diagnosticTarget), "utf8");
const diagnosticTestText = fs.readFileSync(path.join(root, diagnosticTest), "utf8");
const violations = [];

function requirePart(label, body, part) {
  if (!body.includes(part)) violations.push(`${target} ${label} must include ${part}`);
}

const offerLoad =
  /load: async function \(iid, reward_type, reward_slot\) \{[\s\S]*?\n    \},\n    toggle: function/.exec(text)?.[0] || "";
const offerRequest =
  /request: async function \(iid, count, reward_type, reward_slot\) \{[\s\S]*?\n    \},\n    load: async function/.exec(text)?.[0] || "";
const logSave =
  /save: function \(\) \{[\s\S]*?\n    \},\n    reset: function/.exec(text)?.[0] || "";
const legacyOffer =
  /_ss\.offer = async function \(iid, count\) \{[\s\S]*?\n  \};\n\n  _ss\.request = async function/.exec(text)?.[0] || "";
const legacyRequest =
  /_ss\.request = async function \(iid, select_reward_type, select_reward_slot\) \{[\s\S]*?\n  \};\n\n  _ss\.toggle_results/.exec(text)?.[0] || "";
const localClassifier =
  /var classify_hvut_shrine_offer_message = function \(msg\) \{[\s\S]*?\n  \};\n  var reloadCurrentPage/.exec(text)?.[0] || "";
const localClassifierBridge =
  /var run_hvut_shrine_offer_message_classifier_bridge = function \(msg\) \{[\s\S]*?\n  \};\n  var classify_hvut_shrine_offer_message/.exec(text)?.[0] || "";
const localReservation =
  /var reserve_hvut_shrine_offer = function \(state, item\) \{[\s\S]*?\n  \};\n  var rollback_hvut_shrine_offer_reservation/.exec(text)?.[0] || "";
const localReservationRollback =
  /var rollback_hvut_shrine_offer_reservation = function \(state, item\) \{[\s\S]*?\n  \};\n  var classify_hvut_shrine_offer_message/.exec(text)?.[0] || "";
const localReservationBridge =
  /var run_hvut_shrine_offer_reservation_bridge = function \(action, state, item\) \{[\s\S]*?\n  \};\n  var reserve_hvut_shrine_offer/.exec(text)?.[0] || "";

if (!offerLoad) violations.push(`${target} must keep Shrine offer load entry visible`);
if (!offerRequest) violations.push(`${target} must keep Shrine offer request entry visible`);
if (!logSave) violations.push(`${target} must keep Shrine log save entry visible`);
if (!legacyOffer) violations.push(`${target} must keep legacy Shrine offer entry visible`);
if (!legacyRequest) violations.push(`${target} must keep legacy Shrine request entry visible`);
if (!localClassifier) violations.push(`${target} must keep local Shrine classifier bridge visible`);
if (!localClassifierBridge) violations.push(`${target} must keep local Shrine classifier command visible`);
if (!localReservation) violations.push(`${target} must keep local Shrine reservation bridge visible`);
if (!localReservationRollback) violations.push(`${target} must keep local Shrine reservation rollback bridge visible`);
if (!localReservationBridge) violations.push(`${target} must keep local Shrine reservation bridge command visible`);

for (const part of [
  "record_hvut_shrine_offer_failure('offerLoadFetch'",
  "if (_ss.error) return false;",
  "const offerResponse = classify_hvut_shrine_offer_response(doc, 'offerEmptyResponse');",
  "if (offerResponse.kind === 'stop') {",
  "set_hvut_shrine_stop_error(_ss, offerResponse.message, offerResponse.evidence);",
  "const offerSummary = summarize_hvut_shrine_offer_messages(offerResponse.messages);",
  "if (offerSummary.kind === 'stop') {",
  "set_hvut_shrine_stop_error(_ss, offerSummary.message, offerSummary.evidence);",
  "const evidence = record_hvut_shrine_offer_failure('offerLoadFetch'",
  "set_hvut_shrine_stop_error(_ss, 'Shrine offer request failed.', evidence);",
  "const evidence = record_hvut_shrine_offer_failure('offerEquipmentCapacityFull'",
  "set_hvut_shrine_stop_error(_ss, '你的装备库存已满', evidence);",
  "return false;",
  "offerSummary.vouchers.forEach((msg) => {",
  "list.push(...offerSummary.qualities, ...offerSummary.rewards);",
  "equips.push(...offerSummary.equips);",
  "_ss.equip.received += offerSummary.equips.length;",
  "_ss.equip.sold += offerSummary.sold;",
  "_ss.equip.salvaged += offerSummary.salvaged;",
  "if (_ss.log.save() === false) return false;",
  "return true;",
]) {
  requirePart("Shrine offer load", offerLoad, part);
}

for (const part of [
  "request: async function (iid, count, reward_type, reward_slot)",
  "if (_ss.error) break;",
  "if (reserve_hvut_shrine_offer(_ss, item) === false) break;",
  "const offered = await _ss.offer.load(iid, reward_type, reward_slot);",
  "if (offered === false) {",
  "rollback_hvut_shrine_offer_reservation(_ss, item);",
  "if (_ss.error) break;",
]) {
  requirePart("Shrine offer request", offerRequest, part);
}

for (const part of [
  "if (!$config.set('ss_log', _ss.log.json)) {",
  "alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');",
  "return false;",
  "return true;",
]) {
  requirePart("Shrine log save", logSave, part);
}

for (const part of [
  "record_hvut_shrine_offer_failure('legacyOfferFetch'",
  "if (_ss.error) return false;",
  "const offerResponse = classify_hvut_shrine_offer_response(doc, 'legacyOfferEmptyResponse');",
  "if (offerResponse.kind === 'stop') {",
  "set_hvut_shrine_stop_error(_ss, offerResponse.message, offerResponse.evidence);",
  "const offerSummary = summarize_hvut_shrine_offer_messages(offerResponse.messages);",
  "if (offerSummary.kind === 'stop') {",
  "set_hvut_shrine_stop_error(_ss, offerSummary.message, offerSummary.evidence);",
  "const evidence = record_hvut_shrine_offer_failure('legacyOfferFetch'",
  "set_hvut_shrine_stop_error(_ss, 'Shrine offer request failed.', evidence);",
  "const evidence = record_hvut_shrine_offer_failure('legacyOfferEquipmentCapacityFull'",
  "set_hvut_shrine_stop_error(_ss, '你的装备库存已满', evidence);",
  "return false;",
  "offerSummary.vouchers.forEach((msg) => {",
  "rewards.push(...offerSummary.equips, ...offerSummary.rewards);",
  "_ss.equip.sold += offerSummary.sold;",
  "_ss.equip.salvaged += offerSummary.salvaged;",
  "if (!$config.set('ss_log', _ss.log)) {",
  "alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');",
  "return false;",
  "return true;",
]) {
  requirePart("legacy Shrine request", legacyRequest, part);
}

for (const part of [
  "_ss.offer = async function (iid, count)",
  "if (_ss.error) break;",
  "if (reserve_hvut_shrine_offer(_ss, item) === false) break;",
  "const offered = await _ss.request(iid, select_reward_type, select_reward_slot);",
  "if (offered === false) {",
  "rollback_hvut_shrine_offer_reservation(_ss, item);",
  "if (_ss.error) break;",
]) {
  requirePart("legacy Shrine offer", legacyOffer, part);
}

for (const required of [
  "var reserve_hvut_shrine_offer = function (state, item) {",
  "var rollback_hvut_shrine_offer_reservation = function (state, item) {",
  "var run_hvut_shrine_offer_reservation_bridge = function (action, state, item) {",
  "var set_hvut_shrine_stop_error = function (state, message, evidence) {",
  "state.errorEvidence = evidence || null;",
  "var run_hvut_shrine_offer_message_classifier_bridge = function (msg) {",
  "var classify_hvut_shrine_offer_message = function (msg) {",
  "var classify_hvut_shrine_offer_response = function (doc, stage) {",
  "var summarize_hvut_shrine_offer_messages = function (messages) {",
  "var bridge = typeof window !== 'undefined' ? window.HVAA_shrineOfferReservation : undefined;",
  "if (!bridge || typeof bridge[action] !== 'function') {",
  "return { ok: bridge[action](state, item) !== false };",
  "var result = run_hvut_shrine_offer_reservation_bridge('reserve', state, item);",
  "var result = run_hvut_shrine_offer_reservation_bridge('rollback', state, item);",
  "record_hvut_shrine_offer_failure('offerReservationBridgeMissing'",
  "var stage = action === 'rollback' ? 'offerReservationBridgeRollback' : 'offerReservationBridgeReserve';",
  "record_hvut_shrine_offer_failure(stage, { action: action, item: itemIdentity",
  "var bridge = typeof window !== 'undefined' ? window.HVAA_shrineOfferMessage : undefined;",
  "return { ok: true, decision: bridge.classify(msg) };",
  "record_hvut_shrine_offer_failure('offerMessageClassifierBridgeMissing'",
  "record_hvut_shrine_offer_failure('offerMessageClassifierBridgeFailed'",
  "var result = run_hvut_shrine_offer_message_classifier_bridge(msg);",
  "if (result.ok) return result.decision;",
  "return { kind: 'stop', reason: 'classifierUnavailable', message: 'Shrine offer classifier bridge unavailable.', evidence: result.evidence };",
  "record_hvut_shrine_offer_failure('unknownOfferMessage'",
  "var evidence = record_hvut_shrine_offer_failure(stage, { reason: 'emptyMessagebox' });",
  "return { kind: 'stop', reason: 'emptyMessagebox', message: 'Shrine offer response unavailable.', messages: [], evidence: evidence };",
  "return { kind: 'messages', messages: messages };",
  "var offerMessage = classify_hvut_shrine_offer_message(msg);",
  "summary.vouchers.push(offerMessage.message || msg);",
  "summary.equips.push(offerMessage.reward);",
  "summary.qualities.push(offerMessage.quality);",
  "summary.rewards.push(offerMessage.reward);",
  "summary.sold++;",
  "summary.salvaged++;",
  "var reason = offerMessage.reason || 'unknownShrineResponse';",
  "var message = offerMessage.message || msg;",
  "var evidence = offerMessage.evidence || record_hvut_shrine_offer_failure('unknownOfferMessage', { reason: reason, message: message });",
  "return { kind: 'stop', reason: reason, message: message, evidence: evidence };",
]) {
  if (!text.includes(required)) {
    violations.push(`${target} must centralize Shrine offer reservation with ${required}`);
  }
}
for (const forbidden of [
  "window.HVAA_shrineOfferReservation.reserve(state, item)",
  "window.HVAA_shrineOfferReservation.rollback(state, item)",
  "window.HVAA_shrineOfferMessage.classify(msg)",
]) {
  if (text.includes(forbidden)) {
    violations.push(`${target} must route Shrine offer bridges through local command entries`);
  }
}

for (const required of [
  "export function classifyShrineOfferMessage(message) {",
  "if (msg.includes(\"Sold the remains for\")) return { kind: \"ignore\" };",
  "return { kind: \"stop\", reason: \"equipmentInventoryFull\", message: msg };",
  "return { kind: \"stop\", reason: \"unknownShrineResponse\", message: msg };",
]) {
  if (!classifierText.includes(required)) {
    violations.push(`${classifierTarget} must own Shrine offer message classification with ${required}`);
  }
}
for (const required of [
  "import { classifyShrineOfferMessage } from \"./shrine-offer-message.js\";",
  "window.HVAA_shrineOfferMessage = Object.freeze({",
  "classify: classifyShrineOfferMessage",
]) {
  if (!classifierBridgeText.includes(required)) {
    violations.push(`${classifierBridgeTarget} must expose Shrine offer classifier bridge with ${required}`);
  }
}
if (!mainText.includes("import \"./i18n/shrine-offer-message-bridge.js\";")) {
  violations.push(`${mainTarget} must load Shrine offer classifier bridge before hv-utils`);
}
if (
  !classifierTestText.includes("Sold the remains for 8 credits") ||
  !classifierTestText.includes("Your equipment inventory is full") ||
  !classifierTestText.includes("unknownShrineResponse")
) {
  violations.push(`${classifierTestTarget} must cover ignored sold-remains and stop messages`);
}
for (const required of [
  "export function reserveShrineOffer(state, item) {",
  "export function rollbackShrineOfferReservation(state, item) {",
  "state.equip.requests++;",
  "state.equip.requests--;",
]) {
  if (!reservationText.includes(required)) {
    violations.push(`${reservationTarget} must own Shrine offer reservation mutation with ${required}`);
  }
}
for (const required of [
  "import { reserveShrineOffer, rollbackShrineOfferReservation } from \"./shrine-offer-reservation.js\";",
  "window.HVAA_shrineOfferReservation = Object.freeze({",
  "reserve: reserveShrineOffer",
  "rollback: rollbackShrineOfferReservation",
]) {
  if (!reservationBridgeText.includes(required)) {
    violations.push(`${reservationBridgeTarget} must expose Shrine offer reservation bridge with ${required}`);
  }
}
if (!mainText.includes("import \"./i18n/shrine-offer-reservation-bridge.js\";")) {
  violations.push(`${mainTarget} must load Shrine offer reservation bridge before hv-utils`);
}
if (!reservationTestText.includes("reserves one actual offer") || !reservationTestText.includes("rolls back one failed trophy reservation")) {
  violations.push(`${reservationTestTarget} must cover reserve and rollback state transitions`);
}

for (const [label, body, counter] of [
  ["Shrine offer load", offerLoad, "item.total++;"],
  ["legacy Shrine request", legacyRequest, "item.recieved++;"],
]) {
  const stopIndex = body.indexOf("if (offerSummary.kind === 'stop') {");
  const counterIndex = body.indexOf(counter);
  if (stopIndex < 0 || counterIndex < 0 || counterIndex < stopIndex) {
    violations.push(`${target} ${label} must reject stopped Shrine offers before success counting`);
  }
}

for (const [label, body, forbidden] of [
  ["local Shrine reservation bridge", localReservation, "item.requests++"],
  ["local Shrine reservation bridge", localReservation, "item.stock -="],
  ["local Shrine reservation bridge", localReservation, "item.max--"],
  ["local Shrine reservation bridge", localReservation, "state.equip.requests++"],
  ["local Shrine reservation rollback bridge", localReservationRollback, "item.requests--"],
  ["local Shrine reservation rollback bridge", localReservationRollback, "item.stock +="],
  ["local Shrine reservation rollback bridge", localReservationRollback, "item.max++"],
  ["local Shrine reservation rollback bridge", localReservationRollback, "state.equip.requests--"],
  ["local Shrine classifier bridge", localClassifier, "Snowflake has blessed you"],
  ["local Shrine classifier bridge", localClassifier, "Hit Space Bar to offer"],
  ["local Shrine classifier bridge", localClassifier, "Peerless Voucher"],
  ["local Shrine classifier bridge", localClassifier, "Crude|Fair|Average"],
  ["local Shrine classifier bridge", localClassifier, "Received (.*?)"],
  ["local Shrine classifier bridge", localClassifier, "was increased by 1"],
  ["local Shrine classifier bridge", localClassifier, "Sold it for"],
  ["local Shrine classifier bridge", localClassifier, "Salvaged it for"],
  ["local Shrine classifier bridge", localClassifier, "Sold the remains for"],
  ["Shrine offer request", offerRequest, /(^|\n)\s*_ss\.offer\.load\(iid, reward_type, reward_slot\);/],
  ["Shrine offer request", offerRequest, "item.requests += count;"],
  ["Shrine offer request", offerRequest, "item.stock -= count * item.bulk;"],
  ["Shrine offer request", offerRequest, "item.max -= count;"],
  ["Shrine offer request", offerRequest, "_ss.equip.requests += count;"],
  ["Shrine offer request", offerRequest, "item.requests++;"],
  ["Shrine offer request", offerRequest, "item.requests--;"],
  ["Shrine offer request", offerRequest, "item.stock -= item.bulk;"],
  ["Shrine offer request", offerRequest, "item.stock += item.bulk;"],
  ["Shrine offer request", offerRequest, "item.max--;"],
  ["Shrine offer request", offerRequest, "item.max++;"],
  ["Shrine offer request", offerRequest, "_ss.equip.requests++;"],
  ["Shrine offer request", offerRequest, "_ss.equip.requests--;"],
  ["Shrine offer load", offerLoad, "_ss.log.save();"],
  ["Shrine offer load", offerLoad, "set_hvut_shrine_stop_error(_ss, 'Shrine offer response unavailable.');"],
  ["Shrine offer load", offerLoad, "get_message(doc, true).forEach"],
  ["Shrine offer load", offerLoad, "offerResponse.messages.forEach((msg) => {"],
  ["Shrine offer load", offerLoad, "classify_hvut_shrine_offer_message(msg)"],
  ["Shrine offer load", offerLoad, "const reg_text ="],
  ["Shrine offer load", offerLoad, "const reg_voucher ="],
  ["Shrine offer load", offerLoad, "const reg_equip ="],
  ["Shrine offer load", offerLoad, "const reg_received ="],
  ["Shrine offer load", offerLoad, "const reg_pab ="],
  ["Shrine offer load", offerLoad, "msg.includes('Sold the remains for')"],
  ["Shrine offer load", offerLoad, "RegExp.$"],
  ["Shrine offer load", offerLoad, "set_hvut_shrine_stop_error(_ss, msg);"],
  ["Shrine log save", logSave, "$config.set('ss_log', _ss.log.json);"],
  ["legacy Shrine offer", legacyOffer, /(^|\n)\s*_ss\.request\(iid, select_reward_type, select_reward_slot\);/],
  ["legacy Shrine offer", legacyOffer, "item.requests += count;"],
  ["legacy Shrine offer", legacyOffer, "item.stock -= count * item.bulk;"],
  ["legacy Shrine offer", legacyOffer, "item.max -= count;"],
  ["legacy Shrine offer", legacyOffer, "_ss.equip.requests += count;"],
  ["legacy Shrine offer", legacyOffer, "item.requests++;"],
  ["legacy Shrine offer", legacyOffer, "item.requests--;"],
  ["legacy Shrine offer", legacyOffer, "item.stock -= item.bulk;"],
  ["legacy Shrine offer", legacyOffer, "item.stock += item.bulk;"],
  ["legacy Shrine offer", legacyOffer, "item.max--;"],
  ["legacy Shrine offer", legacyOffer, "item.max++;"],
  ["legacy Shrine offer", legacyOffer, "_ss.equip.requests++;"],
  ["legacy Shrine offer", legacyOffer, "_ss.equip.requests--;"],
  ["legacy Shrine request", legacyRequest, "$config.set('ss_log', _ss.log);"],
  ["legacy Shrine request", legacyRequest, "set_hvut_shrine_stop_error(_ss, 'Shrine offer response unavailable.');"],
  ["legacy Shrine request", legacyRequest, "get_message(doc, true).forEach"],
  ["legacy Shrine request", legacyRequest, "offerResponse.messages.forEach((msg) => {"],
  ["legacy Shrine request", legacyRequest, "classify_hvut_shrine_offer_message(msg)"],
  ["legacy Shrine request", legacyRequest, "const reg ="],
  ["legacy Shrine request", legacyRequest, "Snowflake has blessed you"],
  ["legacy Shrine request", legacyRequest, "msg.includes('Peerless Voucher')"],
  ["legacy Shrine request", legacyRequest, "msg.includes('Sold it for')"],
  ["legacy Shrine request", legacyRequest, "msg.includes('Salvaged it for')"],
  ["legacy Shrine request", legacyRequest, "RegExp.$"],
  ["legacy Shrine request", legacyRequest, "set_hvut_shrine_stop_error(_ss, msg);"],
  ["Shrine offer classifier", text, "return { kind: 'stop', reason: 'classifierUnavailable', message: 'Shrine offer classifier bridge unavailable.' };"],
  ["Shrine offer summary", text, "return { kind: 'stop', reason: offerMessage.reason || 'unknownShrineResponse', message: offerMessage.message || msg };"],
  ["Shrine stop entry", text, "var set_hvut_shrine_stop_error = function (state, message) {"],
  ["Shrine offer reservation", text, "set_hvut_shrine_stop_error(state, 'Shrine offer reservation failed.');"],
  ["Shrine offer reservation rollback", text, "set_hvut_shrine_stop_error(state, 'Shrine offer reservation rollback failed.');"],
  ["Shrine offer load", offerLoad, "set_hvut_shrine_stop_error(_ss, offerResponse.message);"],
  ["Shrine offer load", offerLoad, "set_hvut_shrine_stop_error(_ss, offerSummary.message);"],
  ["Shrine offer load", offerLoad, "set_hvut_shrine_stop_error(_ss, 'Shrine offer request failed.');"],
  ["Shrine offer load", offerLoad, "set_hvut_shrine_stop_error(_ss, '你的装备库存已满');"],
  ["legacy Shrine request", legacyRequest, "set_hvut_shrine_stop_error(_ss, offerResponse.message);"],
  ["legacy Shrine request", legacyRequest, "set_hvut_shrine_stop_error(_ss, offerSummary.message);"],
  ["legacy Shrine request", legacyRequest, "set_hvut_shrine_stop_error(_ss, 'Shrine offer request failed.');"],
  ["legacy Shrine request", legacyRequest, "set_hvut_shrine_stop_error(_ss, '你的装备库存已满');"],
]) {
  if (typeof forbidden === "string" ? body.includes(forbidden) : forbidden.test(body)) {
    violations.push(`${target} ${label} must not ignore Shrine log persistence: ${forbidden}`);
  }
}

for (const required of [
  "record_hvut_shrine_offer_failure",
  "HVAA:lastHvutShrineOfferFailure",
  "capability: 'hvutShrineOffer'",
]) {
  if (!text.includes(required)) {
    violations.push(`${target} must record Shrine offer failures with ${required}`);
  }
}
for (const required of [
  'HVUT_SHRINE_OFFER_FAILURE: "HVAA:lastHvutShrineOfferFailure"',
  'source("hvutShrineOfferFailure", DiagnosticEvidenceKey.HVUT_SHRINE_OFFER_FAILURE)',
]) {
  if (!diagnosticText.includes(required)) {
    violations.push(`${diagnosticTarget} must include ${required}`);
  }
}
if (!diagnosticTestText.includes("HVAA:lastHvutShrineOfferFailure")) {
  violations.push(`${diagnosticTest} must cover Shrine offer diagnostic evidence`);
}

if (violations.length) {
  console.error("[verify-hvut-shrine-log-persistence-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-shrine-log-persistence-boundary] OK - Shrine log persistence failures fail closed");
