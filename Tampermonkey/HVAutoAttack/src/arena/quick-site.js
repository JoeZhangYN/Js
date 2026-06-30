// 大厅页面侧边栏快速链接渲染。
import { gE, cE } from "../dom/query.js";
import { OptionEvent, runOptionAutomation } from "../state/option.js";

const EVENT_LOBBY_READY = "lobbyReady";
const EVENT_RENDER_SETTINGS_TABLE_BODY = "renderSettingsTableBody";
const EVENT_RENDER_SETTINGS_EMPTY_ROW = "renderSettingsEmptyRow";
const EVENT_COLLECT_SETTINGS_INPUTS = "collectSettingsInputs";

export const QuickSiteEvent = Object.freeze({
  LOBBY_READY: EVENT_LOBBY_READY,
  RENDER_SETTINGS_TABLE_BODY: EVENT_RENDER_SETTINGS_TABLE_BODY,
  RENDER_SETTINGS_EMPTY_ROW: EVENT_RENDER_SETTINGS_EMPTY_ROW,
  COLLECT_SETTINGS_INPUTS: EVENT_COLLECT_SETTINGS_INPUTS,
});

const quickSiteEventHandlers = Object.freeze({
  [EVENT_LOBBY_READY]: () =>
    renderQuickSite(
      runOptionAutomation({ type: OptionEvent.READ_FIELD, key: "quickSite", fallback: false })
    ),
  [EVENT_RENDER_SETTINGS_TABLE_BODY]: (event) => renderSettingsTableBody(event.option),
  [EVENT_RENDER_SETTINGS_EMPTY_ROW]: () => renderSettingsEmptyRow(),
  [EVENT_COLLECT_SETTINGS_INPUTS]: (event) => collectSettingsInputs(event.option, event.inputs),
});

function attr(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderConfiguredSite(quickSiteBar, site) {
  const row = quickSiteBar.appendChild(cE("span"));
  row.title = String(site.name ?? "");
  const link = row.appendChild(cE("a"));
  link.href = String(site.url ?? "");
  link.target = "_blank";
  if (site.fav) {
    const icon = link.appendChild(cE("img"));
    icon.src = String(site.fav);
    icon.className = "favicon";
  }
  link.append(String(site.name ?? ""));
}

function renderQuickSite(quickSite) {
  if (!quickSite) return false;
  const quickSiteBar = gE("body").appendChild(cE("div"));
  quickSiteBar.className = "quickSiteBar";
  quickSiteBar.innerHTML =
    '<span><a href="javascript:void(0);"class="quickSiteBarToggle">&lt;&lt;</a></span><span><a href="http://tieba.baidu.com/f?kw=hv网页游戏"target="_blank"><img src="https://www.baidu.com/favicon.ico" class="favicon"></img>贴吧</a></span><span><a href="https://forums.e-hentai.org/index.php?showforum=76"target="_blank"><img src="https://forums.e-hentai.org/favicon.ico" class="favicon"></img>Forums</a></span>';
  if (Array.isArray(quickSite)) {
    quickSite.forEach((site) => renderConfiguredSite(quickSiteBar, site));
  }
  gE(".quickSiteBarToggle", quickSiteBar).onclick = function (event) {
    const toggle = event.currentTarget;
    const spans = gE("span", "all", quickSiteBar);
    for (let i = 1; i < spans.length; i++) {
      spans[i].style.display = toggle.textContent === "<<" ? "none" : "block";
    }
    toggle.textContent = toggle.textContent === "<<" ? ">>" : "<<";
  };
  return true;
}

function renderSettingsTableBody(option) {
  if (!option?.quickSite) return "";
  let html =
    '<tr class="hvAATh"><td><l0>图标</l0><l1>圖標</l1><l2>ICON</l2></td><td><l0>名称</l0><l1>名稱</l1><l2>Name</l2></td><td><l0>链接</l0><l1>鏈接</l1><l2>Link</l2></td></tr>';
  for (const site of option.quickSite) {
    html = `${html}<tr><td><input class="hvAADebug" type="text" value="${attr(site.fav)}"></td><td><input class="hvAADebug" type="text" value="${attr(site.name)}"></td><td><input class="hvAADebug" type="text" value="${attr(site.url)}"></td></tr>`;
  }
  return html;
}

function renderSettingsEmptyRow() {
  return '<td><input class="hvAADebug" type="text"></td><td><input class="hvAADebug" type="text"></td><td><input class="hvAADebug" type="text"></td>';
}

function collectSettingsInputs(option, inputs) {
  if (!inputs?.length) return option;
  option.quickSite = [];
  for (let i = 0; 3 * i < inputs.length; i++) {
    const name = inputs[3 * i + 1].value;
    if (name === "") continue;
    option.quickSite.push({
      fav: inputs[3 * i].value,
      name,
      url: inputs[3 * i + 2].value,
    });
  }
  return option;
}

export function runQuickSiteAutomation(event = { type: EVENT_LOBBY_READY }) {
  const handler = quickSiteEventHandlers[event.type];
  return handler ? handler(event) : false;
}
