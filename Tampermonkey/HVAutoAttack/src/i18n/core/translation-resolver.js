import { EQUIP_EXTRA, EQUIP_INFO, EQUIP_ITEMS } from "../../data/i18n/equip-dict.js";
import { AB_CATEGORY, EQ_CATEGORY, SPELL_TYPE } from "../../data/i18n/hvut-terms.js";
import { INTERFACE_WORDS } from "../../data/i18n/interface-dict.js";
import { reverseLookup } from "../../data/i18n/reverse-dict.js";
import { g } from "../../state/store.js";
import { CustomDictionaryEvent, runCustomDictionaryAutomation } from "../custom-dictionary.js";
import { langPostProcess } from "./lang-post.js";

const enByNode = new WeakMap();

export const SKIP_ATTR = "data-i18n-skip";

export function registerTranslation(node, enText) {
  if (node && typeof enText === "string" && !enByNode.has(node)) {
    enByNode.set(node, enText);
  }
}

export function resolveEn(nodeOrText, group) {
  if (nodeOrText && typeof nodeOrText === "object" && "nodeType" in nodeOrText) {
    if (enByNode.has(nodeOrText)) return enByNode.get(nodeOrText);
    const text = nodeOrText.textContent || "";
    return resolveCustomOrCanonical(text, group);
  }
  return resolveCustomOrCanonical(String(nodeOrText == null ? "" : nodeOrText), group);
}

function resolveCustomOrCanonical(text, group) {
  return (
    runCustomDictionaryAutomation({
      type: CustomDictionaryEvent.RESOLVE_REVERSE,
      group,
      zhCN: text,
    }) ?? reverseLookup(text, group)
  );
}

export function isSkipped(node) {
  let el = node && node.nodeType === 3 ? node.parentElement : node;
  while (el && el.hasAttribute) {
    if (el.hasAttribute(SKIP_ATTR)) return true;
    el = el.parentElement;
  }
  return false;
}

const FORWARD_DICTS = {
  item: EQUIP_ITEMS,
  material: EQUIP_ITEMS,
  eqCategory: EQ_CATEGORY,
  abCategory: AB_CATEGORY,
  spell: SPELL_TYPE,
};

export function t(value, group) {
  if (typeof value !== "string" || !value) return value;
  if (String(g("lang")) === "2") return value;
  let zh = runCustomDictionaryAutomation({
    type: CustomDictionaryEvent.RESOLVE_FORWARD,
    group,
    source: value,
  });
  const dict = FORWARD_DICTS[group] || (group ? INTERFACE_WORDS[group] : undefined);
  if (zh == null && dict) zh = dict[value];
  if (zh == null) zh = EQUIP_ITEMS[value] ?? EQUIP_INFO[value] ?? EQUIP_EXTRA[value];
  return zh != null ? langPostProcess(zh) : value;
}

export function translateText(value, group) {
  if (typeof value !== "string" || !value || String(g("lang")) === "2") return value;
  let translated = value;
  const customEntries = runCustomDictionaryAutomation({ type: CustomDictionaryEvent.LIST }).entries;
  const canonicalEntries = Object.entries(INTERFACE_WORDS[group] || {}).filter(
    ([source]) => !source.startsWith("/") && !source.includes("*")
  );
  for (const { group: entryGroup, source } of customEntries) {
    if (entryGroup === group && translated.includes(source)) {
      translated = translated.replace(source, t(source, group));
    }
  }
  for (const [source] of canonicalEntries) {
    if (translated.includes(source)) translated = translated.replace(source, t(source, group));
  }
  return translated;
}
