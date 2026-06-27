// 大厅页面侧边栏快速链接渲染。
import { gE, cE } from "../dom/query.js";

const EVENT_LOBBY_READY = "lobbyReady";

export const QuickSiteEvent = Object.freeze({
  LOBBY_READY: EVENT_LOBBY_READY,
});

function renderQuickSite(option) {
  if (!option?.quickSite) return false;
  const quickSiteBar = gE("body").appendChild(cE("div"));
  quickSiteBar.className = "quickSiteBar";
  quickSiteBar.innerHTML =
    '<span><a href="javascript:void(0);"class="quickSiteBarToggle">&lt;&lt;</a></span><span><a href="http://tieba.baidu.com/f?kw=hv网页游戏"target="_blank"><img src="https://www.baidu.com/favicon.ico" class="favicon"></img>贴吧</a></span><span><a href="https://forums.e-hentai.org/index.php?showforum=76"target="_blank"><img src="https://forums.e-hentai.org/favicon.ico" class="favicon"></img>Forums</a></span>';
  if (Array.isArray(option.quickSite)) {
    option.quickSite.forEach((site) => {
      quickSiteBar.innerHTML = `${quickSiteBar.innerHTML}<span title="${
        site.name
      }"><a href="${site.url}"target="_blank">${
        site.fav ? `<img src="${site.fav}"class="favicon"></img>` : ""
      }${site.name}</a></span>`;
    });
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

export function runQuickSiteAutomation(event = { type: EVENT_LOBBY_READY }) {
  if (event.type === EVENT_LOBBY_READY) return renderQuickSite(event.option);
  return false;
}
