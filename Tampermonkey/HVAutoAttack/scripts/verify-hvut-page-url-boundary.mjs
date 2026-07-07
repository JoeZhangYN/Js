import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const violations = [];

for (const required of [
  "var create_hvut_equip_page_url = function (equip, context) {",
  "var create_hvut_current_page_disable_url = function () {",
  "var create_hvut_ability_unlock_url = function () {",
  "var create_hvut_mail_filter_page_url = function (filter, page) {",
  "var create_hvut_mail_page_context = function (query) {",
  "var create_hvut_mail_page_url = function (page, context) {",
  "var create_hvut_mail_reply_url = function (mid) {",
  "var create_hvut_mail_sent_url = function () {",
  "var create_hvut_mail_read_url = function (context) {",
  "var create_hvut_mail_compose_url = function (context) {",
  "var create_hvut_mail_view_url = function (mid) {",
  "var create_hvut_character_section_url = function (ss) {",
  "var create_hvut_character_page_url = function () {",
  "var create_hvut_equipment_page_url = function () {",
  "var create_hvut_item_inventory_url = function () {",
  "var create_hvut_character_settings_url = function () {",
  "var create_hvut_training_url = function () {",
  "var create_hvut_bazaar_section_url = function (ss) {",
  "var create_hvut_item_shop_url = function () {",
  "var create_hvut_market_browse_items_url = function (filter) {",
  "var create_hvut_shrine_url = function () {",
  "var create_hvut_monster_lab_slot_url = function (mob) {",
  "var create_hvut_armory_screen_url = function (screen, context) {",
  "var create_hvut_armory_organize_url = function () {",
  "return context?.absolute ? `${location.origin}${location.pathname}${relative}` : relative;",
  "return location.href + '&hvut=disabled';",
  "return location.href;",
  "return `?s=Bazaar&ss=mm&filter=${filter}&page=${page}`;",
  "return create_hvut_mail_filter_page_url(mailPage.filter, page);",
  "return `?s=Bazaar&ss=mm&filter=new&reply=${mid}`;",
  "return '?s=Bazaar&ss=mm&filter=sent';",
  "return `?s=Bazaar&ss=mm&filter=${context?.filter}&mid=${context?.mid}${pageParam}`;",
  "return context?.persistent ? '/?s=Bazaar&ss=mm&filter=new' : '?s=Bazaar&ss=mm&filter=new';",
  "return `?s=Bazaar&ss=mm&mid=${mid}`;",
  "return `?s=Character&ss=${ss}`;",
  "return create_hvut_character_section_url('ch');",
  "return create_hvut_character_section_url('eq');",
  "return create_hvut_character_section_url('it');",
  "return create_hvut_character_section_url('se');",
  "return '/?s=Character&ss=tr';",
  "return `/?s=Bazaar&ss=${ss}`;",
  "return '?s=Bazaar&ss=is';",
  "return `?s=Bazaar&ss=mk&screen=browseitems&filter=${filter}`;",
  "return '?s=Bazaar&ss=ss';",
  "return `?s=Bazaar&ss=ml&slot=${mob?.index ?? mob}`;",
  "return `?s=Bazaar&ss=am&screen=${screen}${filter}${eqids}`;",
  "return create_hvut_armory_screen_url('organize');",
  "eq.data.url = create_hvut_equip_page_url(eq, { absolute: true });",
  "openUrl(create_hvut_equip_page_url(eq), hvutRedirectReason('HV_UTILS_EQUIP_POPUP'), true);",
  "openUrl(create_hvut_equip_page_url(div), hvutRedirectReason('HV_UTILS_EQUIP_POPUP'), true);",
  "href: create_hvut_equip_page_url({ eid: e.e, key: e.k })",
  "src: create_hvut_equip_page_url(eq)",
  "openUrl(create_hvut_current_page_disable_url(), hvutRedirectReason('HV_UTILS_DISABLE'));",
  "$ajax.fetch(create_hvut_ability_unlock_url(), `unlock_ability=${ability.id}`)",
  "$ajax.fetch(create_hvut_mail_filter_page_url(_mm.page.filter, p))",
  "$ajax.fetch(create_hvut_mail_filter_page_url(_mm.page_filter, p))",
  "openUrl(create_hvut_mail_page_url(p), hvutRedirectReason('HV_UTILS_MAIL_PAGE'));",
  "openUrl(create_hvut_mail_reply_url(mid), hvutRedirectReason('HV_UTILS_MAIL_PAGE'));",
  "openUrl(create_hvut_mail_sent_url(), hvutRedirectReason('HV_UTILS_MAIL_PAGE'));",
  "href: create_hvut_mail_read_url({ filter: page.filter, mid: mid, page: p })",
  "href: create_hvut_mail_read_url({ filter: db.filter, mid: db.mid })",
  "$ajax.fetch(create_hvut_mail_compose_url()",
  "$ajax.fetch(create_hvut_mail_compose_url({ persistent: true })",
  "$ajax.fetch(create_hvut_mail_view_url(mid), post)",
  "$ajax.fetch(create_hvut_item_inventory_url())",
  "$ajax.fetch(create_hvut_character_page_url()",
  "$ajax.fetch(create_hvut_equipment_page_url()",
  "openUrl(create_hvut_character_settings_url(), hvutRedirectReason('HV_UTILS_CHARACTER_SETTINGS'));",
  "$ajax.fetch(create_hvut_character_settings_url()",
  "href: create_hvut_training_url()",
  "$ajax.fetch(create_hvut_training_url(), post)",
  "href: create_hvut_bazaar_section_url(ss)",
  "$ajax.fetch(create_hvut_bazaar_section_url(ss))",
  "$ajax.fetch(create_hvut_item_shop_url()",
  "$ajax.fetch(create_hvut_market_browse_items_url(filter))",
  "$ajax.fetch(create_hvut_shrine_url()",
  "$ajax.fetch(create_hvut_monster_lab_slot_url(mob)",
  "$ajax.fetch(create_hvut_armory_organize_url()",
  "$ajax.fetch(create_hvut_armory_screen_url('purchase'), data)",
  "$ajax.fetch(create_hvut_armory_screen_url('sell'), data)",
  "$ajax.fetch(create_hvut_armory_screen_url('salvage'), data + '&sell_salvage=on')",
  "$ajax.fetch(create_hvut_armory_screen_url('repair'), data)",
  "$ajax.fetch(create_hvut_armory_screen_url('modify', { eqid: eq.info.eid }))",
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
  "location.href.replace(/&page=\\d+/, '') + `&page=${page}`",
  "location.href.replace(/&page=\\d+/, '') + '&page=' + p",
  "return create_hvut_mail_filter_page_url(_query.filter || 'inbox', page);",
  "$ajax.fetch(location.href, `unlock_ability=${ability.id}`)",
  "openUrl(`?s=Bazaar&ss=mm&filter=new&reply=${mid}`, hvutRedirectReason('HV_UTILS_MAIL_PAGE'))",
  "openUrl('?s=Bazaar&ss=mm&filter=sent', hvutRedirectReason('HV_UTILS_MAIL_PAGE'))",
  "href: `?s=Bazaar&ss=mm&filter=${page.filter}&mid=${mid}&page=${p}`",
  "href: `?s=Bazaar&ss=mm&filter=${db.filter}&mid=${db.mid}`",
  "$ajax.fetch(`?s=Bazaar&ss=mm&filter=${_mm.page.filter}&page=${p}`)",
  "$ajax.fetch(`?s=Bazaar&ss=mm&filter=${_mm.page_filter}&page=${p}`)",
  "$ajax.fetch('?s=Bazaar&ss=mm&filter=new'",
  "$ajax.fetch('/?s=Bazaar&ss=mm&filter=new'",
  "$ajax.fetch(`?s=Bazaar&ss=mm&mid=${mid}`, post)",
  "$ajax.fetch('?s=Bazaar&ss=mm&mid=' + mid, post)",
  "openUrl('?s=Character&ss=se', hvutRedirectReason('HV_UTILS_CHARACTER_SETTINGS'))",
  "$ajax.fetch('?s=Character&ss=se'",
  "$ajax.fetch('?s=Character&ss=it'",
  "$ajax.fetch('?s=Character&ss=ch'",
  "$ajax.fetch('?s=Character&ss=eq'",
  "href: '/?s=Character&ss=tr'",
  "$ajax.fetch('/?s=Character&ss=tr'",
  "href: '/?s=Bazaar&ss=' + ss",
  "$ajax.fetch('/?s=Bazaar&ss=' + ss)",
  "$ajax.fetch('?s=Bazaar&ss=is'",
  "$ajax.fetch(`?s=Bazaar&ss=mk&screen=browseitems&filter=${filter}`)",
  "$ajax.fetch('?s=Bazaar&ss=ss'",
  "$ajax.fetch(`?s=Bazaar&ss=ml&slot=${mob.index}`",
  "$ajax.fetch('?s=Bazaar&ss=ml&slot=' + mob.index",
  "urls.push([`?s=Bazaar&ss=ml&slot=${mob.index}`",
  "$ajax.fetch('?s=Bazaar&ss=am&screen=purchase', data)",
  "$ajax.fetch('?s=Bazaar&ss=am&screen=sell', data)",
  "$ajax.fetch('?s=Bazaar&ss=am&screen=salvage', data + '&sell_salvage=on')",
  "$ajax.fetch('?s=Bazaar&ss=am&screen=repair', data)",
  "href: `?s=Bazaar&ss=am&screen=modify&eqids=${eq.info.eid}`",
  "$ajax.fetch(`?s=Bazaar&ss=am&screen=modify&eqids=${eq.info.eid}`)",
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

const abilityUnlockUrlOccurrences = [...text.matchAll(/create_hvut_ability_unlock_url\(\)/g)].length;
if (abilityUnlockUrlOccurrences !== 1) {
  violations.push(`${target} must route ability unlock POST through create_hvut_ability_unlock_url, found ${abilityUnlockUrlOccurrences}`);
}

const mailPageOccurrences = [...text.matchAll(/location\.href\.replace\(\/&page=\\d\+\/, ''\) \+ `&page=\$\{page\}`/g)].length;
if (mailPageOccurrences !== 0) {
  violations.push(`${target} must not derive mailbox pages from raw location.href replacement, found ${mailPageOccurrences}`);
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
if (mailViewFetchOccurrences !== 1) {
  violations.push(`${target} must route mail view/action fetches through create_hvut_mail_view_url, found ${mailViewFetchOccurrences}`);
}

const mailFilterPageFetchOccurrences = [...text.matchAll(/\$ajax\.fetch\(create_hvut_mail_filter_page_url\(/g)].length;
if (mailFilterPageFetchOccurrences !== 2) {
  violations.push(`${target} must route mailbox page fetches through create_hvut_mail_filter_page_url, found ${mailFilterPageFetchOccurrences}`);
}

const mailPageOpenOccurrences = [...text.matchAll(/openUrl\(create_hvut_mail_page_url\(p\), hvutRedirectReason\('HV_UTILS_MAIL_PAGE'\)\)/g)].length;
if (mailPageOpenOccurrences !== 2) {
  violations.push(`${target} must route mailbox page navigation through create_hvut_mail_page_url, found ${mailPageOpenOccurrences}`);
}

const characterSettingsOpenOccurrences = [...text.matchAll(/openUrl\(create_hvut_character_settings_url\(\), hvutRedirectReason\('HV_UTILS_CHARACTER_SETTINGS'\)\)/g)].length;
if (characterSettingsOpenOccurrences !== 2) {
  violations.push(`${target} must route Character settings navigation through create_hvut_character_settings_url, found ${characterSettingsOpenOccurrences}`);
}

const characterSettingsFetchOccurrences = [...text.matchAll(/\$ajax\.fetch\(create_hvut_character_settings_url\(\)/g)].length;
if (characterSettingsFetchOccurrences !== 2) {
  violations.push(`${target} must route Character settings fetches through create_hvut_character_settings_url, found ${characterSettingsFetchOccurrences}`);
}

const characterPageFetchOccurrences = [...text.matchAll(/\$ajax\.fetch\(create_hvut_character_page_url\(\)/g)].length;
if (characterPageFetchOccurrences !== 3) {
  violations.push(`${target} must route Character page fetches through create_hvut_character_page_url, found ${characterPageFetchOccurrences}`);
}

const equipmentPageFetchOccurrences = [...text.matchAll(/\$ajax\.fetch\(create_hvut_equipment_page_url\(\)/g)].length;
if (equipmentPageFetchOccurrences !== 1) {
  violations.push(`${target} must route Equipment page fetches through create_hvut_equipment_page_url, found ${equipmentPageFetchOccurrences}`);
}

const itemInventoryFetchOccurrences = [...text.matchAll(/\$ajax\.fetch\(create_hvut_item_inventory_url\(\)/g)].length;
if (itemInventoryFetchOccurrences !== 1) {
  violations.push(`${target} must route item inventory fetches through create_hvut_item_inventory_url, found ${itemInventoryFetchOccurrences}`);
}

const trainingUrlOccurrences = [...text.matchAll(/create_hvut_training_url\(\)/g)].length;
if (trainingUrlOccurrences !== 2) {
  violations.push(`${target} must route bottom training link/load through create_hvut_training_url, found ${trainingUrlOccurrences}`);
}

const bottomBazaarSectionOccurrences = [...text.matchAll(/create_hvut_bazaar_section_url\(ss\)/g)].length;
if (bottomBazaarSectionOccurrences !== 2) {
  violations.push(`${target} must route bottom Bazaar section link/load through create_hvut_bazaar_section_url, found ${bottomBazaarSectionOccurrences}`);
}

const itemShopFetchOccurrences = [...text.matchAll(/\$ajax\.fetch\(create_hvut_item_shop_url\(\)/g)].length;
if (itemShopFetchOccurrences !== 4) {
  violations.push(`${target} must route Item Shop fetches through create_hvut_item_shop_url, found ${itemShopFetchOccurrences}`);
}

const marketBrowseItemsFetchOccurrences = [...text.matchAll(/\$ajax\.fetch\(create_hvut_market_browse_items_url\(filter\)\)/g)].length;
if (marketBrowseItemsFetchOccurrences !== 1) {
  violations.push(`${target} must route Market browse item fetches through create_hvut_market_browse_items_url, found ${marketBrowseItemsFetchOccurrences}`);
}

const shrineFetchOccurrences = [...text.matchAll(/\$ajax\.fetch\(create_hvut_shrine_url\(\)/g)].length;
if (shrineFetchOccurrences !== 2) {
  violations.push(`${target} must route Shrine offer submit fetches through create_hvut_shrine_url, found ${shrineFetchOccurrences}`);
}

const monsterLabSlotFetchOccurrences = [...text.matchAll(/\$ajax\.fetch\(create_hvut_monster_lab_slot_url\(mob\)/g)].length;
if (monsterLabSlotFetchOccurrences !== 4) {
  violations.push(`${target} must route Monster Lab slot fetches through create_hvut_monster_lab_slot_url, found ${monsterLabSlotFetchOccurrences}`);
}

const monsterLabSlotCommandOccurrences = [...text.matchAll(/urls\.push\(\[create_hvut_monster_lab_slot_url\(mob\),/g)].length;
if (monsterLabSlotCommandOccurrences !== 12) {
  violations.push(`${target} must route Monster Lab upgrade commands through create_hvut_monster_lab_slot_url, found ${monsterLabSlotCommandOccurrences}`);
}

const armoryOrganizeOccurrences = [...text.matchAll(/\$ajax\.fetch\(create_hvut_armory_organize_url\(\)/g)].length;
if (armoryOrganizeOccurrences !== 6) {
  violations.push(`${target} must route Armory organize fetches through create_hvut_armory_organize_url, found ${armoryOrganizeOccurrences}`);
}

if (violations.length) {
  console.error("[verify-hvut-page-url-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-page-url-boundary] OK - HVUT page URLs are behind one derivation entry");
