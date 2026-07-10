import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dictionary = fs.readFileSync(path.join(root, "src/i18n/custom-dictionary.js"), "utf8");
const dictionaryModel = fs.readFileSync(
  path.join(root, "src/i18n/custom-dictionary-model.js"),
  "utf8"
);
const translationResolver = fs.readFileSync(
  path.join(root, "src/i18n/core/translation-resolver.js"),
  "utf8"
);
const navigation = fs.readFileSync(path.join(root, "src/data/i18n/navigation-terms.js"), "utf8");
const interfaceDict = fs.readFileSync(path.join(root, "src/data/i18n/interface-dict.js"), "utf8");
const interfaceTranslator = fs.readFileSync(
  path.join(root, "src/i18n/interface-translate.js"),
  "utf8"
);
const settings = fs.readFileSync(path.join(root, "src/settings/render.js"), "utf8");
const tests = [
  "src/i18n/custom-dictionary.test.js",
  "src/i18n/core/restore-controller.test.js",
  "src/settings/render-localization.test.js",
]
  .map((file) => fs.readFileSync(path.join(root, file), "utf8"))
  .join("\n");
const violations = [];

function requireText(label, text, values) {
  for (const value of values) {
    if (!text.includes(value)) violations.push(`${label} must contain ${value}`);
  }
}

requireText("custom dictionary", dictionary, [
  'CUSTOM_DICTIONARY_STORAGE_KEY = "HVAA:i18n:custom-dictionary:v1"',
  "normalizeCustomDictionary",
  "mergeCustomDictionaries",
  'reason: "storageWriteFailed"',
  "CUSTOM_DICTIONARY_FAILURE_KEY",
]);
requireText("custom dictionary model", dictionaryModel, [
  "CUSTOM_DICTIONARY_SCHEMA_VERSION = 1",
  "schemaVersion: CUSTOM_DICTIONARY_SCHEMA_VERSION",
  "entry.group",
  "entry.source",
  "entry?.zhCN",
  "merged.set(entryKey(entry), entry)",
]);
requireText("translation resolver", translationResolver, [
  "CustomDictionaryEvent.RESOLVE_FORWARD",
  "CustomDictionaryEvent.RESOLVE_REVERSE",
  "if (zh == null && dict) zh = dict[value]",
  "translateText",
]);
requireText("navigation registry", navigation, [
  "NAVIGATION_TERMS",
  "TOP_MENU_DEFAULT_LINKS",
  "STAMINA_MESSAGES",
]);
requireText("interface dictionaries", interfaceDict, [
  "menu: {",
  "...NAVIGATION_TERMS",
  "topMenu: NAVIGATION_TERMS",
  "stamina: STAMINA_MESSAGES",
]);
requireText("interface translator", interfaceTranslator, [
  "CustomDictionaryEvent.RESOLVE_FORWARD",
  "value: customValue ?? value",
  "regexps.clear()",
]);
requireText("localization settings", settings, [
  'name="Localization"',
  'id="hvAATab-Localization"',
  "renderLocalizationSettingsFields()",
  'select name="lang"',
  'renderSchemaSelectField("equipPercentileMode")',
  "hvAACustomDictionaryImport",
  "CustomDictionaryEvent.IMPORT_TEXT",
]);
requireText("localization tests", tests, [
  "merges imports by group and source with incoming entries winning",
  "gives shared custom entries precedence in forward and reverse translation",
  "owns language, percentile lifecycle and shared custom dictionary controls",
]);

if (/hvAA_(?:isekai_)?i18n.*custom/i.test(dictionary)) {
  violations.push("custom dictionary storage must not use a World-prefixed key");
}

if (violations.length) {
  console.error("[verify-localization-capability-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  "[verify-localization-capability-boundary] OK - localization uses one registry and shared custom overrides"
);
