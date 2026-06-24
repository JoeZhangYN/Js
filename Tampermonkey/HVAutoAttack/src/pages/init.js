// 入口路由：识别页面 (e-hentai redirect / lobby / riddle / battle) 并分派。
// file-size-gate: exempt phase-4-init
/* eslint-disable camelcase */
import { gE, cE } from "../dom/query.js";
import { setValue, getValue, delValue } from "../state/storage.js";
import { g } from "../state/store.js";
import { _alert } from "../core/lang.js";
import { scheduleReload, openUrl } from "../core/navigate.js";
import { time } from "../core/time.js";
import { addStyle } from "../style/inject.js";
import { riddleAlert } from "./riddle.js";
import { registerExportMenu } from "../state/riddle-dataset.js";
import { encounterCheck } from "./encounter.js";
import { parseAbilityPage } from "./ability-page.js";
import { quickSite } from "../arena/quick-site.js";
import { runRepair } from "../repair/repair-orchestrator.js";
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
import { readStaminaValue } from "../state/stamina.js";
import { detectPageKind, PageKind } from "./page-kind.js";

export function init() {
  // Phase 5b-1: 启动时加载 globalTurn / skillLastUsed 持久化数据
  loadCdState();
  // P6: 注册 GM 菜单「导出答题备份」（全局可用，规避挂机后台下载失效）
  registerExportMenu();
  // 页面类型单一判定（page-kind SOT，替代散落 ad-hoc 哨兵检测）。页面进入后 DOM 稳定，算一次复用。
  const kind = detectPageKind();
  // P1 强化价格 + P3P4 装备百分位（offline 单实现, live 已并入降级）：装备页（#eu span 是 showequip 特征）/ 弹窗（MutationObserver 等待）
  // 必须早于下方 #navbar 早返回（showequip 页没有 navbar/riddlecounter/textlog）
  if (isOptionOn("forgeCostShow") && document.querySelector("#eu span")) {
    setupForgeCost();
  }
  const _percentileMode = getOption("equipPercentileMode", "off");
  if (_percentileMode && _percentileMode !== "off") {
    setupEquipPercentile();
  }
  if (kind === PageKind.EHENTAI) {
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
  // 兜底：非 RIDDLE/BATTLE/LOBBY 游戏页（SHOWEQUIP 独立页 / UNKNOWN 未加载）→ 延时重载（等价原
  // `!gE("#navbar,#riddlecounter,#textlog")`，依赖 showequip 页无 navbar——见 page-kind.js 设计）。
  if (
    kind !== PageKind.RIDDLE &&
    kind !== PageKind.BATTLE &&
    kind !== PageKind.LOBBY
  ) {
    scheduleReload(5 * 60);
    return;
  }
  g("version", GM_info ? GM_info.script.version.slice(0, 4) : "2.89");
  if (getValue("option")) {
    g("option", getValue("option", true));
    g("lang", g("option").lang || "0");
    addStyle(g("lang"));
    if (g("option").version !== g("version")) {
      // [v10.0.1] 版本更新弹窗已禁用（用户要求不弹）：静默对齐版本号 + 持久化，
      // 避免每次刷新重复触发。新版若新增配置项，由各 getOption(key, default) 兜底。
      console.log(
        `[HVAA] 版本号 ${g("option").version} → ${g("version")}（已静默对齐，未弹窗）`
      );
      g("option").version = g("version");
      setValue("option", g("option"));
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
  if (gE('[class^="c5"],[class^="c4"]')) {
    // 旧版会跳 dodying README 字体说明；改为内联提示，不再外链导航。
    _alert(
      0,
      "请设置字体：使用默认字体可能使某些功能失效。\n请在 HV 设置(Settings) → Style 里把界面字体设为非默认(如 Verdana / Arial)。",
      "請設置字體：使用默認字體可能使某些功能失效。\n請在 HV 設置(Settings) → Style 裡把界面字體設為非默認(如 Verdana / Arial)。",
      "Please set a font: the default font may break some features.\nIn HV Settings → Style, set the UI font to a non-default one (e.g. Verdana / Arial)."
    );
  }
  unsafeWindow = typeof unsafeWindow === "undefined" ? window : unsafeWindow;
  g("spellAoe", getValue("spellAoe", true) || {});
  console.log("[AoE] 启动加载 spellAoe:", JSON.stringify(g("spellAoe")));
  if (kind === PageKind.RIDDLE) {
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
  } else if (kind === PageKind.BATTLE) {
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
      readStaminaValue() <= g("option").staminaLow
    )
      return;
    // 自动修复装备。repair 开启时 idleArena 调度由维修能力 runRepair 独占（仅装备达标才开下一场，
    // 缺料联动商店买齐、修理失败则停机止损）；故此处 else-if 互斥，避免无条件开战与 repair 解耦的破坏性死循环。
    if (g("option").repair) {
      runRepair();
    } else if (g("option").idleArena) {
      setTimeout(
        idleArena,
        ((g("option").idleArenaTime * (Math.random() * 20 + 90)) / 100) * 1000
      );
    }
  }
}
