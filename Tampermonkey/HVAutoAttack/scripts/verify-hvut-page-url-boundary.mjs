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
  "var create_hvut_mail_sent_url = function () {",
  "var create_hvut_mail_read_url = function (context) {",
  "var create_hvut_mail_compose_url = function (context) {",
  "var create_hvut_mail_view_url = function (mid) {",
  "return context?.absolute ? `${location.origin}${location.pathname}${relative}` : relative;",
  "return location.href + '&hvut=disabled';",
  "return location.href.replace(/&page=\\d+/, '') + `&page=${page}`;",
  "return `?s=Bazaar&ss=mm&filter=new&reply=${mid}`;",
  "return '?s=Bazaar&ss=mm&filter=sent';",
  "return `?s=Bazaar&ss=mm&filter=${context?.filter}&mid=${context?.mid}${pageParam}`;",
  "return context?.persistent ? '/?s=Bazaar&ss=mm&filter=new' : '?s=Bazaar&ss=mm&filter=new';",
  "return `?s=Bazaar&ss=mm&mid=${mid}`;",
  "eq.data.url = create_hvut_equip_page_url(eq, { absolute: true });",
  "openUrl(create_hvut_equip_page_url(eq), hvutRedirectReason('HV_UTILS_EQUIP_POPUP'), true);",
  "openUrl(create_hvut_equip_page_url(div), hvutRedirectReason('HV_UTILS_EQUIP_POPUP'), true);",
  "href: create_hvut_equip_page_url({ eid: e.e, key: e.k })",
  "src: create_hvut_equip_page_url(eq)",
  "openUrl(create_hvut_current_page_disable_url(), hvutRedirectReason('HV_UTILS_DISABLE'));",
  "openUrl(create_hvut_mail_page_url(p), hvutRedirectReason('HV_UTILS_MAIL_PAGE'));",
  "openUrl(create_hvut_mail_reply_url(mid), hvutRedirectReason('HV_UTILS_MAIL_PAGE'));",
  "openUrl(create_hvut_mail_sent_url(), hvutRedirectReason('HV_UTILS_MAIL_PAGE'));",
  "href: create_hvut_mail_read_url({ filter: page.filter, mid: mid, page: p })",
  "href: create_hvut_mail_read_url({ filter: db.filter, mid: db.mid })",
  "$ajax.fetch(create_hvut_mail_compose_url()",
  "$ajax.fetch(create_hvut_mail_compose_url({ persistent: true })",
  "$ajax.fetch(create_hvut_mail_view_url(mid), post)",
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
  "openUrl('?s=Bazaar&ss=mm&filter=sent', hvutRedirectReason('HV_UTILS_MAIL_PAGE'))",
  "href: `?s=Bazaar&ss=mm&filter=${page.filter}&mid=${mid}&page=${p}`",
  "href: `?s=Bazaar&ss=mm&filter=${db.filter}&mid=${db.mid}`",
  "$ajax.fetch('?s=Bazaar&ss=mm&filter=new'",
  "$ajax.fetch('/?s=Bazaar&ss=mm&filter=new'",
  "$ajax.fetch(`?s=Bazaar&ss=mm&mid=${mid}`, post)",
  "$ajax.fetch('?s=Bazaar&ss=mm&mid=' + mid, post)",
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

const mailSentOccurrences = [...text.matchAll(/\?s=Bazaar&ss=mm&filter=sent/g)].length;
if (mailSentOccurrences !== 1) {
  violations.push(`${target} must build sent mail URL only in create_hvut_mail_sent_url, found ${mailSentOccurrences}`);
}

const mailPageReadOccurrences = [...text.matchAll(/\?s=Bazaar&ss=mm&filter=\$\{context\?\.(?:filter)\}&mid=\$\{context\?\.(?:mid)\}\$\{pageParam\}/g)].length;
if (mailPageReadOccurrences !== 1) {
  violations.push(`${target} must build mail read URL only in create_hvut_mail_read_url, found ${mailPageReadOccurrences}`);
}

const mailComposeFetchOccurrences = [...text.matchAll(/\$ajax\.fetch\(create_hvut_mail_compose_url/g)].length;
if (mailComposeFetchOccurrences !== 9) {
  violations.push(`${target} must route compose mailbox fetches through create_hvut_mail_compose_url, found ${mailComposeFetchOccurrences}`);
}

const mailViewFetchOccurrences = [...text.matchAll(/\$ajax\.fetch\(create_hvut_mail_view_url\(mid\), post\)/g)].length;
if (mailViewFetchOccurrences !== 2) {
  violations.push(`${target} must route mail view/action fetches through create_hvut_mail_view_url, found ${mailViewFetchOccurrences}`);
}

if (violations.length) {
  console.error("[verify-hvut-page-url-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-page-url-boundary] OK - HVUT page URLs are behind one derivation entry");
