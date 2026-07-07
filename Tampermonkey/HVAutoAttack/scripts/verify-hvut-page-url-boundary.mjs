import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const violations = [];

for (const required of [
  "var create_hvut_equip_page_url = function (equip, context) {",
  "var create_hvut_current_page_disable_url = function () {",
  "var create_hvut_mail_page_url = function (page) {",
  "var create_hvut_mail_reply_url = function (mid) {",
  "return context?.absolute ? `${location.origin}${location.pathname}${relative}` : relative;",
  "return location.href + '&hvut=disabled';",
  "return location.href.replace(/&page=\\d+/, '') + `&page=${page}`;",
  "return `?s=Bazaar&ss=mm&filter=new&reply=${mid}`;",
  "eq.data.url = create_hvut_equip_page_url(eq, { absolute: true });",
  "openUrl(create_hvut_equip_page_url(eq), hvutRedirectReason('HV_UTILS_EQUIP_POPUP'), true);",
  "openUrl(create_hvut_equip_page_url(div), hvutRedirectReason('HV_UTILS_EQUIP_POPUP'), true);",
  "href: create_hvut_equip_page_url({ eid: e.e, key: e.k })",
  "src: create_hvut_equip_page_url(eq)",
  "openUrl(create_hvut_current_page_disable_url(), hvutRedirectReason('HV_UTILS_DISABLE'));",
  "openUrl(create_hvut_mail_page_url(p), hvutRedirectReason('HV_UTILS_MAIL_PAGE'));",
  "openUrl(create_hvut_mail_reply_url(mid), hvutRedirectReason('HV_UTILS_MAIL_PAGE'));",
]) {
  if (!text.includes(required)) {
    violations.push(`${target} must keep HVUT page URL boundary: ${required}`);
  }
}

for (const forbidden of [
  "`${location.origin}${location.pathname}equip/${eq.info.eid}/${eq.info.key}`",
  "`equip/${eq.info.eid}/${eq.info.key}`",
  "`equip/${div.dataset.eid}/${div.dataset.key}`",
  "`equip/${e.e}/${e.k}`",
  "location.href + '&hvut=disabled'",
  "location.href.replace(/&page=\\d+/, '') + `&page=${p}`",
  "location.href.replace(/&page=\\d+/, '') + '&page=' + p",
  "openUrl(`?s=Bazaar&ss=mm&filter=new&reply=${mid}`, hvutRedirectReason('HV_UTILS_MAIL_PAGE'))",
]) {
  const allowedInsideHelper =
    forbidden === "location.href + '&hvut=disabled'" || forbidden === "location.href.replace(/&page=\\d+/, '') + `&page=${p}`";
  if (allowedInsideHelper) continue;
  if (text.includes(forbidden)) {
    violations.push(`${target} must not rebuild HVUT page URL outside helper: ${forbidden}`);
  }
}

const disableUrlOccurrences = [...text.matchAll(/location\.href \+ '&hvut=disabled'/g)].length;
if (disableUrlOccurrences !== 1) {
  violations.push(`${target} must build disable URL only in create_hvut_current_page_disable_url, found ${disableUrlOccurrences}`);
}

const mailPageOccurrences = [...text.matchAll(/location\.href\.replace\(\/&page=\\d\+\/, ''\) \+ `&page=\$\{page\}`/g)].length;
if (mailPageOccurrences !== 1) {
  violations.push(`${target} must build mail page URL only in create_hvut_mail_page_url, found ${mailPageOccurrences}`);
}

const mailReplyOccurrences = [...text.matchAll(/\?s=Bazaar&ss=mm&filter=new&reply=\$\{mid\}/g)].length;
if (mailReplyOccurrences !== 1) {
  violations.push(`${target} must build mail reply URL only in create_hvut_mail_reply_url, found ${mailReplyOccurrences}`);
}

if (violations.length) {
  console.error("[verify-hvut-page-url-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-page-url-boundary] OK - HVUT page URLs are behind one derivation entry");
