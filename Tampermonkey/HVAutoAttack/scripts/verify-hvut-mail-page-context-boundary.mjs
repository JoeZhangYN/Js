import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const violations = [];

for (const required of [
  "var create_hvut_mail_page_context = function (query) {",
  "var source = query || _query;",
  "var filter = source?.filter || 'inbox';",
  "var current = parseInt(source?.page) || 0;",
  "var disabled = source?.hvut === 'disabled';",
  "filter: filter,",
  "current: current,",
  "disabled: disabled,",
  "shouldUseHvutCompose: filter === 'new' && !disabled,",
  "var create_hvut_mail_page_url = function (page, context) {",
  "var mailPage = context || create_hvut_mail_page_context();",
  "return create_hvut_mail_filter_page_url(mailPage.filter, page);",
]) {
  if (!text.includes(required)) {
    violations.push(`${target} must keep MoogleMail page context boundary: ${required}`);
  }
}

const mailBodies = [
  ...text.matchAll(/if \(_query\.s === 'Bazaar' && _query\.ss === 'mm' && \$config\.settings\.moogleMail\) \{[\s\S]*?\n\} else\n\/\/ \[END (?:12|13)\] Bazaar - MoogleMail/g),
].map((match) => match[0]);

if (mailBodies.length !== 2) {
  violations.push(`${target} must keep both MoogleMail segment bodies visible, found ${mailBodies.length}`);
}

for (const [index, body] of mailBodies.entries()) {
  for (const required of [
    "const mailPage = create_hvut_mail_page_context();",
    "if (mailPage.shouldUseHvutCompose) {",
  ]) {
    if (!body.includes(required)) {
      violations.push(`${target} MoogleMail body[${index}] must consume page context: ${required}`);
    }
  }
  for (const forbidden of [
    "_query.filter === 'new' && _query.hvut !== 'disabled'",
    "_query.filter || 'inbox'",
    "parseInt(_query.page) || 0",
  ]) {
    if (body.includes(forbidden)) {
      violations.push(`${target} MoogleMail body[${index}] must not rebuild page context from raw query: ${forbidden}`);
    }
  }
}

if (!mailBodies[0]?.includes("filter: mailPage.filter,") || !mailBodies[0]?.includes("current: mailPage.current,")) {
  violations.push(`${target} modern MoogleMail page state must derive from page context`);
}

if (!mailBodies[1]?.includes("_mm.page_filter = mailPage.filter;") || !mailBodies[1]?.includes("_mm.page_current = mailPage.current;")) {
  violations.push(`${target} legacy MoogleMail page state must derive from page context`);
}

if (text.includes("return create_hvut_mail_filter_page_url(_query.filter || 'inbox', page);")) {
  violations.push(`${target} mail page URL must not read raw _query.filter`);
}

if (violations.length) {
  console.error("[verify-hvut-mail-page-context-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-mail-page-context-boundary] OK - MoogleMail filter/page routing uses one page context");
