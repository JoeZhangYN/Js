// 入口路由：识别页面 (e-hentai redirect / lobby / riddle / battle) 并分派。
// file-size-gate: exempt phase-4-init
/* eslint-disable camelcase */
import { gE, cE } from "../dom/query.js";
import { setValue, getValue, delValue } from "../state/storage.js";
import { g } from "../state/store.js";
import { _alert } from "../core/lang.js";
import { goto, openUrl } from "../core/navigate.js";
import { time } from "../core/time.js";
import { addStyle } from "../style/inject.js";
import { riddleAlert } from "./riddle.js";
import { registerExportMenu } from "./riddle-ml.js";
import { encounterCheck } from "./encounter.js";
import { parseAbilityPage } from "./ability-page.js";
import { quickSite } from "../arena/quick-site.js";
import { repairCheck } from "../arena/repair-check.js";
import { idleArena } from "../arena/idle-arena.js";
import { main, pauseChange } from "../battle/main-loop.js";
import { reloader } from "../battle/reloader.js";
import { newRound } from "../battle/new-round.js";
import { setupScanWatch } from "../battle/monster-db-scan.js";
import { syncMonsterDb } from "../battle/monster-db-sync.js";
import { renderResistPanel } from "../monitor/monster-resist-panel.js";
import { loadCdState } from "../state/cd-tracker.js";
import { setupPageRefresh } from "../alarm/page-refresh.js";
import { setupForgeCost } from "./showequip-forge-cost.js";
import { setupEquipPercentile } from "./equip-percentile-dispatcher.js";
import { isOptionOn, getOption } from "../state/option.js";

export function init() {
  // Phase 5b-1: 启动时加载 globalTurn / skillLastUsed 持久化数据
  loadCdState();
  // P6: 注册 GM 菜单「导出答题备份」（全局可用，规避挂机后台下载失效）
  registerExportMenu();
  // P1 强化价格 + P3P4 装备百分位：装备页（#eu span 是 showequip 特征）/ Isekai 弹窗（MutationObserver 等待）
  // 必须早于下方 #navbar 早返回（showequip 页没有 navbar/riddlecounter/textlog）
  if (isOptionOn("forgeCostShow") && document.querySelector("#eu span")) {
    setupForgeCost();
  }
  const _percentileMode = getOption("equipPercentileMode", "off");
  if (_percentileMode && _percentileMode !== "off") {
    setupEquipPercentile();
  }
  if (window.location.host === "e-hentai.org") {
    let href =
      getValue("url") ||
      (document.referrer.includes("hentaiverse.org")
        ? new URL(document.referrer).origin
        : "https://hentaiverse.org");
    href = gE("#eventpane>div>a")
      ? `${href}/${gE("#eventpane>div>a").href.split("/")[3]}`
      : getValue("lastEncounter") || href;
    if (window.location.href === "https://e-hentai.org/news.php?encounter") {
      openUrl(href);
    } else if (gE("#eventpane>div>a")) {
      setValue("lastEncounter", href);
    }
    return;
  }
  setValue("url", window.location.origin);
  if (!gE("#navbar,#riddlecounter,#textlog")) {
    setTimeout(goto, 5 * 60 * 1000);
    return;
  }
  g("version", GM_info ? GM_info.script.version.slice(0, 4) : "2.89");
  if (getValue("option")) {
    g("option", getValue("option", true));
    g("lang", g("option").lang || "0");
    addStyle(g("lang"));
    if (g("option").version !== g("version")) {
      gE(".hvAAButton").click();
      if (
        _alert(
          1,
          "hvAutoAttack版本更新，请重新设置\n强烈推荐【重置设置】后再设置。\n是否查看更新说明？",
          "hvAutoAttack版本更新，請重新設置\n強烈推薦【重置設置】後再設置。\n是否查看更新說明？",
          "hvAutoAttack version update, please reset\nIt's recommended to reset all configuration.\nDo you want to read the changelog?"
        )
      )
        openUrl(
          "https://github.com/dodying/UserJs/commits/master/HentaiVerse/hvAutoAttack/hvAutoAttack.user.js",
          true
        );
      gE(".hvAAReset").focus();
      return;
    }
  } else {
    g(
      "lang",
      window.prompt(
        "请输入以下语言代码对应的数字\nPlease put in the number of your preferred language (0, 1 or 2)\n0.简体中文\n1.繁體中文\n2.English",
        0
      ) || 2
    );
    addStyle(g("lang"));
    _alert(
      0,
      "请设置hvAutoAttack",
      "請設置hvAutoAttack",
      "Please config this script"
    );
    gE(".hvAAButton").click();
    return;
  }
  // 移动端长时间挂机防卡死：absolute 时钟级 reload，与 reloader.delayReload（action idle 计时）正交
  setupPageRefresh(g("option"));
  if (
    gE('[class^="c5"],[class^="c4"]') &&
    _alert(
      1,
      "请设置字体\n使用默认字体可能使某些功能失效\n是否查看相关说明？",
      "請設置字體\n使用默認字體可能使某些功能失效\n是否查看相關說明？",
      "Please set the font\nThe default font may make some functions fail to work\nDo you want to see instructions?"
    )
  ) {
    openUrl(
      `https://github.com/dodying/UserJs/blob/master/HentaiVerse/hvAutoAttack/README${
        g("lang") === "2" ? "_en.md#about-font" : ".md#关于字体的说明"
      }`,
      true
    );
    return;
  }
  unsafeWindow = typeof unsafeWindow === "undefined" ? window : unsafeWindow;
  g("spellAoe", getValue("spellAoe", true) || {});
  console.log("[AoE] 启动加载 spellAoe:", JSON.stringify(g("spellAoe")));
  if (gE("#riddlecounter")) {
    // 需要答题
    if (g("option").riddlePopup && !window.opener) {
      window.open(
        window.location.href,
        "riddleWindow",
        "resizable,scrollbars,width=1241,height=707"
      );
    } else {
      riddleAlert(); // 答题警报
    }
  } else if (!gE("#navbar")) {
    // 战斗中
    const box2 = gE("#battle_main").appendChild(cE("div"));
    box2.id = "hvAABox2";
    if (g("option").pauseButton) {
      const button = box2.appendChild(cE("button"));
      button.innerHTML = "<l0>暂停</l0><l1>暫停</l1><l2>Pause</l2>";
      button.className = "pauseChange";
      button.onclick = function () {
        pauseChange();
      };
    }
    if (g("option").pauseHotkey) {
      document.addEventListener(
        "keydown",
        (e) => {
          if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
            return;
          if (e.key === g("option").pauseHotkeyKey) {
            pauseChange();
          }
        },
        false
      );
    }
    reloader();
    g("attackStatus", g("option").attackStatus);
    g("timeNow", time(0));
    g("runSpeed", 1);
    newRound();
    // C: 怪物九抗数据层 + 展示（纯展示，未接攻击决策；后续可加 option 开关）
    syncMonsterDb(); // 每日下载社区全量库（内部日期 gate，异步不阻塞主循环）
    setupScanWatch(renderResistPanel); // scan 自采监听 → 入库后刷新面板（newRound 末尾负责首刷/每轮刷新）
    if (g("option").recordEach && !getValue("battleCode"))
      setValue(
        "battleCode",
        `${time(1)}: ${g("roundType").toUpperCase()}-${g("roundAll")}`
      );
    main();
  } else {
    // 战斗外
    delValue(2);
    g("dateNow", time(2));
    const params = new URLSearchParams(window.location.search);
    if (params.get("s") === "Character" && params.get("ss") === "ab") {
      parseAbilityPage();
    }
    if (g("option").quickSite) quickSite();
    if (g("option").encounter) encounterCheck();
    if (
      !g("option").restoreStamina &&
      gE("#stamina_readout .fc4.far>div").textContent.match(/\d+/)[0] * 1 <=
        g("option").staminaLow
    )
      return;
    // 自动修复武器
    if (g("option").repair) repairCheck();
    if (g("option").idleArena)
      setTimeout(
        idleArena,
        ((g("option").idleArenaTime * (Math.random() * 20 + 90)) / 100) * 1000
      );
  }
}
