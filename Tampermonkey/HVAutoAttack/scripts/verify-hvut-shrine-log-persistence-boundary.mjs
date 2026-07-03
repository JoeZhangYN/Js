import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const mainTarget = path.normalize("src/main.js");
const classifierTarget = path.normalize("src/i18n/shrine-offer-message.js");
const classifierBridgeTarget = path.normalize("src/i18n/shrine-offer-message-bridge.js");
const classifierTestTarget = path.normalize("src/i18n/shrine-offer-message.test.js");
const diagnosticTarget = path.normalize("src/core/diagnostic-evidence-keys.js");
const diagnosticTest = path.normalize("src/core/diagnostic-evidence.test.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const mainText = fs.readFileSync(path.join(root, mainTarget), "utf8");
const classifierText = fs.readFileSync(path.join(root, classifierTarget), "utf8");
const classifierBridgeText = fs.readFileSync(path.join(root, classifierBridgeTarget), "utf8");
const classifierTestText = fs.readFileSync(path.join(root, classifierTestTarget), "utf8");
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

if (!offerLoad) violations.push(`${target} must keep Shrine offer load entry visible`);
if (!offerRequest) violations.push(`${target} must keep Shrine offer request entry visible`);
if (!logSave) violations.push(`${target} must keep Shrine log save entry visible`);
if (!legacyOffer) violations.push(`${target} must keep legacy Shrine offer entry visible`);
if (!legacyRequest) violations.push(`${target} must keep legacy Shrine request entry visible`);

for (const part of [
  "record_hvut_shrine_offer_failure('offerLoadFetch'",
  "if (_ss.error) return false;",
  "classify_hvut_shrine_offer_message(msg)",
  "set_hvut_shrine_stop_error(_ss, 'Shrine offer request failed.');",
  "return false;",
  "let offerStopped = false;",
  "offerStopped = true;",
  "if (offerStopped) return false;",
  "if (_ss.log.save() === false) return false;",
  "return true;",
]) {
  requirePart("Shrine offer load", offerLoad, part);
}

for (const part of [
  "request: async function (iid, count, reward_type, reward_slot)",
  "if (_ss.error) break;",
  "reserve_hvut_shrine_offer(_ss, item);",
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
  "classify_hvut_shrine_offer_message(msg)",
  "set_hvut_shrine_stop_error(_ss, 'Shrine offer request failed.');",
  "return false;",
  "let offerStopped = false;",
  "offerStopped = true;",
  "if (offerStopped) return false;",
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
  "reserve_hvut_shrine_offer(_ss, item);",
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
  "var classify_hvut_shrine_offer_message = function (msg) {",
  "window.HVAA_shrineOfferMessage.classify(msg)",
  "state.equip.requests++;",
  "state.equip.requests--;",
  "if (msg.includes('Sold the remains for')) return { kind: 'ignore' };",
]) {
  if (!text.includes(required)) {
    violations.push(`${target} must centralize Shrine offer reservation with ${required}`);
  }
}

for (const required of [
  "export function classifyShrineOfferMessage(message) {",
  "if (msg.includes(\"Sold the remains for\")) return { kind: \"ignore\" };",
  "return { kind: \"stop\", message: msg };",
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
if (!classifierTestText.includes("Sold the remains for 8 credits") || !classifierTestText.includes("Your equipment inventory is full")) {
  violations.push(`${classifierTestTarget} must cover ignored sold-remains and stop messages`);
}

for (const [label, body, counter] of [
  ["Shrine offer load", offerLoad, "item.total++;"],
  ["legacy Shrine request", legacyRequest, "item.recieved++;"],
]) {
  const stopIndex = body.indexOf("if (offerStopped) return false;");
  const counterIndex = body.indexOf(counter);
  if (stopIndex < 0 || counterIndex < 0 || counterIndex < stopIndex) {
    violations.push(`${target} ${label} must reject stopped Shrine offers before success counting`);
  }
}

for (const [label, body, forbidden] of [
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
  ["Shrine offer load", offerLoad, "const reg_text ="],
  ["Shrine offer load", offerLoad, "const reg_voucher ="],
  ["Shrine offer load", offerLoad, "const reg_equip ="],
  ["Shrine offer load", offerLoad, "const reg_received ="],
  ["Shrine offer load", offerLoad, "const reg_pab ="],
  ["Shrine offer load", offerLoad, "msg.includes('Sold the remains for')"],
  ["Shrine offer load", offerLoad, "RegExp.$"],
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
  ["legacy Shrine request", legacyRequest, "const reg ="],
  ["legacy Shrine request", legacyRequest, "Snowflake has blessed you"],
  ["legacy Shrine request", legacyRequest, "msg.includes('Peerless Voucher')"],
  ["legacy Shrine request", legacyRequest, "msg.includes('Sold it for')"],
  ["legacy Shrine request", legacyRequest, "msg.includes('Salvaged it for')"],
  ["legacy Shrine request", legacyRequest, "RegExp.$"],
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
