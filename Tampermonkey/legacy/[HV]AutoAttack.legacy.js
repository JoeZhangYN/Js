/* eslint-env browser */
// ==UserScript==
// @name         [HV]AutoAttack
// @name:zh-TW   [HV]AutoAttack
// @name:zh-CN   [HV]AutoAttack
// @description  HV auto attack script, for the first user, should configure before use it.
// @description:zh-CN HV自动打怪脚本，初次使用，请先设置好选项，请确认字体设置正常
// @description:zh-TW HV自動打怪腳本，初次使用，請先設置好選項，請確認字體設置正常
// @version      9.99.9999
// @author       dodying joezhangyn
// @namespace    https://github.com/dodying/
// @supportURL   https://github.com/dodying/UserJs/issues
// @icon         https://gitee.com/dodying/userJs/raw/master/Logo.png
// @match        http*://hentaiverse.org/*
// @match        http://alt.hentaiverse.org/*
// @match        https://e-hentai.org/*
// @exclude      http*://hentaiverse.org/pages/showequip.php?*
// @exclude      http://alt.hentaiverse.org/pages/showequip.php
// @grant        GM_deleteValue
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_notification
// @grant        unsafeWindow
// @run-at       document-end
// ==/UserScript==
/* eslint-disable camelcase */
(function () {
  "use strict";

  // 首先定义一些基本的常量和变量
  /** 主世界对应网址
   * @type {string}
   */
  const MAIN_URL = "https://hentaiverse.org/";

  /** 异世界对应网址
   * @type {string}
   */
  const ISEKAI_URL = "https://hentaiverse.org/isekai/";

  const isIsekai = window.location.href.startsWith(ISEKAI_URL);

  /** 保存变量添加前缀
   * @type {string}
   */
  const storagePrefix = isIsekai ? "hvAA_isekai_" : "hvAA_"; // 添加前缀

  // 定义全局变量存储对象
  /** 主世界内容数据 */
  const hvAAOriginal = {};
  /** 异世界内容数据 */
  const hvAAIsekai = {};

  function init() {
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

  /** 自动修复武器 */
  function repairCheck() {
    let json;
    let checkOnload;
    let checkLength;
    let len = 0;
    let lastID;
    const eqps = [];
    checkOnload = function () {
      if (json) {
        setTimeout(checkOnload, 200);
        return;
      }
      post("?s=Forge&ss=re", (data) => {
        post(
          gE("#mainpane>script[src]", data).src,
          (data1) => {
            json = JSON.parse(data1.match(/{.*}/)[0]);
            gE(".eqp>[id]", "all", data).forEach((i) => {
              eqps.push(i.id.match(/\d+/)[0]);
            });
            len = 0;
            if (eqps.length === 0) {
              checkLength();
              return;
            }
            for (const id of eqps) {
              if (
                json[id].d.match(/Condition: \d+ \/ \d+ \((\d+)%\)/)[1] <=
                g("option").repairValue
              ) {
                if (id === lastID) {
                  return;
                }
                lastID = id; // 记录最后一次需要修理的装备id，然后再次检测是否修理成功
                post("?s=Forge&ss=re", checkOnload, `select_item=${id}`);
              } else {
                checkLength();
              }
            }
          },
          null,
          "text"
        );
      });
    };
    checkLength = function () {
      len++;
      if (len >= eqps.length && g("option").idleArena)
        setTimeout(
          idleArena,
          ((g("option").idleArenaTime * (Math.random() * 20 + 90)) / 100) * 1000
        );
    };
    checkOnload();
  }

  function getKeys(objArr, prop) {
    const keys = objArr.flatMap((item) => Object.keys(prop ? item[prop] : item));
    return [...new Set(keys)].sort();
  }

  function time(e, stamp) {
    const date = stamp ? new Date(stamp) : new Date();
    if (e === 0) {
      return date.getTime();
    }
    if (e === 1) {
      return `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
    }
    if (e === 2) {
      // date.toLocaleDateString(lang,option);
      return `${date.getUTCFullYear()}/${
        date.getUTCMonth() + 1
      }/${date.getUTCDate()}`;
    }
    if (e === 3) {
      return date.toLocaleString(navigator.language, {
        hour12: false,
      });
    }
  }

  /** DOM 元素查询（不缓存，每次获取最新状态） */
  function gE(ele, mode, parent) {
    if (typeof ele === "object") {
      return ele;
    }
    if (mode === undefined && parent === undefined) {
      return isNaN(ele * 1)
        ? document.querySelector(ele)
        : document.getElementById(ele);
    }
    if (mode === "all") {
      return parent === undefined
        ? document.querySelectorAll(ele)
        : parent.querySelectorAll(ele);
    }
    if (typeof mode === "object" && parent === undefined) {
      return mode.querySelector(ele);
    }
  }

  /** 创建元素 */
  function cE(name) {
    return document.createElement(name);
  }

  function isOn(id) {
    if (id * 1 > 10000) {
      return gE(`.bti3>div[onmouseover*="${id}"]`); // 使用物品
    }
    const element = gE(id);
    return element && element.style.opacity !== "0.5" ? element : false; // 释放技能
  }

  /** 存储数据 */
  function setValue(item, value) {
    const key = storagePrefix + item;
    if (typeof GM_setValue === "undefined") {
      window.localStorage[key] =
        typeof value === "string" ? value : JSON.stringify(value);
    } else {
      GM_setValue(key, value);
    }
  }

  /** 读取数据 */
  function getValue(item, toJSON) {
    const key = storagePrefix + item;
    if (typeof GM_getValue === "undefined" || !GM_getValue(key, null)) {
      return key in window.localStorage
        ? toJSON
          ? JSON.parse(window.localStorage[key])
          : window.localStorage[key]
        : null;
    }
    return GM_getValue(key, null);
  }

  /** 删除数据 */
  function delValue(item) {
    const key = storagePrefix + item;
    if (typeof item === "string") {
      if (typeof GM_deleteValue === "undefined") {
        window.localStorage.removeItem(key);
      } else {
        GM_deleteValue(key);
      }
    } else if (typeof item === "number") {
      if (item === 0) {
        delValue("disabled");
      } else if (item === 1) {
        delValue("roundNow");
        delValue("roundAll");
        delValue("monsterStatus");
      } else if (item === 2) {
        delValue("roundType");
        delValue("battleCode");
        delValue(0);
        delValue(1);
      }
    }
  }

  /** 重定向页面 */
  function goto() {
    window.location.href = window.location;
    setTimeout(goto, 5000);
  }

  /** 获取或者设置全局变量
   * @param {string} key 对应的键名
   * @param {*} value 对应的数据
   * @example
   * // g('end'); 获取end键名的数据
   * // g('end', true); 设置键名end的为true
   */
  function g(key, value) {
    const hvAA = isIsekai ? hvAAIsekai : hvAAOriginal;
    if (key === undefined && value === undefined) {
      return hvAA;
    }
    if (value === undefined) {
      return hvAA[key];
    }
    hvAA[key] = value;
  }

  /** 执行post */
  function post(href, func, parm, type, _retries) {
    const retries = _retries || 0;
    let xhr = new window.XMLHttpRequest();
    xhr.open(parm ? "POST" : "GET", href);
    xhr.setRequestHeader(
      "Content-Type",
      "application/x-www-form-urlencoded; charset=UTF-8"
    );
    xhr.responseType = type || "document";
    xhr.onerror = function () {
      xhr = null;
      if (retries < 3) {
        setTimeout(() => post(href, func, parm, type, retries + 1), 1000 * (retries + 1));
      }
    };
    xhr.onload = function (e) {
      if (
        e.target.status >= 200 &&
        e.target.status < 400 &&
        typeof func === "function"
      ) {
        const data = e.target.response;
        if (xhr.responseType === "document" && gE("#messagebox", data)) {
          if (gE("#messagebox")) {
            gE("#csp").replaceChild(gE("#messagebox", data), gE("#messagebox"));
          } else {
            gE("#csp").appendChild(gE("#messagebox", data));
          }
        }
        func(data, e);
      }
      xhr = null;
    };
    xhr.send(parm);
  }

  function objSort(obj) {
    return Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));
  }

  function _alert(func, l0, l1, l2, answer) {
    const lang = [l0, l1, l2][g("lang")];
    if (func === -1) {
      return lang;
    }
    if (func === 0) {
      window.alert(lang);
    } else if (func === 1) {
      return window.confirm(lang);
    } else if (func === 2) {
      return window.prompt(lang, answer);
    }
  }

  function openUrl(url, newTab) {
    window.open(url, newTab ? "_blank" : "_self");
  }

  function addStyle(lang) {
    // CSS
    const langStyle = gE("head").appendChild(cE("style"));
    langStyle.className = "hvAA-LangStyle";
    langStyle.textContent = `l${lang}{display:inline!important;}`;
    if (/^[01]$/.test(lang))
      langStyle.textContent = `${langStyle.textContent}l01{display:inline!important;}`;
    const globalStyle = gE("head").appendChild(cE("style"));
    const cssContent = [
      // hvAA
      "l0,l1,l01,l2{display:none;}", // l0: 简体 l1: 繁体 l01:简繁体共用 l2: 英文
      "#hvAABox2{position:absolute;left:1075px}",
      ".hvAALog{font-size:20px;}",
      ".hvAAButton{top:4px;left:1200px;position:absolute;z-index:9999;cursor:pointer;width:24px;height:24px;background:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAADi0lEQVRIiZVWPYgUZxj+dvGEk7vsNdPYCMul2J15n+d991PIMkWmOEyMyRW2FoJIUojYp5ADFbZJkyISY3EqKGpgz+Ma4bqrUojICaIsKGIXSSJcsZuD3RT3zWZucquXDwYG5n2f9/d5vnFuHwfAZySfAXgN4DXJzTiOj+3H90OnkmXZAe/9FMm3JJ8AuBGepyRfle2yLDvgnKt8EDVJkq8B3DGzjve+1m63p0n2AVzJbUh2SG455yre+5qZ/aCq983sxMfATwHYJvlCVYckHwFYVdURgO8LAS6RHJJcM7N1VR0CeE5yAGBxT3AR+QrA3wA20tQOq+pFkgOS90Tk85J51Xs9qaorqjoAcC6KohmSGyQHcRx/kbdv7AHgDskXaWqH0zSddc5Voyia2SOXapqmswsLvpam6ez8/Pwn+YcoimYAvARw04XZ5N8qZtZR1aGqXnTOVSd0cRd42U5EzqvqSFWX2u32tPd+yjnnXNiCGslHJAf7ybwM7r2vAdgWkYdZls157w+NK/DeT7Xb7WkAqyTvlZHjOD5oxgtmtqrKLsmze1VJsquqKwsLO9vnnKvkJHpLsq+qo/JAd8BtneTvqvqTiPwoIu9EZKUUpGpmi2Y2UtU+yTdJkhx1JJ8FEl0pruK/TrwA4F2r1WrkgI1G4wjJP0XkdLF9WaZzZnZZVa8GMj5xgf43JvXczFZbLb1ebgnJn0nenjQbEVkG0JsUYOykyi6Aa+XoQTJuTRr8OADJzVBOh+SlckYkz5L8Q0TquXOj0fhURN6r6pkSeAXAUsDaJPnYxXF8jOQrklskh97ryZJTVURWAPwF4DqAX0TkvRl/zTKdK2aeJMnxICFbAHrNZtOKVVdIrrVa2t1jz6sicprkbQC3VPVMGTzMpQvgQY63i8lBFddVdVCk/6TZlMFzopFci+P44H+YHCR3CODc/wUvDPY7ksMg9buZrKr3ATwvyoT3vrafzPP3er1eA9Azs7tjJhcqOBHkeSOKohkROR9K7prZYqnnlSRJjofhb4vIt/V6vUbyN1Xtt1qtb1zpZqs45xyAxXAnvCQ5FJGHqrpiZiMzu5xnHlZxCOABybXw3gvgp/Zq3/gA+BLATVVdyrJsbods2lfVq7lN4crMtapjZndD5pPBixWFLTgU7uQ3AJ6KyLKILAdy9sp25bZMBC//JSRJcjQIYg9Aj+TjZrNp+/mb+Ad711sdZZ1k/QAAAABJRU5ErkJggg==) center no-repeat transparent;}",
      '#hvAABox{left:calc(50% - 350px);top:50px;font-size:16px!important;z-index:4;width:700px;height:566px;position:absolute;text-align:left;background-color:#E3E0D1;border:1px solid #000;border-radius:10px;font-family:"Microsoft Yahei";}',
      ".hvAATablist{position:relative;left:14px;}",
      ".hvAATabmenu{position:absolute;left:-9px;}",
      ".hvAATabmenu>span{display:block;padding:5px 10px;margin:0 10px 0 0;border:1px solid #91a7b4;border-radius:5px;background-color:#E3F1F8;color:#000;text-decoration:none;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;cursor:pointer;}",
      ".hvAATabmenu>span:hover{left:-5px;position:relative;color:#0000FF;z-index:2!important;}",
      ".hvAATabmenu>span>input{margin:0 0 0 -8px;}",
      ".hvAATab{position:absolute;width:605px;height:458px;left:36px;padding:15px;border:1px solid #91A7B4;border-radius:3px;box-shadow:0 2px 3px rgba(0,0,0,0.1);color:#666;background-color:#EDEBDF;overflow:auto;}",
      ".hvAATab>div:nth-child(2n){border:1px solid #EAEAEA;background-color:#FAFAFA;}",
      ".hvAATab>div:nth-child(2n+1){border:1px solid #808080;background-color:#DADADA;}",
      ".hvAATab a{margin:0 2px;}",
      ".hvAATab b{font-family:Georgia,Serif;font-size:larger;}",
      ".hvAATab input.hvAANumber{width:24px;text-align:right;}",
      ".hvAATab ul,.hvAATab ol{margin:0;}",
      ".hvAATab label{cursor:pointer;}",
      ".hvAATab table{border:2px solid #000;border-collapse:collapse;margin:0 auto;}",
      ".hvAATh>*{font-weight:bold;font-size:larger;}",
      ".hvAATab table>tbody>tr>*{border:1px solid #000;}",
      "#hvAATab-Drop tr>td:nth-child(1),#hvAATab-Usage tr>td:nth-child(1){text-align:left;}",
      "#hvAATab-Drop td,#hvAATab-Usage td{text-align:right;white-space:nowrap;}",
      // '#hvAATab-Drop td:empty:before,#hvAATab-Usage td:empty:before{content:"";}',
      ".selectTable{cursor:pointer;}",
      `.selectTable:before{content:"${String.fromCharCode(0x22a0)}";}`,
      ".hvAACenter{text-align:center;}",
      ".hvAATitle{font-weight:bolder;}",
      ".hvAAGoto{cursor:pointer;text-decoration:underline;color:#5C0D11;}",
      ".hvAANew{width:25px;height:25px;float:left;background:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAMCAYAAACX8hZLAAAAcElEQVQ4jbVRSQ4AIQjz/59mTiZIF3twmnCwFAq4FkeFXM+5vCzohYxjPMtfxS8CN6iqQ7TfE0wrODxVbzJNgoaTo4CmbBO1ZWICouQ0DHaL259MEzaU+w8pZOdSjcUgaPJDHCbO0A2kuAiuwPGQ+wBms12x8HExTwAAAABJRU5ErkJggg==) center no-repeat transparent;}",
      '#hvAATab-Alarm input[type="text"]{width:512px;}',
      ".testAlarms>div{border:2px solid #000;}",
      ".hvAAArenaLevels{display:none;}",
      ".hvAAConfig{width:100%;height:16px;}",
      ".hvAAButtonBox{position:relative;top:496px;}",
      ".lastEncounter{font-weight:bold;font-size:large;position:absolute;top:32px;left:1240px;text-decoration:none;}",
      ".quickSiteBar{position:absolute;top:55px;left:1240px;font-size:18px;text-align:left;width:calc(99% - 1236px);}",
      ".quickSiteBar>span{display:block;max-height:24px;overflow:hidden;text-overflow:ellipsis;}",
      ".quickSiteBar>span>a{text-decoration:none;}",
      ".customize{border: 2px dashed red!important;min-height:21px;}",
      ".customize>.customizeGroup{display:block;background-color:#FFF;}",
      ".customize>.customizeGroup:nth-child(2n){background-color:#C9DAF8;}",
      ".customizeBox{position:absolute;z-index:-1;border:1px solid #000;background-color:#EDEBDF;}",
      ".customizeBox>span{display:inline-block;font-size:16px;margin:0 1px;padding:0 5px;font-weight:bold;border:1px solid #5C0D11;border-radius:10px;}",
      ".customizeBox>span.hvAAInspect{padding:0 3px;cursor:pointer;}",
      '.customizeBox>span.hvAAInspect[title="on"]{background-color:red;}',
      ".customizeBox>span a{text-decoration:none;}",
      ".customizeBox>select{max-width:60px;}",
      ".favicon{width:16px;height:16px;margin:-3px 1px;border:1px solid #000;border-radius:3px;}",
      ".answerBar{z-index:1000;width:710px;height:40px;position:absolute;top:55px;left:282px;display:table;border-spacing:5px;}",
      ".answerBar>div{border:4px solid red;display:table-cell;cursor:pointer;}",
      ".answerBar>div:hover{background:rgba(63,207,208,0.20);}",
      "#hvAAInspectBox{background-color:#EDEBDF;position:absolute;z-index:9;border: 2px solid #5C0D11;font-size:16px;font-weight:bold;padding:3px;display:none;}",
      // 全局
      "button{border-radius:3px;border:2px solid #808080;cursor:pointer;margin:0 1px;}",
      // hv
      "#riddleform>div:nth-child(3)>img{width:700px;}",
      "#battle_right{overflow:visible;}",
      "#pane_log{height:403px;}",
      ".tlbQRA{text-align:left;font-weight:bold;}", // 标记已检测的日志行
      ".tlbWARN{text-align:left;font-weight:bold;color:red;font-size:20pt;}", // 标记检测出异常的日志行
    ].join("");
    globalStyle.textContent = cssContent;
    optionButton(lang);
  }

  /** 配置按钮 */
  function optionButton(lang) {
    //
    const optionButton = gE("body").appendChild(cE("div"));
    optionButton.className = "hvAAButton";
    optionButton.onclick = function () {
      if (gE("#hvAABox")) {
        gE("#hvAABox").style.display =
          gE("#hvAABox").style.display === "none" ? "block" : "none";
      } else {
        optionBox();
        gE("#hvAATab-Main").style.zIndex = 1;
        gE('select[name="lang"]').value = lang;
      }
    };
  }

  /** 设置html代码和逻辑代码 */
  function optionBox() {
    // 配置界面
    const optionBox = gE("body").appendChild(cE("div"));
    optionBox.id = "hvAABox";
    optionBox.innerHTML = [
      '<div class="hvAACenter">',
      '  <h1 style="display:inline;">hvAutoAttack</h1>',
      '  <a href="https://github.com/dodying/UserJs/commits/master/HentaiVerse/hvAutoAttack/hvAutoAttack.user.js" target="_blank"><l0>更新历史</l0><l1>更新歷史</l1><l2>ChangeLog</l2></a>',
      '  <l01><a href="https://github.com/dodying/UserJs/blob/master/HentaiVerse/hvAutoAttack/README.md" target="_blank">使用说明</a></l01><l2><a href="https://github.com/dodying/UserJs/blob/master/HentaiVerse/hvAutoAttack/README_en.md" target="_blank">README</a></l2>',
      '  <select name="lang"><option value="0">简体中文</option><option value="1">繁體中文</option><option value="2">English</option></select>',
      '  <l2><span style="font-size:small;"><a target="_blank" href="https://greasyfork.org/forum/profile/18194/Koko191" style="color:#E3E0D1;background-color:#E3E0D1;" title="Thanks to Koko191 who give help in the translation">by Koko191</a></span></l2></div>',
      '<div class="hvAATablist">',
      '<div class="hvAATabmenu">',
      '  <span name="Main"><l0>主要选项</l0><l1>主要選項</l1><l2>Main</l2></span>',
      '  <span name="Spell"><l0>法术攻击</l0><l1>法術攻擊</l1><l2>Spell</l2></span>',
      '  <span name="Item"><l01>物品</l01><l2>Item</l2></span>',
      '  <span name="Channel"><input id="channelSkillSwitch" type="checkbox">Channel<l01>技能</l01><l2> Spells</l2></span>',
      '  <span name="Buff"><input id="buffSkillSwitch" type="checkbox">BUFF<l01>技能</l01><l2> Spells</l2></span>',
      '  <span name="Debuff"><input id="debuffSkillSwitch" type="checkbox">DEBUFF<l01>技能</l01><l2> Spells</l2></span>',
      '  <span name="Skill"><input id="skillSwitch" type="checkbox"><l01>其他技能</l01><l2>Skills</l2></span>',
      '  <span name="Scroll"><input id="scrollSwitch" type="checkbox"><l0>卷轴</l0><l1>捲軸</l1><l2>Scroll</l2></span>',
      '  <span name="Infusion"><input id="infusionSwitch" type="checkbox"><l0>魔药</l0><l1>魔藥</l1><l2>Infusion</l2></span>',
      '  <span name="Alarm"><l0>警报</l0><l1>警報</l1><l2>Alarm</l2></span>',
      '  <span name="Rule"><l0>攻击规则</l0><l1>攻擊規則</l1><l2>Attack Rule</l2></span>',
      '  <span name="Drop"><input id="dropMonitor" type="checkbox"><l0>掉落监测</l0><l1>掉落監測</l1><l2>Drops Tracking</l2></span>',
      '  <span name="Usage"><input id="recordUsage" type="checkbox"><l0>数据记录</l0><l1>數據記錄</l1><l2>Usage Tracking</l2></span>',
      '  <span name="About"><l0>关于本脚本</l0><l1>關於本腳本</l1><l2>About This</l2></span>',
      '  <span name="Feedback"><l01>反馈</l01><l2>Feedback</l2></span></div>',
      '<div class="hvAATab" id="hvAATab-Main">',
      '  <div class="hvAACenter">',
      '    Gem: Health.<input class="hvAANumber" name="hp1" placeholder="50" type="text">%',
      '    Mana.<input class="hvAANumber" name="mp1" placeholder="70" type="text">%%',
      '    Spirt.<input class="hvAANumber" name="sp1" placeholder="75" type="text">%</div>',
      '  <div class="hvAACenter" id="attackStatus" style="color:red;"><b>*<l0>攻击模式</l0><l1>攻擊模式</l1><l2>Attack Mode</l2></b>:',
      '    <select class="hvAANumber" name="attackStatus"><option value="-1"></option><option value="0">物理 / Physical</option><option value="1">火 / Fire</option><option value="2">冰 / Cold</option><option value="3">雷 / Elec</option><option value="4">风 / Wind</option><option value="5">圣 / Divine</option><option value="6">暗 / Forbidden</option></select></div>',
      "  <div><b><l0>暂停相关</l0><l1>暫停相關</l1><l2>Pause with</l2></b>: ",
      '    <input id="pauseButton" type="checkbox"><label for="pauseButton"><l0>使用按钮</l0><l1>使用按鈕</l1><l2>Button</l2></label>; ',
      '    <input id="pauseHotkey" type="checkbox"><label for="pauseHotkey"><l0>使用热键</l0><l1>使用熱鍵</l1><l2>Hotkey</l2>: <input name="pauseHotkeyStr" style="width:30px;" type="text"><input name="pauseHotkeyKey" type="hidden" disabled="true"></label></div>',
      "  <div><b><l0>警告相关</l0><l1>警告相關</l1><l2>To Warn</l2></b>: ",
      '    <input id="alert" type="checkbox"><label for="alert"><l0>音频警报</l0><l1>音頻警報</l1><l2>Audio Alarms</l2></label>; ',
      '    <input id="notification" type="checkbox"><label for="notification"><l0>桌面通知</l0><l1>桌面通知</l1><l2>Notifications</l2></label> ',
      '    <button class="testNotification"><l0>预处理</l0><l1>預處理</l1><l2>Pretreat</l2></button></div>',
      "  <div><b><l01>内置插件</l01><l2>Built-in Plugin</l2></b>: ",
      '    <input id="riddleRadio" type="checkbox"><label for="riddleRadio">RiddleLimiter Plus</label>; ',
      '    <input id="encounter" type="checkbox"><label for="encounter"><l0>自动遭遇战</l0><l1>自動遭遇戰</l1><l2>Auto Encounter</l2></label></div>',
      '  <div><b><l01>魔法技能</l01><l2>Offensive Magic</l2></b>: → <a class="hvAAGoto" name="hvAATab-Spell"><l0>法术攻击</l0><l1>法術攻擊</l1><l2>Spell</l2></a></div>',
      '  <div><input id="turnOnSS" type="checkbox"><label for="turnOnSS"><b><l0>开启</l0><l1>開啟</l1><l2>Turn on </l2>Spirit Stance</b></label>: {{turnOnSSCondition}}</div>',
      '  <div><input id="turnOffSS" type="checkbox"><label for="turnOffSS"><b><l0>关闭</l0><l1>關閉</l1><l2>Turn off </l2>Spirit Stance</b></label>: {{turnOffSSCondition}}</div>',
      '  <div><input id="preCastSS" type="checkbox"><label for="preCastSS"><b><l0>释放Buff/Debuff前开启Spirit Stance</l0><l1>釋放Buff/Debuff前開啟Spirit Stance</l1><l2>Activate Spirit Stance before Buff/Debuff</l2></b></label>: {{preCastSSCondition}}</div>',
      '  <div><input id="defend" type="checkbox"><label for="defend"><b>Defend</b></label>: {{defendCondition}}</div>',
      '  <div><input id="focus" type="checkbox"><label for="focus"><b>Focus</b></label>: {{focusCondition}}</div>',
      "  <div><l2>If the page </l2><b><l0>页面停留</l0><l1>頁面停留</l1><l2>stays idle</l2></b><l2> for </l2>: ",
      '    <input id="delayAlert" type="checkbox"><label for="delayAlert"><input class="hvAANumber" name="delayAlertTime" type="text"><l0>秒，警报</l0><l1>秒，警報</l1><l2>s, alarm</l2></label>; ',
      '    <input id="delayReload" type="checkbox"><label for="delayReload"><input class="hvAANumber" name="delayReloadTime" type="text"><l0>秒，刷新页面</l0><l1>秒，刷新頁面</l1><l2>s, reload page</l2></label></div>',
      '  <div><l0>当<b>小马答题</b>时间</l0><l1>當<b>小馬答題</b>時間</l1><l2>If <b>RIDDLE</b> ETR</l2><l0></l0><l1></l1><l2></l2> ≤ <input class="hvAANumber" name="riddleAnswerTime" placeholder="3" type="text"><l0>秒，如果输入框为空则随机生成答案并提交</l0><l1>秒，如果輸入框為空則隨機生成答案並提交</l1><l2>s and no answer has been chosen yet, a random answer will be generated and submitted</l2></div>',
      "  <div><l0>当<b>小马答题</b>时</l0><l1>當<b>小馬答題</b>時</l1><l2>If <b>RIDDLE</b></l2>: ",
      '    <input id="riddlePopup" type="checkbox"><label for="riddlePopup"><l0>弹窗答题</l0><l1>弹窗答题</l1><l2>POPUP a window to answer</l2></label>; <button class="testPopup"><l0>预处理</l0><l1>預處理</l1><l2>Pretreat</l2></button></div>',
      '  <div><b>Stamina</b>: <l0>当损失</l0><l1>當損失</l1><l2>If it lost </l2>Stamina ≥ <input class="hvAANumber" name="staminaLose" placeholder="5" type="text">: ',
      '    <input id="staminaPause" type="checkbox"><label for="staminaPause"><l0>脚本暂停</l0><l1>腳本暫停</l1><l2>pause script</l2></label>; ',
      '    <input id="staminaWarn" type="checkbox"><label for="staminaWarn"><l01>警告</l01><l2>warn</l2></label>; ',
      '    <input id="staminaFlee" type="checkbox"><label for="staminaFlee"><l01>逃跑</l01><l2>flee</l2></label>',
      '    <button class="staminaLostLog"><l0>stamina损失日志</l0><l1>stamina損失日誌</l1><l2>staminaLostLog</l2></button></div>',
      '  <div><input id="idleArena" type="checkbox"><label for="idleArena"><b><l0>闲置竞技场</l0><l1>閒置競技場</l1><l2>Idle Arena</l2></b>: ',
      '    <l0>在任意页面停留</l0><l1>在任意頁面停留</l1><l2>Idle in any page for </l2><input class="hvAANumber" name="idleArenaTime" type="text"><l0>秒后，开始竞技场</l0><l1>秒後，開始競技場</l1><l2>s, start Arena</l2></label> <button class="idleArenaReset"><l01>重置</l01><l2>Reset</l2></button>;<br>',
      "    <l0>进行的竞技场相对应等级</l0><l1>進行的競技場相對應等級</l1><l2>The levels of the Arena you want to complete</l2>:  ",
      '      <button class="hvAAShowLevels"><l0>显示更多</l0><l1>顯示更多</l1><l2>Show more</l2></button><button class="hvAALevelsClear"><l01>清空</l01><l2>Clear</l2></button><br>',
      '      <input name="idleArenaLevels" style="width:98%;" type="text" disabled="true"><input name="idleArenaValue" style="width:98%;" type="hidden" disabled="true">',
      '      <div class="hvAAArenaLevels">',
      '        <input id="arLevel_1" value="1,1" type="checkbox"><label for="arLevel_1">1</label> <input id="arLevel_10" value="10,3" type="checkbox"><label for="arLevel_10">10</label> <input id="arLevel_20" value="20,5" type="checkbox"><label for="arLevel_20">20</label> <input id="arLevel_30" value="30,8" type="checkbox"><label for="arLevel_30">30</label> <input id="arLevel_40" value="40,9" type="checkbox"><label for="arLevel_40">40</label> <input id="arLevel_50" value="50,11" type="checkbox"><label for="arLevel_50">50</label> <input id="arLevel_60" value="60,12" type="checkbox"><label for="arLevel_60">60</label> <input id="arLevel_70" value="70,13" type="checkbox"><label for="arLevel_70">70</label> <input id="arLevel_80" value="80,15" type="checkbox"><label for="arLevel_80">80</label> <input id="arLevel_90" value="90,16" type="checkbox"><label for="arLevel_90">90</label> <input id="arLevel_100" value="100,17" type="checkbox"><label for="arLevel_100">100</label> <input id="arLevel_110" value="110,19" type="checkbox"><label for="arLevel_110">110</label><br>',
      '        <input id="arLevel_120" value="120,20" type="checkbox"><label for="arLevel_120">120</label> <input id="arLevel_130" value="130,21" type="checkbox"><label for="arLevel_130">130</label> <input id="arLevel_140" value="140,23" type="checkbox"><label for="arLevel_140">140</label> <input id="arLevel_150" value="150,24" type="checkbox"><label for="arLevel_150">150</label> <input id="arLevel_165" value="165,26" type="checkbox"><label for="arLevel_165">165</label> <input id="arLevel_180" value="180,27" type="checkbox"><label for="arLevel_180">180</label> <input id="arLevel_200" value="200,28" type="checkbox"><label for="arLevel_200">200</label> <input id="arLevel_225" value="225,29" type="checkbox"><label for="arLevel_225">225</label> <input id="arLevel_250" value="250,32" type="checkbox"><label for="arLevel_250">250</label> <input id="arLevel_300" value="300,33" type="checkbox"><label for="arLevel_300">300</label> <input id="arLevel_400" value="400,34" type="checkbox"><label for="arLevel_400">400</label> <input id="arLevel_500" value="500,35" type="checkbox"><label for="arLevel_500">500</label><br>',
      '        <input id="arLevel_RB50" value="RB50,105" type="checkbox"><label for="arLevel_RB50">RB50</label> <input id="arLevel_RB75A" value="RB75A,106" type="checkbox"><label for="arLevel_RB75A">RB75A</label> <input id="arLevel_RB75B" value="RB75B,107" type="checkbox"><label for="arLevel_RB75B">RB75B</label> <input id="arLevel_RB75C" value="RB75C,108" type="checkbox"><label for="arLevel_RB75C">RB75C</label><br>',
      '        <input id="arLevel_RB100" value="RB100,109" type="checkbox"><label for="arLevel_RB100">RB100</label> <input id="arLevel_RB150" value="RB150,110" type="checkbox"><label for="arLevel_RB150">RB150</label> <input id="arLevel_RB200" value="RB200,111" type="checkbox"><label for="arLevel_RB200">RB200</label> <input id="arLevel_RB250" value="RB250,112" type="checkbox"><label for="arLevel_RB250">RB250</label> <input id="arLevel_GF" value="GF,gr" type="checkbox"><label for="arLevel_GF">GrindFest <input class="hvAANumber" name="idleArenaGrTime" placeholder="1" type="text"></label></div></div>',
      '  <div><input id="repair" type="checkbox"><label for="repair"><b><l0>修复装备</l0><l1>修復裝備</l1><l2>Repair Equipment</l2></b></label>: ',
      '    <l0>耐久度</l0><l1>耐久度</l1><l2>Durability</l2> ≤ <input class="hvAANumber" name="repairValue" type="text">%</div>',
      '  <div><input id="etherTap" type="checkbox"><label for="etherTap"><b>Ether Tap</b></label>: {{etherTapCondition}}</div>',
      '  <div><input id="autoFlee" type="checkbox"><label for="autoFlee"><b><l0>自动逃跑</l0><l1>自動逃跑</l1><l2>Flee</l2></b></label>: {{fleeCondition}}</div>',
      '  <div><div class="hvAANew"></div><input id="autoPause" type="checkbox"><label for="autoPause"><b><l0>自动暂停</l0><l1>自動暫停</l1><l2>Pause</l2></b></label>: {{pauseCondition}}</div>',
      '  <div><input id="restoreStamina" type="checkbox"><label for="restoreStamina"><b><l0>战前回复</l0><l1>戰前回复</l1><l2>Restore stamina</l2></b>: ',
      '    <l0>战斗前，如果</l0><l1>戰鬥前，如果</l1><l2><b></b>if before a battle and </l2>Stamina ≤ <input class="hvAANumber" name="staminaLow" placeholder="30" type="text"></label><br>',
      "    <l0>说明: 如果不勾选，当Stamina小于此值后，则不进行闲置竞技场</l0><l1>說明: 如果不勾選，當Stamina小於此值後，則不進行閒置競技場</l1><l2>Note: If unchecked, when Stamina is less than this value, no Idle Arena</l2></div>",
      '  <div><input id="recordEach" type="checkbox"><label for="recordEach"><b><l0>单独记录每场战役</l0><l1>單獨記錄每場戰役</l1><l2>Record each battle separately</l2></b></label></div>',
      '  <div><b><l0>延迟</l0><l1>延遲</l1><l2>Delay</l2></b>: 1. <l0>其他/Buff/Debuff技能</l0><l1>其他/Buff/Debuff技能</l1><l2>Skills&BUFF/DEBUFF Spells</l2>: <input class="hvAANumber" name="delay" placeholder="200" type="text">ms 2. <l01>其他</l01><l2>Other</l2>: <input class="hvAANumber" name="delay2" placeholder="30" type="text">ms<br>',
      "    <l0>说明: 单位毫秒，且在设定值基础上取其的50%-150%进行延迟，0表示不延迟</l0><l1>說明: 單位毫秒，且在設定值基礎上取其的50%-150%進行延遲，0表示不延遲</l1><l2>Note: unit milliseconds, and based on the set value multiply 50% -150% to delay, 0 means no delay</l2>",
      "    </div>",
      "  </div>",
      '<div class="hvAATab" id="hvAATab-Spell">',
      '  <div><l0>当<a class="hvAAGoto" name="hvAATab-Main"><b>攻击模式</b></a>为法术时生效</l0><l1>當<a class="hvAAGoto" name="hvAATab-Main"><b>攻擊模式</b></a>為法術時生效</l1><l2>Active when <a class="hvAAGoto" name="hvAATab-Main"><b>Attack Mode</b></a> is set to a spell element</l2></div>',
      '  <div><b><l0>高阶技能使用条件</l0><l1>高階技能使用條件</l1><l2>Conditions for 3rd Tier</l2></b>: {{highSkillCondition}}</div>',
      '  <div><b><l0>中阶技能使用条件</l0><l1>中階技能使用條件</l1><l2>Conditions for 2nd Tier</l2></b>: {{middleSkillCondition}}</div>',
      '  <div><l0>T1: 无条件限制，始终可用</l0><l1>T1: 無條件限制，始終可用</l1><l2>T1: No condition, always available</l2></div>',
      '  <div><input id="channelForceHighTier" type="checkbox" checked data-default-on>',
      '    <label for="channelForceHighTier"><b>Channeling <l0>强制最高阶</l0><l1>強制最高階</l1><l2>Force Highest Tier</l2></b></label>:',
      '    <l0>Channeling 时 (150% 伤害, 1 MP) 跳过条件检查，使用最高可用阶法术</l0><l1>Channeling 時 (150% 傷害, 1 MP) 跳過條件檢查，使用最高可用階法術</l1><l2>During Channeling (150% dmg, 1 MP), skip condition checks and use highest available tier</l2></div>',
      '  <div><input id="spellTierDowngrade" type="checkbox" checked data-default-on>',
      '    <label for="spellTierDowngrade"><b><l0>少怪降级</l0><l1>少怪降級</l1><l2>Few Monsters Downgrade</l2></b></label>:',
      '    <l0>存活怪物</l0><l1>存活怪物</l1><l2>Alive monsters</l2> ≤ <input class="hvAANumber" name="spellDowngradeThreshold" placeholder="3" type="text">',
      '    <l0>时仅用 T1 节省 MP (Channeling 时不降级)</l0><l1>時僅用 T1 節省 MP (Channeling 時不降級)</l1><l2>: use T1 only to save MP (does not apply during Channeling)</l2></div>',
      '  <div><b>AoE</b>:',
      '    <l0>访问</l0><l1>訪問</l1><l2>Visit</l2> <a href="?s=Character&ss=ab" target="_blank"><l0>技能页面</l0><l1>技能頁面</l1><l2>Ability Page</l2></a>',
      '    <l0>自动检测法术 AoE 目标数</l0><l1>自動檢測法術 AoE 目標數</l1><l2>to auto-detect spell AoE target counts</l2></div></div>',
      '<div class="hvAATab" id="hvAATab-Item">',
      '  <div class="itemOrder"><l0>施放顺序</l0><l1>施放順序</l1><l2>Cast Order</l2>: <input name="itemOrderName" style="width:80%;" type="text" disabled="true"><input name="itemOrderValue" style="width:80%;" type="hidden" disabled="true"><br>',
      '    <input id="itemOrder_Cure" value="Cure,311" type="checkbox"><label for="itemOrder_Cure">Cure</label><input id="itemOrder_FC" value="FC,313" type="checkbox"><label for="itemOrder_FC">Full-Cure</label><input id="itemOrder_HP" value="HP,11195" type="checkbox"><label for="itemOrder_HP">Health Potion</label><input id="itemOrder_HE" value="HE,11199" type="checkbox"><label for="itemOrder_HE">Health Elixir</label><input id="itemOrder_MP" value="MP,11295" type="checkbox"><label for="itemOrder_MP">Mana Potion</label><br>',
      '    <input id="itemOrder_ME" value="ME,11299" type="checkbox"><label for="itemOrder_ME">Mana Elixir</label><input id="itemOrder_SP" value="SP,11395" type="checkbox"><label for="itemOrder_SP">Spirit Potion</label><input id="itemOrder_SE" value="SE,11399" type="checkbox"><label for="itemOrder_SE">Spirit Elixir</label><input id="itemOrder_LE" value="LE,11501" type="checkbox"><label for="itemOrder_LE">Last Elixir</label><input id="itemOrder_ED" value="ED,11401" type="checkbox"><label for="itemOrder_ED">Energy Drink</label></div>',
      '  <div><input id="item_Cure" type="checkbox"><label for="item_Cure"><b>Cure</b></label>: {{itemCureCondition}}</div>',
      '  <div><input id="item_FC" type="checkbox"><label for="item_FC"><b>Full-Cure</b></label>: {{itemFCCondition}}</div>',
      '  <div><input id="item_HP" type="checkbox"><label for="item_HP"><b>Health Potion</b></label>: {{itemHPCondition}}</div>',
      '  <div><input id="item_HE" type="checkbox"><label for="item_HE"><b>Health Elixir</b></label>: {{itemHECondition}}</div>',
      '  <div><input id="item_MP" type="checkbox"><label for="item_MP"><b>Mana Potion</b></label>: {{itemMPCondition}}</div>',
      '  <div><input id="item_ME" type="checkbox"><label for="item_ME"><b>Mana Elixir</b></label>: {{itemMECondition}}</div>',
      '  <div><input id="item_SP" type="checkbox"><label for="item_SP"><b>Spirit Potion</b></label>: {{itemSPCondition}}</div>',
      '  <div><input id="item_SE" type="checkbox"><label for="item_SE"><b>Spirit Elixir</b></label>: {{itemSECondition}}</div>',
      '  <div><input id="item_LE" type="checkbox"><label for="item_LE"><b>Last Elixir</b></label>: {{itemLECondition}}</div>',
      '  <div><input id="item_ED" type="checkbox"><label for="item_ED"><b>Energy Drink</b></label>: {{itemEDCondition}}</div></div>',
      '<div class="hvAATab" id="hvAATab-Channel">',
      "  <l0><b>获得Channel时</b>（此时1点MP施法与150%伤害）</l0><l1><b>獲得Channel時</b>（此時1點MP施法與150%傷害）</l1><l2><b>During Channeling effect</b> (1 mp spell cost and 150% spell damage)</l2>:",
      "  <div><b><l0>先施放Channel技能</l0><l1>先施放Channel技能</l1><l2>First cast</l2></b>: <br>",
      '    <l0>注意: 此处的施放顺序与</l0><l1>注意: 此處的施放順序与</l1><l2>Note: The cast order here is the same as in</l2><a class="hvAAGoto" name="hvAATab-Buff">BUFF<l01>技能</l01><l2> Spells</l2></a><l0>里的相同</l0><l1>裡的相同</l1><br>',
      '    <input id="channelSkill_Pr" type="checkbox"><label for="channelSkill_Pr">Protection</label><input id="channelSkill_SL" type="checkbox"><label for="channelSkill_SL">Spark of Life</label><input id="channelSkill_SS" type="checkbox"><label for="channelSkill_SS">Spirit Shield</label><input id="channelSkill_Ha" type="checkbox"><label for="channelSkill_Ha">Haste</label><br>',
      '    <input id="channelSkill_AF" type="checkbox"><label for="channelSkill_AF">Arcane Focus</label><input id="channelSkill_He" type="checkbox"><label for="channelSkill_He">Heartseeker</label><input id="channelSkill_Re" type="checkbox"><label for="channelSkill_Re">Regen</label><input id="channelSkill_SV" type="checkbox"><label for="channelSkill_SV">Shadow Veil</label><input id="channelSkill_Ab" type="checkbox"><label for="channelSkill_Ab">Absorb</label></div>',
      '  <div><input id="channelSkill2" type="checkbox"><label for="channelSkill2"><l0><b>再使用技能</b></label>: ',
      '    <div class="channelSkill2Order"><l0>施放顺序</l0><l1>施放順序</l1><l2>Cast Order</l2>: <input name="channelSkill2OrderName" style="width:80%;" type="text" disabled="true"><input name="channelSkill2OrderValue" style="width:80%;" type="hidden" disabled="true"><br>',
      '    <input id="channelSkill2Order_Cu" value="Cu,311" type="checkbox"><label for="channelSkill2Order_Cu">Cure</label><input id="channelSkill2Order_FC" value="FC,313" type="checkbox"><label for="channelSkill2Order_FC">Full-Cure</label><input id="channelSkill2Order_Pr" value="Pr,411" type="checkbox"><label for="channelSkill2Order_Pr">Protection</label><input id="channelSkill2Order_SL" value="SL,422" type="checkbox"><label for="channelSkill2Order_SL">Spark of Life</label><input id="channelSkill2Order_SS" value="SS,423" type="checkbox"><label for="channelSkill2Order_SS">Spirit Shield</label><input id="channelSkill2Order_Ha" value="Ha,412" type="checkbox"><label for="channelSkill2Order_Ha">Haste</label><br>',
      '    <input id="channelSkill2Order_AF" value="AF,432" type="checkbox"><label for="channelSkill2Order_AF">Arcane Focus</label><input id="channelSkill2Order_He" value="He,431" type="checkbox"><label for="channelSkill2Order_He">Heartseeker</label><input id="channelSkill2Order_Re" value="Re,312" type="checkbox"><label for="channelSkill2Order_Re">Regen</label><input id="channelSkill2Order_SV" value="SV,413" type="checkbox"><label for="channelSkill2Order_SV">Shadow Veil</label><input id="channelSkill2Order_Ab" value="Ab,421" type="checkbox"><label for="channelSkill2Order_Ab">Absorb</label></div></div>',
      "  <div><l0><b>最后ReBuff</b>: 重新施放最先消失的Buff</l0><l1><b>最後ReBuff</b>: 重新施放最先消失的Buff</l1><l2><b>At last, re-cast the spells which will expire first</b></l2>.</div></div>",
      '<div class="hvAATab" id="hvAATab-Buff">{{buffSkillCondition}}',
      '  <div class="buffSkillOrder"><l0>施放顺序</l0><l1>施放順序</l1><l2>Cast Order</l2>: ',
      '    <input name="buffSkillOrderValue" style="width:80%;" type="text" disabled="true"><br>',
      '    <input id="buffSkillOrder_Pr" type="checkbox"><label for="buffSkillOrder_Pr">Protection</label><input id="buffSkillOrder_SL" type="checkbox"><label for="buffSkillOrder_SL">Spark of Life</label><input id="buffSkillOrder_SS" type="checkbox"><label for="buffSkillOrder_SS">Spirit Shield</label><input id="buffSkillOrder_Ha" type="checkbox"><label for="buffSkillOrder_Ha">Haste</label><br>',
      '    <input id="buffSkillOrder_AF" type="checkbox"><label for="buffSkillOrder_AF">Arcane Focus</label><input id="buffSkillOrder_He" type="checkbox"><label for="buffSkillOrder_He">Heartseeker</label><input id="buffSkillOrder_Re" type="checkbox"><label for="buffSkillOrder_Re">Regen</label><input id="buffSkillOrder_SV" type="checkbox"><label for="buffSkillOrder_SV">Shadow Veil</label><input id="buffSkillOrder_Ab" type="checkbox"><label for="buffSkillOrder_Ab">Absorb</label></div>',
      "  <div><l0>Buff不存在就施放的技能</l0><l1>Buff不存在就施放的技能</l1><l2>Cast spells if the buff is not present</l2>: ",
      '    <div><input id="buffSkill_HD" type="checkbox"><label for="buffSkill_HD">Health Draught</label>{{buffSkillHDCondition}}</div>',
      '    <div><input id="buffSkill_MD" type="checkbox"><label for="buffSkill_MD">Mana Draught</label>{{buffSkillMDCondition}}</div>',
      '    <div><input id="buffSkill_SD" type="checkbox"><label for="buffSkill_SD">Spirit Draught</label>{{buffSkillSDCondition}}</div>',
      '    <div><input id="buffSkill_FV" type="checkbox"><label for="buffSkill_FV">Flower Vase</label>{{buffSkillFVCondition}}</div>',
      '    <div><input id="buffSkill_BG" type="checkbox"><label for="buffSkill_BG">Bubble-Gum</label>{{buffSkillBGCondition}}</div>',
      '    <div><input id="buffSkill_Pr" type="checkbox"><label for="buffSkill_Pr">Protection</label>{{buffSkillPrCondition}}</div>',
      '    <div><input id="buffSkill_SL" type="checkbox"><label for="buffSkill_SL">Spark of Life</label>{{buffSkillSLCondition}}</div>',
      '    <div><input id="buffSkill_SS" type="checkbox"><label for="buffSkill_SS">Spirit Shield</label>{{buffSkillSSCondition}}</div>',
      '    <div><input id="buffSkill_Ha" type="checkbox"><label for="buffSkill_Ha">Haste</label>{{buffSkillHaCondition}}</div>',
      '    <div><input id="buffSkill_AF" type="checkbox"><label for="buffSkill_AF">Arcane Focus</label>{{buffSkillAFCondition}}</div>',
      '    <div><input id="buffSkill_He" type="checkbox"><label for="buffSkill_He">Heartseeker</label>{{buffSkillHeCondition}}</div>',
      '    <div><input id="buffSkill_Re" type="checkbox"><label for="buffSkill_Re">Regen</label>{{buffSkillReCondition}}</div>',
      '    <div><input id="buffSkill_SV" type="checkbox"><label for="buffSkill_SV">Shadow Veil</label>{{buffSkillSVCondition}}</div>',
      '    <div><input id="buffSkill_Ab" type="checkbox"><label for="buffSkill_Ab">Absorb</label>{{buffSkillAbCondition}}</div></div></div>',
      '<div class="hvAATab" id="hvAATab-Debuff">',
      '  <div class="debuffSkillOrder"><l0>施放顺序</l0><l1>施放順序</l1><l2>Cast Order</l2>:',
      '    <input name="debuffSkillOrderValue" style="width:80%;" type="text" disabled="true"><br>',
      '    <input id="debuffSkillOrder_Sle" type="checkbox"><label for="debuffSkillOrder_Sle">Sleep</label><input id="debuffSkillOrder_Bl" type="checkbox"><label for="debuffSkillOrder_Bl">Blind</label><input id="debuffSkillOrder_Slo" type="checkbox"><label for="debuffSkillOrder_Slo">Slow</label><br>',
      '    <input id="debuffSkillOrder_Im" type="checkbox"><label for="debuffSkillOrder_Im">Imperil</label><input id="debuffSkillOrder_MN" type="checkbox"><label for="debuffSkillOrder_MN">MagNet</label><input id="debuffSkillOrder_Si" type="checkbox"><label for="debuffSkillOrder_Si">Silence</label><input id="debuffSkillOrder_Dr" type="checkbox"><label for="debuffSkillOrder_Dr">Drain</label><input id="debuffSkillOrder_We" type="checkbox"><label for="debuffSkillOrder_We">Weaken</label><input id="debuffSkillOrder_Co" type="checkbox"><label for="debuffSkillOrder_Co">Confuse</label></div>',
      '  <div><l01>特殊</l01><l2>Special</l2><input id="debuffSkillAllIm" type="checkbox"><label for="debuffSkillAllIm"><l0>给所有敌人上Imperil</l0><l1>給所有敵人上Imperil</l1><l2>Imperiled all enemies.</l2></label></div>{{debuffSkillImpCondition}}',
      '  <div><l01>特殊</l01><l2>Special</l2><input id="debuffSkillAllWk" type="checkbox"><label for="debuffSkillAllWk"><l0>给所有敌人上Weaken</l0><l1>給所有敵人上Weaken</l1><l2>Weakened all enemies.</l2></label></div>{{debuffSkillWkCondition}}',
      '    <div><input id="debuffSkill_Sle" type="checkbox"><label for="debuffSkill_Sle">Sleep</label>{{debuffSkillSleCondition}}</div>',
      '    <div><input id="debuffSkill_Bl" type="checkbox"><label for="debuffSkill_Bl">Blind</label>{{debuffSkillBlCondition}}</div>',
      '    <div><input id="debuffSkill_Slo" type="checkbox"><label for="debuffSkill_Slo">Slow</label>{{debuffSkillSloCondition}}</div>',
      '    <div><input id="debuffSkill_Im" type="checkbox"><label for="debuffSkill_Im">Imperil</label>{{debuffSkillImCondition}}</div>',
      '    <div><input id="debuffSkill_MN" type="checkbox"><label for="debuffSkill_MN">MagNet</label>{{debuffSkillMNCondition}}</div>',
      '    <div><input id="debuffSkill_Si" type="checkbox"><label for="debuffSkill_Si">Silence</label>{{debuffSkillSiCondition}}</div>',
      '    <div><input id="debuffSkill_Dr" type="checkbox"><label for="debuffSkill_Dr">Drain</label>{{debuffSkillDrCondition}}</div>',
      '    <div><input id="debuffSkill_We" type="checkbox"><label for="debuffSkill_We">Weaken</label>{{debuffSkillWeCondition}}</div>',
      '    <div><input id="debuffSkill_Co" type="checkbox"><label for="debuffSkill_Co">Confuse</label>{{debuffSkillCoCondition}}</div>',
      '  <div>AoE: <l0>当前技能等级下影响的目标数(1=单体, 3=范围)</l0><l1>當前技能等級下影響的目標數(1=單體, 3=範圍)</l1><l2>Targets affected at current skill level (1=single, 3=AoE)</l2><br>',
      '    Sleep: <input class="hvAANumber" name="debuffSkillAoe_Sle" placeholder="1" type="text"> Blind: <input class="hvAANumber" name="debuffSkillAoe_Bl" placeholder="1" type="text"> Slow: <input class="hvAANumber" name="debuffSkillAoe_Slo" placeholder="1" type="text"><br>',
      '    Imperil: <input class="hvAANumber" name="debuffSkillAoe_Im" placeholder="1" type="text"> MagNet: <input class="hvAANumber" name="debuffSkillAoe_MN" placeholder="1" type="text"> Silence: <input class="hvAANumber" name="debuffSkillAoe_Si" placeholder="1" type="text"><br>',
      '    Drain: <input class="hvAANumber" name="debuffSkillAoe_Dr" placeholder="1" type="text"> Weaken: <input class="hvAANumber" name="debuffSkillAoe_We" placeholder="1" type="text"> Confuse: <input class="hvAANumber" name="debuffSkillAoe_Co" placeholder="1" type="text"> </div>',
      '  <div><l0>持续</l0><l1>持續</l1><l2>Expire</l2> Turns: <input id="debuffSkillTurnAlert" type="checkbox"><label for="debuffSkillTurnAlert"><l0>无法正常施放DEBUFF技能时，警报</l0><l1>無法正常施放DEBUFF技能時，警報</l1><l2>If it can not cast de-skills normally, alert.</l2></label><br>',
      '    Sleep: <input class="hvAANumber" name="debuffSkillTurn_Sle" type="text"> Blind: <input class="hvAANumber" name="debuffSkillTurn_Bl" type="text"> Slow: <input class="hvAANumber" name="debuffSkillTurn_Slo" type="text"><br>',
      '    Imperil: <input class="hvAANumber" name="debuffSkillTurn_Im" type="text"> MagNet: <input class="hvAANumber" name="debuffSkillTurn_MN" type="text"> Silence: <input class="hvAANumber" name="debuffSkillTurn_Si" type="text"><br>',
      '    Drain: <input class="hvAANumber" name="debuffSkillTurn_Dr" type="text"> Weaken: <input class="hvAANumber" name="debuffSkillTurn_We" type="text"> Confuse: <input class="hvAANumber" name="debuffSkillTurn_Co" type="text"> </div></div>',
      '<div class="hvAATab" id="hvAATab-Skill">',
      '  <div><span><l0>注意: 默认在Spirit状态下使用，请在<a class="hvAAGoto" name="hvAATab-Main">主要选项</a>勾选并设置<b>开启/关闭Spirit Stance</b></l0><l1>注意: 默認在Spirit狀態下使用，請在<a class="hvAAGoto" name="hvAATab-Main">主要選項</a>勾選並設置<b>開啟/關閉Spirit Stance</b></l1><l2>Note: use under Spirit by default, please check and set the <b>Turn on/off Spirit Stance</b> in <a class="hvAAGoto" name="hvAATab-Main">Main</a></l2></span></div>',
      '  <div class="skillOrder"><l0>施放顺序</l0><l1>施放順序</l1><l2>Cast Order</l2>: ',
      '  <input name="skillOrderValue" style="width:80%;" type="text" disabled="true"><br>',
      '  <input id="skillOrder_OFC" type="checkbox"><label for="skillOrder_OFC"><l0>友情小马砲</l0><l1>友情小馬砲</l1><l2>OFC</l2></label><input id="skillOrder_FRD" type="checkbox"><label for="skillOrder_FRD"><l0>龙吼</l0><l1>龍吼</l1><l2>FRD</l2></label><input id="skillOrder_T3" type="checkbox"><label for="skillOrder_T3">T3</label><input id="skillOrder_T2" type="checkbox"><label for="skillOrder_T2">T2</label><input id="skillOrder_T1" type="checkbox"><label for="skillOrder_T1">T1</label></div>',
      '  <div><input id="skill_OFC" type="checkbox"><label for="skill_OFC"><l0>友情小马砲</l0><l1>友情小馬砲</l1><l2>OFC</l2></label>: <input id="skillOTOS_OFC" type="checkbox"><label for="skillOTOS_OFC"><l01>一回合只使用一次</l01><l2>One round only spell one time</l2></label>{{skillOFCCondition}}</div>',
      '  <div><input id="skill_FRD" type="checkbox"><label for="skill_FRD"><l0>龙吼</l0><l1>龍吼</l1><l2>FRD</l2></label>: <input id="skillOTOS_FRD" type="checkbox"><label for="skillOTOS_FRD"><l01>一回合只使用一次</l01><l2>One round only spell one time</l2></label>{{skillFRDCondition}}</div>',
      '  <div><l0>战斗风格</l0><l1>戰鬥風格</l1><l2>Fighting style</l2>: <select name="fightingStyle"><option value="1">二天一流 / Niten Ichiryu</option><option value="2">单手 / One-Handed</option><option value="3">双手 / 2-Handed Weapon</option><option value="4">双持 / Dual Wielding</option><option value="5">法杖 / Staff</option></select></div>',
      '  <div><input id="skill_T3" type="checkbox"><label for="skill_T3"><l0>3阶（如果有）</l0><l1>3階（如果有）</l1><l2>T3(if exist)</l2></label>: <input id="skillOTOS_T3" type="checkbox"><label for="skillOTOS_T3"><l01>一回合只使用一次</l01><l2>One round only spell one time</l2></label><br><input id="mercifulBlow" type="checkbox"><label for="mercifulBlow">Merciful Blow: <l0>优先攻击满足条件的敌人 (25% HP, 流血)</l0><l1>優先攻擊滿足條件的敵人 (25% HP, 流血)</l1><l2>Attack the enemy which has 25% HP and is bleeding first</l2></label>{{skillT3Condition}}</div>',
      '  <div><input id="skill_T2" type="checkbox"><label for="skill_T2"><l0>2阶（如果有）</l0><l1>2階（如果有）</l1><l2>T2(if exist)</l2></label>: <input id="skillOTOS_T2" type="checkbox"><label for="skillOTOS_T2"><l01>一回合只使用一次</l01><l2>One round only spell one time</l2></label>{{skillT2Condition}}</div>',
      '  <div><input id="skill_T1" type="checkbox"><label for="skill_T1"><l0>1阶</l0><l1>1階</l1><l2>T1</l2></label>: <input id="skillOTOS_T1" type="checkbox"><label for="skillOTOS_T1"><l01>一回合只使用一次</l01><l2>One round only spell one time</l2></label>{{skillT1Condition}}</div>',
      '  <div><input id="physicalSkillDowngrade" type="checkbox" checked data-default-on>',
      '    <label for="physicalSkillDowngrade"><b><l0>少怪降级</l0><l1>少怪降級</l1><l2>Few Monsters Downgrade</l2></b></label>:',
      '    <l0>存活怪物</l0><l1>存活怪物</l1><l2>Alive monsters</l2> ≤ <input class="hvAANumber" name="physicalDowngradeThreshold" placeholder="3" type="text">',
      '    <l0>时跳过 OFC/FRD 全体攻击节省 OC (流派技能总伤害不受怪物数影响, 不跳过)</l0><l1>時跳過 OFC/FRD 全體攻擊節省 OC (流派技能總傷害不受怪物數影響, 不跳過)</l1><l2>: skip OFC/FRD to save OC (style skills total damage unaffected by monster count, not skipped)</l2></div>',
      '  <div>AoE: <l0>当前技能等级下影响的目标数(1=单体, 3=范围)，访问</l0><l1>當前技能等級下影響的目標數(1=單體, 3=範圍)，訪問</l1><l2>Targets affected at current skill level (1=single, 3=AoE), visit </l2><a href="?s=Character&ss=ab" target="_blank"><l0>技能页面</l0><l1>技能頁面</l1><l2>Ability Page</l2></a><l0>自动检测</l0><l1>自動檢測</l1><l2> to auto-detect</l2><br>',
      '    Fire: T1:<input class="hvAANumber" name="spellAoe_11" placeholder="1" type="text"> T2:<input class="hvAANumber" name="spellAoe_12" placeholder="1" type="text"> T3:<input class="hvAANumber" name="spellAoe_13" placeholder="1" type="text"><br>',
      '    Cold: T1:<input class="hvAANumber" name="spellAoe_21" placeholder="1" type="text"> T2:<input class="hvAANumber" name="spellAoe_22" placeholder="1" type="text"> T3:<input class="hvAANumber" name="spellAoe_23" placeholder="1" type="text"><br>',
      '    Elec: T1:<input class="hvAANumber" name="spellAoe_31" placeholder="1" type="text"> T2:<input class="hvAANumber" name="spellAoe_32" placeholder="1" type="text"> T3:<input class="hvAANumber" name="spellAoe_33" placeholder="1" type="text"><br>',
      '    Wind: T1:<input class="hvAANumber" name="spellAoe_41" placeholder="1" type="text"> T2:<input class="hvAANumber" name="spellAoe_42" placeholder="1" type="text"> T3:<input class="hvAANumber" name="spellAoe_43" placeholder="1" type="text"><br>',
      '    Holy: T1:<input class="hvAANumber" name="spellAoe_51" placeholder="1" type="text"> T2:<input class="hvAANumber" name="spellAoe_52" placeholder="1" type="text"> T3:<input class="hvAANumber" name="spellAoe_53" placeholder="1" type="text"><br>',
      '    Dark: T1:<input class="hvAANumber" name="spellAoe_61" placeholder="1" type="text"> T2:<input class="hvAANumber" name="spellAoe_62" placeholder="1" type="text"> T3:<input class="hvAANumber" name="spellAoe_63" placeholder="1" type="text"></div></div>',
      '<div class="hvAATab" id="hvAATab-Scroll">',
      "  <l0>战役模式</l0><l1>戰役模式</l1><l2>Battle type</l2>: ",
      '  <input id="scrollRoundType_ar" type="checkbox"><label for="scrollRoundType_ar">The Arena</label><input id="scrollRoundType_rb" type="checkbox"><label for="scrollRoundType_rb">Ring of Blood</label><input id="scrollRoundType_gr" type="checkbox"><label for="scrollRoundType_gr">GrindFest</label><input id="scrollRoundType_iw" type="checkbox"><label for="scrollRoundType_iw">Item World</label><input id="scrollRoundType_ba" type="checkbox"><label for="scrollRoundType_ba">Encounter</label><input id="scrollRoundType_tw" type="checkbox"><label for="scrollRoundType_tw">The Tower</label>{{scrollCondition}}',
      '  <input id="scrollFirst" type="checkbox"><label for="scrollFirst"><l0>存在技能生成的Buff时，仍然使用卷轴</l0><l1>存在技能生成的Buff時，仍然使用捲軸</l1><l2>Use Scrolls even when there are effects from spells</l2>.</label>',
      '  <div><input id="scroll_Go" type="checkbox"><label for="scroll_Go">Scroll of the Gods</label>{{scrollGoCondition}}</div>',
      '  <div><input id="scroll_Av" type="checkbox"><label for="scroll_Av">Scroll of the Avatar</label>{{scrollAvCondition}}</div>',
      '  <div><input id="scroll_Pr" type="checkbox"><label for="scroll_Pr">Scroll of Protection</label>{{scrollPrCondition}}</div>',
      '  <div><input id="scroll_Sw" type="checkbox"><label for="scroll_Sw">Scroll of Swiftness</label>{{scrollSwCondition}}</div>',
      '  <div><input id="scroll_Li" type="checkbox"><label for="scroll_Li">Scroll of Life</label>{{scrollLiCondition}}</div>',
      '  <div><input id="scroll_Sh" type="checkbox"><label for="scroll_Sh">Scroll of Shadows</label>{{scrollShCondition}}</div>',
      '  <div><input id="scroll_Ab" type="checkbox"><label for="scroll_Ab">Scroll of Absorption</label>{{scrollAbCondition}}</div></div>',
      '<div class="hvAATab" id="hvAATab-Infusion">',
      '  <l0>注意：魔药属性与</l0><l1>注意：魔藥屬性與</l1><l2>Note: The style of infusion is the same as Attack Mode in </l2><a class="hvAAGoto" name="hvAATab-Main"><l0>主要选项</l0><l1>主要選項</l1><l2>Main</l2></a><l0>里的攻击模式相同</l0><l1>裡的攻擊模式相同</l1><l2></l2><br>{{infusionCondition}}</div>',
      '<div class="hvAATab" id="hvAATab-Alarm">',
      '  <span class="hvAATitle"><l0>自定义警报</l0><l1>自定義警報</l1><l2>Alarm</l2></span><br>',
      "  <l0>注意：留空则使用默认音频，建议每个用户使用自定义音频</l0><l1>注意：留空則使用默認音頻，建議每個用戶使用自定義音頻</l1><l2>Note: Leave the box blank to use default audio, it's recommended for all user to use custom audio.</l2>",
      '  <div><input id="audioEnable_Common" type="checkbox"><label for="audioEnable_Common"><l01>通用</l01><l2>Common</l2>: <input name="audio_Common" type="text"></label><br><input id="audioEnable_Error" type="checkbox"><label for="audioEnable_Error"><l0>错误</l0><l1>錯誤</l1><l2>Error</l2>: <input name="audio_Error" type="text"></label><br><input id="audioEnable_Defeat" type="checkbox"><label for="audioEnable_Defeat"><l0>失败</l0><l1>失敗</l1><l2>Defeat</l2>: <input name="audio_Defeat" type="text"></label><br><input id="audioEnable_Riddle" type="checkbox"><label for="audioEnable_Riddle"><l0>答题</l0><l1>答題</l1><l2>Riddle</l2>: <input name="audio_Riddle" type="text"></label><br><input id="audioEnable_Victory" type="checkbox"><label for="audioEnable_Victory"><l0>胜利</l0><l1>勝利</l1><l2>Victory</l2>: <input name="audio_Victory" type="text"></label></div>',
      '  <div><l0>请将将要测试的音频文件的地址填入这里</l0><l1>請將將要測試的音頻文件的地址填入這裡</l1><l2>Plz put in the audio file address you want to test</l2>: <br><input class="hvAADebug" name="audio_Text" type="text"></div></div>',
      '<div class="hvAATab" id="hvAATab-Rule">',
      '  <span class="hvAATitle"><l0>攻击规则</l0><l1>攻擊規則</l1><l2>Attack Rule</l2></span> <l01><a href="https://github.com/dodying/UserJs/blob/master/HentaiVerse/hvAutoAttack/README.md#攻击规则-示例" target="_blank">示例</a></l01><l2><a href="https://github.com/dodying/UserJs/blob/master/HentaiVerse/hvAutoAttack/README_en.md#attack-rule-example" target="_blank">Example</a></l2>',
      "  <div>1. <l0>每回合计算敌人当前血量，血量最低的设置初始血量为10，其他敌人为当前血量倍数*10</l0><l1>每回合計算敌人當前血量，血量最低的設置初始血量為10，其他敌人為當前血量倍數*10</l1><l2>Each enemiy is assigned a number which is used to determine the target to attack, let's call that number Priority Weight or PW.</l2></div>",
      "  <div>2. <l0>初始权重与下述各Buff权重相加</l0><l1>初始權重與下述各Buff權重相加</l1><l2>PW(X) = 10 * HP(X) / Min_HP + Accumulated_Weight_of_Deprecating_Spells_In_Effect(X)</l2><br>",
      '    Sleep: <input class="hvAANumber" name="weight_Sle" placeholder="5" type="text"> Blind: <input class="hvAANumber" name="weight_Bl" placeholder="3" type="text"> Slow: <input class="hvAANumber" name="weight_Slo" placeholder="3" type="text"> Imperil: <input class="hvAANumber" name="weight_Im" placeholder="-5" type="text"><br>',
      '    MagNet: <input class="hvAANumber" name="weight_MN" placeholder="-4" type="text"> Silence: <input class="hvAANumber" name="weight_Si" placeholder="-4" type="text"> Drain: <input class="hvAANumber" name="weight_Dr" placeholder="-4" type="text"> Weaken: <input class="hvAANumber" name="weight_We" placeholder="-4" type="text"><br>',
      '    Confuse: <input class="hvAANumber" name="weight_Co" placeholder="-1" type="text"> Coalesced Mana: <input class="hvAANumber" name="weight_CM" placeholder="-5" type="text"><br>',
      '    Stunned: <input class="hvAANumber" name="weight_Stun" placeholder="-4" type="text"> Penetrated Armor: <input class="hvAANumber" name="weight_PA" placeholder="-4" type="text"> Bleeding Wound: <input class="hvAANumber" name="weight_BW" placeholder="-4" type="text"></div>',
      '  <div>3. <input id="ruleReverse" type="checkbox"><label for="ruleReverse"><l0>计算出最终权重，攻击权重最小/最大的敌人(勾选: 最大)</l0><l1>計算出最終權重，攻擊權重最小/最大的敌人(勾選: 最大)</l1><l2>Whichever enemy has the lowest/highest PW will be the target. (ON means highest)</l2></label></div>',
      '  <div>PS. <l0>如果你对各Buff权重有特别见解，请务必</l0><l1>如果你對各Buff權重有特別見解，請務必</l1><l2>If you have any suggestions, please </l2><a class="hvAAGoto" name="hvAATab-Feedback"><l0>告诉我</l0><l1>告訴我</l1><l2>let me know</l2></a>.</div></div>',
      '<div class="hvAATab hvAACenter" id="hvAATab-Drop">',
      '  <span class="hvAATitle"><l0>掉落监测</l0><l1>掉落監測</l1><l2>Drops Tracking</l2></span><button class="reDropMonitor"><l01>重置</l01><l2>Reset</l2></button>',
      '  <div><l0>记录装备的最低品质</l0><l1>記錄裝備的最低品質</l1><l2>Minimum drop quality</l2>: <select name="dropQuality"><option value="0">Crude</option><option value="1">Fair</option><option value="2">Average</option><option value="3">Superior</option><option value="4">Exquisite</option><option value="5">Magnificent</option><option value="6">Legendary</option><option value="7">Peerless</option></select></div>',
      "  <table></table></div>",
      '<div class="hvAATab hvAACenter" id="hvAATab-Usage">',
      '  <span class="hvAATitle"><l0>数据记录</l0><l1>數據記錄</l1><l2>Usage Tracking</l2></span><button class="reRecordUsage"><l01>重置</l01><l2>Reset</l2></button>',
      "  <table></table></div>",
      '<div class="hvAATab hvAACenter" id="hvAATab-About">',
      '  <div><span class="hvAATitle"><l0>当前状况</l0><l1>當前狀況</l1><l2>Current status</l2></span>: ',
      '    <l0>如果脚本长期暂停且网络无问题，请点击</l0><l1>如果腳本長期暫停且網絡無問題，請點擊</l1><l2>If the script does not work and you are sure that it\'s not because of your internet, click</l2><button class="hvAAFix"><l0>尝试修复</l0><l1>嘗試修復</l1><l2>Try to fix</l2></button><br>',
      '    <l0>战役模式</l0><l1>戰役模式</l1><l2>Battle type</l2>: <select class="hvAADebug" name="roundType"><option></option><option value="ar">The Arena</option><option value="rb">Ring of Blood</option><option value="gr">GrindFest</option><option value="iw">Item World</option><option value="ba">Encounter</option><option value="tw">The Tower</option></select> <l0>当前回合</l0><l1>當前回合</l1><l2>Current round</l2>: <input name="roundNow" class="hvAADebug hvAANumber" placeholder="1" type="text"> <l0>总回合</l0><l1>總回合</l1><l2>Total rounds</l2>: <input name="roundAll" class="hvAADebug hvAANumber" placeholder="1" type="text"></div>',
      '  <div class="hvAAQuickSite"><span class="hvAATitle"><l0>快捷站点</l0><l1>快捷站點</l1><l2>Quick Site</l2></span><button class="quickSiteAdd"><l01>新增</l01><l2>Add</l2></button><br>',
      '    <l0>注意: 留空“姓名”一栏则表示删除该行，修改后请保存</l0><l1>注意: 留空“姓名”一欄則表示刪除該行，修改後請保存</l1><l2>Note: The "name" input box left blank will be deleted, after change please save in time.</l2>',
      '    <table><tbody><tr class="hvAATh"><td><l0>图标</l0><l1>圖標</l1><l2>ICON</l2></td><td><l0>名称</l0><l1>名稱</l1><l2>Name</l2></td><td><l0>链接</l0><l1>鏈接</l1><l2>Link</l2></td></tr></tbody></table></div>',
      '  <div><span class="hvAATitle"><l0>备份与还原</l0><l1>備份與還原</l1><l2>Backup and Restore</l2></span><button class="hvAABackup"><l0>备份设置</l0><l1>備份設置</l1><l2>Backup Confiuration</l2></button><button class="hvAARestore"><l0>还原设置</l0><l1>還原設置</l1><l2>Restore Confiuration</l2></button><button class="hvAADelete"><l0>删除设置</l0><l1>刪除設置</l1><l2>Delete Confiuration</l2></button><ul class="hvAABackupList"></ul></div>',
      '  <div><span class="hvAATitle"><l0>导入与导出</l0><l1>導入與導出</l1><l2>Import and Export</l2></span><button class="hvAAExport"><l0>导出设置</l0><l1>導出設置</l1><l2>Export Confiuration</l2></button><button class="hvAAImport"><l0>导入设置</l0><l1>導入設置</l1><l2>Import Confiuration</l2></button><textarea class="hvAAConfig"></textarea></div></div>',
      '<div class="hvAATab" id="hvAATab-Feedback">',
      '  <span class="hvAATitle"><l01>反馈</l01><l2>Feedback</l2></span>',
      '  <div><l0>链接</l0><l1>鏈接</l1><l2>Links</l2>: <a href="https://github.com/dodying/UserJs/issues/new" target="_blank">1. GitHub</a><a href="https://greasyfork.org/forum/post/discussion?script=18482" target="_blank">2. GreasyFork</a></div>',
      '  <div><span class="hvAATitle"><l0>反馈说明</l0><l1>反饋說明</l1><l2>Feedback Note</l2></span>: <br>',
      "    <l0>如果你遇见了Bug，想帮助作者修复它<br>你应当提供以下多种资料: <br>1. 场景描述<br>2. 你的配置<br>3. 控制台日志 (按Ctrl+Shift+i打开开发者助手，再选择Console(控制台)面板)<br>4. 战斗日志  (如果是在战斗中)<br>如果是无法容忍甚至使脚本失效的Bug，请尝试安装旧版本<hr>如果你有一些建议使这个脚本更加有用，那么: <br>1. 请尽量简述你的想法<br>2. 如果可以，请提供一些场景 (方便作者更好理解)</l0>",
      "    <l1>如果你遇見了Bug，想幫助作者修復它<br>你應當提供以下多種資料: <br>1. 場景描述<br>2. 你的配置<br>3. 控制台日誌 (按Ctrl+Shift+i打開開發者助手，再選擇Console(控制台)面板)<br>4. 戰鬥日誌 (如果是在戰鬥中)<br>如果是無法容忍甚至使腳本失效的Bug，請嘗試安裝舊版本<hr>如果你有一些建議使這個腳本更加有用，那麼: <br>1. 請盡量簡述你的想法<br>2.如果可以，請提供一些場景 (方便作者更好理解)</l1>",
      "    <l2>If you encounter a bug and would like to help the author fix it<br>You should provide the following information: <br>1. the Situation<br>2. Your Configuration<br>3. Console Log (press Ctrl + Shift + i to open the Developer Assistant, And then select the Console panel)<br>4. Battle Log (if in combat)<br>If you are unable to tolerate this bug or even the bug made the script fail, try installing the old version<hr>If you have some suggestions to make this script more useful, then: <br>1. Please briefly describe your thoughts<br>2. If you can, please provide some scenes (to facilitate the author to better understand)<br>PS. For English user, please express in basic English (Oh my poor English, thanks for Google Translate)</l2></div></div>",
      "</div>",
      '<div class="hvAAButtonBox hvAACenter">',
      '  <button class="hvAAReset"><l0>重置设置</l0><l1>重置設置</l1><l2>Reset</l2></button><button class="hvAAApply"><l0>应用</l0><l1>應用</l1><l2>Apply</l2></button><button class="hvAACancel"><l01>取消</l01><l2>Cancel</l2></button></div>',
    ]
      .join("")
      .replace(/{{(.*?)}}/g, '<div class="customize" name="$1"></div>');
    // 绑定事件
    gE('select[name="lang"]', optionBox).onchange = function () {
      // 选择语言
      gE(
        ".hvAA-LangStyle"
      ).textContent = `l${this.value}{display:inline!important;}`;
      if (/^[01]$/.test(this.value))
        gE(".hvAA-LangStyle").textContent += "l01{display:inline!important;}";
      g("lang", this.value);
    };
    gE(".hvAATabmenu", optionBox).onclick = function (e) {
      // 标签页事件
      if (e.target.tagName === "INPUT") return;
      const target =
        e.target.tagName === "SPAN" ? e.target : e.target.parentNode;
      const name = target.getAttribute("name");
      let i;
      let _html;
      if (name === "Drop") {
        // 掉落监测
        let drop = getValue("drop", true) || {};
        const dropOld = getValue("dropOld", true) || [];
        drop = objSort(drop);
        _html = "<tbody>";
        if (
          dropOld.length === 0 ||
          (dropOld.length === 1 && !getValue("drop", true))
        ) {
          if (dropOld.length === 1) drop = dropOld[0];
          _html = `${_html}<tr class="hvAATh"><td></td><td><l0>数量</l0><l1>數量</l1><l2>Amount</l2></td></tr>`;
          for (i in drop) {
            _html = `${_html}<tr><td>${i}</td><td>${drop[i]}</td></tr>`;
          }
        } else {
          if (getValue("drop")) {
            drop.__name = getValue("battleCode");
            dropOld.push(drop);
          }
          dropOld.reverse();
          _html = `${_html}<tr class="hvAATh"><td class="selectTable"></td>`;
          dropOld.forEach((_dropOld) => {
            _html = `${_html}<td>${_dropOld.__name}</td>`;
          });
          _html = `${_html}</tr>`;
          getKeys(dropOld).forEach((key) => {
            if (key === "__name") return;
            _html = `${_html}<tr><td>${key}</td>`;
            dropOld.forEach((_dropOld) => {
              if (key in _dropOld) {
                _html = `${_html}<td>${_dropOld[key]}</td>`;
              } else {
                _html = `${_html}<td></td>`;
              }
            });
            _html = `${_html}</tr>`;
          });
        }
        _html = `${_html}</tbody>`;
        gE("#hvAATab-Drop>table").innerHTML = _html;
      } else if (name === "Usage") {
        // 数据记录
        let stats = getValue("stats", true) || {};
        const statsOld = getValue("statsOld", true) || [];
        const translation = {
          self: "<l0>自身 (次数)</l0><l1>自身 (次數)</l1><l2>Self (Frequency)</l2>",
          restore:
            "<l0>回复 (总量)</l0><l1>回复 (總量)</l1><l2>Restore (Amount)</l2>",
          items:
            "<l0>物品 (次数)</l0><l1>物品 (次數)</l1><l2>Items (Frequency)</l2>",
          magic:
            "<l0>技能 (次数)</l0><l1>技能 (次數)</l1><l2>Magic (Frequency)</l2>",
          damage:
            "<l0>伤害 (总量)</l0><l1>傷害 (總量)</l1><l2>Damage (Amount)</l2>",
          hurt: "<l0>受伤 (总量)</l0><l1>受傷 (總量)</l1><l2>Loss (Amount)</l2>",
          proficiency:
            "<l0>熟练度 (总量)</l0><l1>熟練度 (總量)</l1><l2>Proficiency (Amount)</l2>",
        };
        _html = "<tbody>";
        if (
          statsOld.length === 0 ||
          (statsOld.length === 1 && !getValue("stats", true))
        ) {
          if (statsOld.length === 1) stats = statsOld[0];
          for (i in stats) {
            _html = `${_html}<tr class="hvAATh"><td>${translation[i]}</td><td><l01>值</l01><l2>Value</l2></td></tr>`;
            stats[i] = objSort(stats[i]);
            for (const j in stats[i]) {
              _html = `${_html}<tr><td>${j}</td><td>${stats[i][j]}</td></tr>`;
            }
          }
        } else {
          if (getValue("stats")) {
            stats.__name = getValue("battleCode");
            statsOld.push(stats);
          }
          statsOld.reverse();
          _html = `${_html}<tr class="hvAATh"><td class="selectTable"></td>`;
          statsOld.forEach((_dropOld) => {
            _html = `${_html}<td>${_dropOld.__name}</td>`;
          });
          _html = `${_html}</tr>`;
          Object.keys(translation).forEach((i) => {
            if (i === "__name") return;
            _html = `${_html}<tr class="hvAATh"><td colspan="${
              statsOld.length + 1
            }">${translation[i]}</td></tr>`;
            getKeys(statsOld, i).forEach((key) => {
              _html = `${_html}<tr><td>${key}</td>`;
              statsOld.forEach((_statsOld) => {
                if (key in _statsOld[i]) {
                  _html = `${_html}<td>${_statsOld[i][key]}</td>`;
                } else {
                  _html = `${_html}<td></td>`;
                }
              });
            });
          });
        }
        _html = `${_html}</tbody>`;
        gE("#hvAATab-Usage>table").innerHTML = _html;
      } else if (name === "About") {
        // 关于本脚本
        gE(".hvAADebug", "all", optionBox).forEach((input) => {
          if (getValue(input.name)) input.value = getValue(input.name);
        });
      }
      if (name === "Drop" || name === "Usage") {
        gE(".selectTable", "all", optionBox).forEach((i) => {
          i.onclick = null;
          i.onclick = function (e) {
            const select = window.getSelection();
            select.removeAllRanges();
            const range = document.createRange();
            range.selectNodeContents(e.target.parentNode.parentNode.parentNode);
            select.addRange(range);
          };
        });
      }
      gE(".hvAATab", "all", optionBox).forEach((i) => {
        i.style.display = i.id === `hvAATab-${name}` ? "block" : "none";
      });
    };
    gE(".hvAAGoto", "all", optionBox).forEach((i) => {
      i.onclick = function () {
        gE(
          `.hvAATabmenu>span[name="${this.name.replace("hvAATab-", "")}"]`
        ).click();
      };
    });

    function updateGroup() {
      const group = gE(".customizeGroup", "all", g("customizeTarget"));
      const customizeBox = gE(".customizeBox");
      if (
        group.length + 1 ===
        gE('select[name="groupChoose"]>option', "all", customizeBox).length
      )
        return;
      gE('select[name="groupChoose"]', customizeBox).textContent = "";
      for (let i = 0; i <= group.length; i++) {
        const option = gE(
          'select[name="groupChoose"]',
          customizeBox
        ).appendChild(cE("option"));
        if (i === group.length) {
          option.value = "new";
          option.textContent = "new";
        } else {
          option.value = i + 1;
          option.textContent = i + 1;
        }
      }
    }
    optionBox.onmousemove = function (e) {
      // 自定义条件相关事件
      const target =
        e.target.className === "customize"
          ? e.target
          : e.target.parentNode.className === "customize"
          ? e.target.parentNode
          : e.target.parentNode.parentNode;
      if (!gE(".customizeBox")) customizeBox();
      updateGroup();
      if (
        target.className !== "customize" &&
        target.parentNode.className !== "customize"
      ) {
        if (!target.className.match("customize"))
          gE(".customizeBox").style.zIndex = -1;
        return;
      }
      g("customizeTarget", target);
      const position = target.getBoundingClientRect();
      gE(".customizeBox").style.zIndex = 5;
      gE(".customizeBox").style.top = `${position.bottom + window.scrollY}px`;
      gE(".customizeBox").style.left = `${position.left + window.scrollX}px`;
    };
    // 标签页-主要选项
    gE('input[name="pauseHotkeyStr"]', optionBox).onkeyup = function (e) {
      this.value = /^[a-z]$/.test(e.key) ? e.key.toUpperCase() : e.key;
      gE('input[name="pauseHotkeyKey"]', optionBox).value = e.key;
    };
    gE(".testNotification", optionBox).onclick = function () {
      _alert(
        0,
        "接下来开始预处理。\n如果询问是否允许，请选择允许",
        "接下來開始預處理。\n如果詢問是否允許，請選擇允許",
        "Now, pretreat.\nPlease allow to receive notifications if you are asked for permission"
      );
      setNotification("Test");
    };
    gE(".testPopup", optionBox).onclick = function () {
      _alert(
        0,
        "接下来开始预处理。\n关闭本警告框之后，请切换到其他标签页，\n并在足够长的时间后再打开本标签页",
        "接下來開始預處理。\n關閉本警告框之後，請切換到其他標籤頁，\n並在足夠長的時間後再打開本標籤頁",
        "Now, pretreat.\nAfter dismissing this alert, focus other tab,\nfocus this tab again after long time."
      );
      setTimeout(() => {
        const riddleWindow = window.open(
          window.location.href,
          "riddleWindow",
          "resizable,scrollbars,width=1241,height=707"
        );
        if (riddleWindow) {
          setTimeout(() => {
            riddleWindow.close();
          }, 200);
        }
      }, 3000);
    };
    gE(".staminaLostLog", optionBox).onclick = function () {
      const out = [];
      const staminaLostLog = getValue("staminaLostLog", true);
      for (const i in staminaLostLog) {
        out.push(`${i}: ${staminaLostLog[i]}`);
      }
      if (
        window.confirm(
          `总共${out.length}条记录 (There are ${out.length} logs): \n${out
            .reverse()
            .join("\n")}\n是否重置 (Whether to reset)?`
        )
      )
        setValue("staminaLostLog", {});
    };
    gE(".idleArenaReset", optionBox).onclick = function () {
      if (_alert(1, "是否重置", "是否重置", "Whether to reset"))
        delValue("arena");
    };
    gE(".hvAAShowLevels", optionBox).onclick = function () {
      gE(".hvAAArenaLevels").style.display =
        gE(".hvAAArenaLevels").style.display === "block" ? "none" : "block";
    };
    gE(".hvAALevelsClear", optionBox).onclick = function () {
      gE('[name="idleArenaLevels"]', optionBox).value = "";
      gE('[name="idleArenaValue"]', optionBox).value = "";
      gE(".hvAAArenaLevels>input", "all", optionBox).forEach((input) => {
        input.checked = false;
      });
    };
    function toggleOrderItem(inputName, item, checked) {
      const el = gE(`input[name="${inputName}"]`);
      if (checked) {
        el.value = el.value + (el.value ? `,${item}` : item);
      } else {
        el.value = el.value
          .replace(new RegExp(`(^|,)${item}(,|$)`), "$2")
          .replace(/^,/, "");
      }
    }
    function makeOrderHandler(nameInput, valueInput) {
      return function (e) {
        if (e.target.tagName !== "INPUT" && e.target.type !== "checkbox") return;
        const valueArray = e.target.value.split(",");
        toggleOrderItem(nameInput, valueArray[0], e.target.checked);
        toggleOrderItem(valueInput, valueArray[1], e.target.checked);
      };
    }
    function makeSingleOrderHandler(valueInput) {
      return function (e) {
        if (e.target.tagName !== "INPUT" && e.target.type !== "checkbox") return;
        const name = e.target.id.match(/_(.*)/)[1];
        toggleOrderItem(valueInput, name, e.target.checked);
      };
    }
    gE(".hvAAArenaLevels", optionBox).onclick = makeOrderHandler("idleArenaLevels", "idleArenaValue");
    // 标签页-物品
    gE(".itemOrder", optionBox).onclick = makeOrderHandler("itemOrderName", "itemOrderValue");
    // 标签页-Channel技能
    gE(".channelSkill2Order", optionBox).onclick = makeOrderHandler("channelSkill2OrderName", "channelSkill2OrderValue");
    // 标签页-BUFF技能
    gE(".buffSkillOrder", optionBox).onclick = makeSingleOrderHandler("buffSkillOrderValue");
    // 标签页-DEBUFF技能
    gE(".debuffSkillOrder", optionBox).onclick = makeSingleOrderHandler("debuffSkillOrderValue");
    // 标签页-其他技能
    gE(".skillOrder", optionBox).onclick = makeSingleOrderHandler("skillOrderValue");
    // 标签页-警报
    gE('input[name="audio_Text"]', optionBox).onchange = function () {
      if (this.value === "") return;
      if (!/^http(s)?:|^ftp:|^data:audio/.test(this.value)) {
        _alert(
          0,
          '地址必须以"http:","https:","ftp:","data:audio"开头',
          '地址必須以"http:","https:","ftp:","data:audio"開頭',
          'The address must start with "http:", "https:", "ftp:", and "data:audio"'
        );
        return;
      }
      _alert(
        0,
        "接下来将测试该音频\n如果该音频无法播放或无法载入，请变更\n请测试完成后再键入另一个音频",
        "接下來將測試該音頻\n如果該音頻無法播放或無法載入，請變更\n請測試完成後再鍵入另一個音頻",
        "The audio will be tested after you close this prompt\nIf the audio doesn't load or play, change the url"
      );
      const box = gE("#hvAATab-Alarm").appendChild(cE("div"));
      box.innerHTML = this.value;
      const audio = box.appendChild(cE("audio"));
      audio.controls = true;
      audio.src = this.value;
      audio.play();
    };
    // 标签页-掉落监测
    gE(".reDropMonitor", optionBox).onclick = function () {
      if (_alert(1, "是否重置", "是否重置", "Whether to reset")) {
        delValue("drop");
        delValue("dropOld");
      }
    };
    // 标签页-数据记录
    gE(".reRecordUsage", optionBox).onclick = function () {
      if (_alert(1, "是否重置", "是否重置", "Whether to reset")) {
        delValue("stats");
        delValue("statsOld");
      }
    };
    // 标签页-关于本脚本
    gE(".hvAAFix", optionBox).onclick = function () {
      gE('.hvAADebug[name^="round"]', "all", optionBox).forEach((input) => {
        setValue(input.name, input.value || input.placeholder);
      });
    };
    gE(".quickSiteAdd", optionBox).onclick = function () {
      const tr = gE(".hvAAQuickSite>table>tbody", optionBox).appendChild(
        cE("tr")
      );
      tr.innerHTML =
        '<td><input class="hvAADebug" type="text"></td><td><input class="hvAADebug" type="text"></td><td><input class="hvAADebug" type="text"></td>';
    };
    gE(".hvAAConfig", optionBox).onclick = function () {
      this.style.height = 0;
      this.style.height = `${this.scrollHeight}px`;
      this.select();
    };
    function rmListItem(code) {
      // 同步删除界面显示对应的项
      const configs = gE(
        '#hvAATab-About > * > ul[class="hvAABackupList"] > li',
        "all"
      );
      for (const config of configs) {
        if (config.textContent == code) {
          config.remove();
        }
      }
    }
    gE(".hvAABackup", optionBox).onclick = function () {
      const code =
        _alert(
          2,
          "请输入当前配置代号",
          "請輸入當前配置代號",
          "Please put in a name for the current configuration"
        ) || time(3);
      const backups = getValue("backup", true) || {};
      if (code in backups) {
        // 覆写同名配置
        if (
          _alert(
            1,
            "是否覆盖已有的同名配置？",
            "是否覆蓋已有的同名配置？",
            "Do you want to overwrite the configuration with the same name?"
          )
        ) {
          delete backups[code];
          rmListItem(code);
        } else return;
      }
      backups[code] = getValue("option");
      setValue("backup", backups);
      const li = gE(".hvAABackupList", optionBox).appendChild(cE("li"));
      li.textContent = code;
    };
    gE(".hvAARestore", optionBox).onclick = function () {
      const code = _alert(
        2,
        "请输入配置代号",
        "請輸入配置代號",
        "Please put in a name for a configuration"
      );
      const backups = getValue("backup", true) || {};
      if (!(code in backups) || !code) return;
      setValue("option", backups[code]);
      goto();
    };
    gE(".hvAADelete", optionBox).onclick = function () {
      const code = _alert(
        2,
        "请输入配置代号",
        "請輸入配置代號",
        "Please put in a name for a configuration"
      );
      const backups = getValue("backup", true) || {};
      if (!(code in backups) || !code) return;
      delete backups[code];
      setValue("backup", backups);
      // goto();
      rmListItem(code);
    };
    gE(".hvAAExport", optionBox).onclick = function () {
      const t = getValue("option");
      gE(".hvAAConfig").value = typeof t === "string" ? t : JSON.stringify(t);
    };
    gE(".hvAAImport", optionBox).onclick = function () {
      let option;
      try {
        option = JSON.parse(gE(".hvAAConfig").value);
      } catch (e) {
        _alert(0, "配置格式错误", "配置格式錯誤", "Invalid configuration format");
        return;
      }
      if (!option) return;
      if (_alert(1, "是否重置", "是否重置", "Whether to reset")) {
        setValue("option", option);
        goto();
      }
    };
    //
    gE(".hvAAReset", optionBox).onclick = function () {
      if (_alert(1, "是否重置", "是否重置", "Whether to reset"))
        delValue("option");
    };
    gE(".hvAAApply", optionBox).onclick = function () {
      if (
        gE('select[name="attackStatus"] option[value="-1"]:checked', optionBox)
      ) {
        _alert(
          0,
          "请选择攻击模式",
          "請選擇攻擊模式",
          "Please select the attack mode"
        );
        gE('.hvAATabmenu>span[name="Main"]').click();
        gE("#attackStatus", optionBox).style.border = "1px solid red";
        setTimeout(() => {
          gE("#attackStatus", optionBox).style.border = "";
        }, 0.5 * 1000);
        return;
      }
      const _option = {
        version: g("version"),
      };
      let inputs = gE("input,select", "all", optionBox);
      let itemName;
      let itemArray;
      let itemValue;
      let i;
      for (i = 0; i < inputs.length; i++) {
        if (inputs[i].className === "hvAADebug") {
          continue;
        } else if (inputs[i].className === "hvAANumber") {
          itemName = inputs[i].name;
          itemValue = (inputs[i].value || inputs[i].placeholder) * 1;
          if (isNaN(itemValue)) continue;
        } else if (inputs[i].type === "text" || inputs[i].type === "hidden") {
          itemName = inputs[i].name;
          itemValue = inputs[i].value || inputs[i].placeholder;
          if (itemValue === "") continue;
        } else if (inputs[i].type === "checkbox") {
          itemName = inputs[i].id;
          itemValue = inputs[i].checked;
          if (itemValue === false && !inputs[i].hasAttribute("data-default-on")) continue;
        } else if (inputs[i].type === "select-one") {
          itemName = inputs[i].name;
          itemValue = inputs[i].value;
        }
        itemArray = itemName.split("_");
        if (itemArray.length === 1) {
          _option[itemName] = itemValue;
        } else {
          if (!(itemArray[0] in _option)) _option[itemArray[0]] = {};
          if (inputs[i].className === "customizeInput") {
            if (typeof _option[itemArray[0]][itemArray[1]] === "undefined")
              _option[itemArray[0]][itemArray[1]] = [];
            _option[itemArray[0]][itemArray[1]].push(itemValue);
          } else {
            _option[itemArray[0]][itemArray[1]] = itemValue;
          }
        }
      }
      inputs = gE('.hvAAQuickSite input[type="text"]', "all", optionBox);
      for (i = 0; 3 * i < inputs.length; i++) {
        if (i === 0 && inputs.length !== 0) _option.quickSite = [];
        if (inputs[3 * i + 1].value === "") continue;
        _option.quickSite.push({
          fav: inputs[3 * i].value,
          name: inputs[3 * i + 1].value,
          url: inputs[3 * i + 2].value,
        });
      }
      setValue("option", _option);
      optionBox.style.display = "none";
      goto();
    };
    gE(".hvAACancel", optionBox).onclick = function () {
      optionBox.style.display = "none";
    };
    if (g("option")) {
      let i;
      let j;
      let k;
      const _option = g("option");
      const inputs = gE("input,select", "all", optionBox);
      let itemName;
      let itemArray;
      let itemValue;
      let _html;
      for (i = 0; i < inputs.length; i++) {
        if (inputs[i].className === "hvAADebug") continue;
        itemName = inputs[i].name || inputs[i].id;
        if (typeof _option[itemName] !== "undefined") {
          itemValue = _option[itemName];
        } else {
          itemArray = itemName.split("_");
          itemValue = "";
          if (
            itemArray.length === 2 &&
            typeof _option[itemArray[0]] === "object" &&
            inputs[i].className !== "hvAACustomize" &&
            typeof _option[itemArray[0]][itemArray[1]] !== "undefined"
          ) {
            itemValue = _option[itemArray[0]][itemArray[1]];
          }
        }
        if (
          inputs[i].type === "text" ||
          inputs[i].type === "hidden" ||
          inputs[i].type === "select-one" ||
          inputs[i].type === "number"
        ) {
          inputs[i].value = itemValue;
        } else if (inputs[i].type === "checkbox") {
          inputs[i].checked = itemValue;
        }
      }
      const defaultOnInputs = gE("input[data-default-on]", "all", optionBox);
      for (const input of defaultOnInputs) {
        if (typeof _option[input.id] === "undefined") input.checked = true;
      }
      const customize = gE(".customize", "all", optionBox);
      for (i = 0; i < customize.length; i++) {
        itemName = customize[i].getAttribute("name");
        if (itemName in _option) {
          for (j in _option[itemName]) {
            const group = customize[i].appendChild(cE("div"));
            group.className = "customizeGroup";
            group.innerHTML = `${j * 1 + 1}. `;
            for (k = 0; k < _option[itemName][j].length; k++) {
              const input = group.appendChild(cE("input"));
              input.type = "text";
              input.className = "customizeInput";
              input.name = `${itemName}_${j}`;
              input.value = _option[itemName][j][k];
            }
          }
        }
      }
      if (_option.quickSite) {
        _html =
          '<tr class="hvAATh"><td><l0>图标</l0><l1>圖標</l1><l2>ICON</l2></td><td><l0>名称</l0><l1>名稱</l1><l2>Name</l2></td><td><l0>链接</l0><l1>鏈接</l1><l2>Link</l2></td></tr>';
        _option.quickSite.forEach((i) => {
          _html = `${_html}<tr><td><input class="hvAADebug" type="text" value="${i.fav}"></td><td><input class="hvAADebug" type="text" value="${i.name}"></td><td><input class="hvAADebug" type="text" value="${i.url}"></td></tr>`;
        });
        gE(".hvAAQuickSite>table>tbody", optionBox).innerHTML = _html;
      }
      if (getValue("backup")) {
        const backups = getValue("backup", true);
        _html = "";
        for (i in backups) {
          _html = `${_html}<li>${i}</li>`;
        }
        gE(".hvAABackupList", optionBox).innerHTML = _html;
      }
    }
  }

  /** 自定义条件界面 */
  function customizeBox() {
    const customizeBox = gE("body").appendChild(cE("div"));
    customizeBox.className = "customizeBox";
    const statusOption = [
      '<option value="hp">hp</option>',
      '<option value="mp">mp</option>',
      '<option value="sp">sp</option>',
      '<option value="oc">oc</option>',
      '<option value="">- - - -</option>',
      '<option value="monsterAll">monsterAll</option>',
      '<option value="monsterAlive">monsterAlive</option>',
      '<option value="bossAll">bossAll</option>',
      '<option value="bossAlive">bossAlive</option>',
      '<option value="">- - - -</option>',
      '<option value="roundNow">roundNow</option>',
      '<option value="roundAll">roundAll</option>',
      '<option value="roundLeft">roundLeft</option>',
      '<option value="roundType">roundType</option>',
      '<option value="attackStatus">attackStatus</option>',
      '<option value="turn">turn</option>',
      '<option value="">- - - -</option>',
      '<option value="_isCd_">isCd</option>',
      '<option value="_buffTurn_">buffTurn</option>',
      '<option value=""></option>',
    ].join("");
    customizeBox.innerHTML = [
      '<span><l01><a href="https://github.com/dodying/UserJs/blob/master/HentaiVerse/hvAutoAttack/README.md#自定义判断条件" target="_blank">?</a></l01><l2><a href="https://github.com/dodying/UserJs/blob/master/HentaiVerse/hvAutoAttack/README_en.md#customize-condition" target="_blank">?</a></l2></span>',
      `<span class="hvAAInspect" title="off">${String.fromCharCode(0x21f1)}</span>`,
      '<select name="groupChoose"></select>',
      `<select name="statusA">${statusOption}</select>`,
      '<select name="compareAB"><option value="1">＞</option><option value="2">＜</option><option value="3">≥</option><option value="4">≤</option><option value="5">＝</option><option value="6">≠</option></select>',
      `<select name="statusB">${statusOption}</select>`,
      '<button class="groupAdd">ADD</button>',
    ].join(" ");
    const funcSelect = function (e) {
      let box;
      if (gE("#hvAAInspectBox")) {
        box = gE("#hvAAInspectBox");
      } else {
        box = gE("body").appendChild(cE("div"));
        box.id = "hvAAInspectBox";
      }
      let { target } = e;
      let find = attr(target);
      while (!find) {
        target = target.parentNode;
        if (target.id === "csp" || target.tagName === "BODY") {
          box.style.display = "none";
          return;
        }
        find = attr(target);
      }
      box.textContent = find;
      box.style.display = "block";
      box.style.left = `${e.pageX - e.offsetX + target.offsetWidth}px`;
      box.style.top = `${e.pageY - e.offsetY + target.offsetHeight}px`;
    };
    gE(".hvAAInspect", customizeBox).onclick = function () {
      if (this.title === "on") {
        this.title = "off";
        gE("#csp").removeEventListener("mousemove", funcSelect);
      } else {
        this.title = "on";
        gE("#csp").addEventListener("mousemove", funcSelect);
      }
    };
    gE(".groupAdd", customizeBox).onclick = function () {
      const target = g("customizeTarget");
      const selects = gE("select", "all", customizeBox);
      let groupChoose = selects[0].value;
      let group;
      if (groupChoose === "new") {
        groupChoose = gE("option", "all", selects[0]).length;
        group = target.appendChild(cE("div"));
        group.className = "customizeGroup";
        group.innerHTML = `${groupChoose}. `;
        selects[0].click();
      } else {
        group = gE(".customizeGroup", "all", target)[groupChoose - 1];
      }
      const input = group.appendChild(cE("input"));
      input.type = "text";
      input.className = "customizeInput";
      input.name = `${target.getAttribute("name")}_${groupChoose - 1}`;
      input.value = `${selects[1].value},${selects[2].value},${selects[3].value}`;
    };

    function attr(target) {
      const onmouseover = target.getAttribute("onmouseover");
      if (target.className === "btsd") {
        return `Skill Id: ${target.id}`;
      }
      if (onmouseover && onmouseover.match("common.show_itemc_box")) {
        return `Item Id: ${onmouseover.match(/(\d+)\)/)[1]}`;
      }
      if (onmouseover && onmouseover.match("equips.set")) {
        return `Equip Id: ${onmouseover.match(/(\d+)/)[1]}`;
      }
      if (onmouseover && onmouseover.match("battle.set_infopane_effect")) {
        return `Buff Img: ${target.src.match(/\/e\/(.*?).png/)[1]}`;
      }
    }
  }

  /** 发出警报 */
  function setAlarm(e) {
    e = e || "Common";
    if (g("option").notification) setNotification(e);
    if (
      g("option").alert &&
      g("option").audioEnable &&
      g("option").audioEnable[e]
    )
      setAudioAlarm(e);
  }

  /** 发出音频警报 */
  function setAudioAlarm(e) {
    let audio;
    if (gE(`#hvAAAlert-${e}`)) {
      audio = gE(`#hvAAAlert-${e}`);
    } else {
      audio = gE("body").appendChild(cE("audio"));
      audio.id = `hvAAAlert-${e}`;
      const fileType = ".ogg"; // var fileType = (/Chrome|Safari/.test(navigator.userAgent)) ? '.mp3' : '.wav';
      audio.src =
        g("option").audio && g("option").audio[e]
          ? g("option").audio[e]
          : `https://gitee.com/dodying/userJs/raw/master/HentaiVerse/hvAutoAttack/${e}${fileType}`;

      audio.controls = true;
      audio.loop = e === "Riddle";
    }
    audio.play();

    function pauseAudio(e) {
      audio.pause();
      document.removeEventListener(e.type, pauseAudio, true);
    }
    document.addEventListener("mousemove", pauseAudio, true);
  }

  /** 设置提示 */
  function setNotification(e) {
    const notifications = [
      {
        Common: { text: "未知", time: 5 },
        Error: { text: "某些错误发生了", time: 10 },
        Defeat: {
          text: "游戏失败\n玩家可自行查看战斗Log寻找失败原因",
          time: 5,
        },
        Riddle: { text: "小马答题\n紧急！\n紧急！\n紧急！", time: 30 },
        Victory: { text: "游戏胜利\n页面将在3秒后刷新", time: 3 },
        Test: { text: "测试文本", time: 3 },
      },
      {
        Common: { text: "未知", time: 5 },
        Error: { text: "某些錯誤發生了", time: 10 },
        Defeat: {
          text: "遊戲失敗\n玩家可自行查看戰鬥Log尋找失敗原因",
          time: 5,
        },
        Riddle: { text: "小馬答題\n緊急！\n緊急！\n緊急！", time: 30 },
        Victory: { text: "遊戲勝利\n頁面將在3秒後刷新", time: 3 },
        Test: { text: "測試文本", time: 3 },
      },
      {
        Common: { text: "unknown", time: 5 },
        Error: { text: "Some errors have occurred", time: 10 },
        Defeat: {
          text: "You have been defeated.\nYou can check the battle log.",
          time: 5,
        },
        Riddle: { text: "Riddle\nURGENT\nURGENT\nURGENT", time: 30 },
        Victory: {
          text: "You're victorious.\nThis page will refresh in 3 seconds.",
          time: 3,
        },
        Test: { text: "testText", time: 3 },
      },
    ];

    const notification = notifications[g("lang")][e];
    const options = {
      body: notification.text,
      icon: `${window.location.origin}/y/hentaiverse.png`,
      tag: "hvNotification",
      requireInteraction: true,
    };

    if (typeof GM_notification !== "undefined") {
      GM_notification({
        text: notification.text,
        title: "HentaiVerse Notification",
        image: options.icon,
        highlight: true,
        timeout: notification.time * 1000,
      });
    }

    if ("Notification" in window && Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          const n = new Notification("HentaiVerse Notification", options);

          setTimeout(() => n.close(), notification.time * 1000);

          const closeNotification = () => {
            n.close();
            document.removeEventListener("mousemove", closeNotification);
          };

          document.addEventListener("mousemove", closeNotification);
        }
      });
    }
  }

  /** 判断条件 */
  function checkCondition(parms) {
    if (typeof parms === "undefined") return true;
    const result = [];
    const returnValue = function (str) {
      if (str.match(/^_/)) {
        const arr = str.split("_");
        return func[arr[1]](...[...arr].splice(2));
      }
      if (str.match(/^'.*?'$|^".*?"$/)) {
        return str.slice(1, -1);
      }
      if (isNaN(str * 1)) {
        return g(str);
      }
      return str * 1;
    };
    const func = {
      isCd(id) {
        return isOn(id) ? 0 : 1;
      },
      buffTurn(img) {
        let buff = gE(`#pane_effects>img[src*="${img}"]`);
        if (!buff) {
          return 0;
        }
        buff =
          buff.getAttribute("onmouseover").match(/\(.*,.*, (.*?)\)$/)[1] * 1;
        return isNaN(buff) ? Infinity : buff;
      },
    };

    const comparators = {
      "1": (a, b) => a > b,
      "2": (a, b) => a < b,
      "3": (a, b) => a >= b,
      "4": (a, b) => a <= b,
      "5": (a, b) => a === b,
      "6": (a, b) => a !== b,
    };

    for (const i in parms) {
      for (let j = 0; j < parms[i].length; j++) {
        if (!Array.isArray(parms[i])) continue;
        let k = parms[i][j].split(",");
        k[0] = returnValue(k[0]);
        k[2] = returnValue(k[2]);
        if (comparators[k[1]]) {
          result[i] = comparators[k[1]](k[0], k[2]);
        }
        if (result[i] === false) j = parms[i].length;
      }
      if (result[i] === true) return true;
    }
    return false;
  }

  /** 答题 */
  function riddleAlert() {
    // 答题警报
    setAlarm("Riddle");

    const answers = ["aj", "fs", "pp", "rd", "ts"];

    const checkTime = function () {
      let time;
      if (typeof g("time") === "undefined") {
        const timeDiv = gE("#riddlecounter>div>div", "all");
        if (timeDiv.length === 0) return;
        time = "";
        for (let j = 0; j < timeDiv.length; j++) {
          time =
            (
              timeDiv[j].style.backgroundPosition.match(/(\d+)px$/)[1] / 12
            ).toString() + time;
        }
        g("time", parseInt(time));
      } else {
        time = g("time");
        time--;
        g("time", time);
      }
      document.title = time;
      if (time <= g("option").riddleAnswerTime)
        riddleSubmit(answers[Math.floor(Math.random() * 5)]);
    };

    for (let i = 0; i < 30; i++) {
      setTimeout(checkTime, i * 1000);
    }

    function riddleSubmit(answer) {
      if (answer.includes("aj")) {
        document.getElementById(
          "riddler1"
        ).children[5].children[0].children[0].checked = true;
      }
      if (answer.includes("fs")) {
        document.getElementById(
          "riddler1"
        ).children[2].children[0].children[0].checked = true;
      }
      if (answer.includes("pp")) {
        document.getElementById(
          "riddler1"
        ).children[4].children[0].children[0].checked = true;
      }
      if (answer.includes("ra")) {
        document.getElementById(
          "riddler1"
        ).children[1].children[0].children[0].checked = true;
      }
      if (answer.includes("rd")) {
        document.getElementById(
          "riddler1"
        ).children[3].children[0].children[0].checked = true;
      }
      if (answer.includes("ts")) {
        document.getElementById(
          "riddler1"
        ).children[0].children[0].children[0].checked = true;
      }

      document.getElementById("riddlesubmit").click();
    }
  }

  /** 快捷站点 */
  function quickSite() {
    const quickSiteBar = gE("body").appendChild(cE("div"));
    quickSiteBar.className = "quickSiteBar";
    quickSiteBar.innerHTML =
      '<span><a href="javascript:void(0);"class="quickSiteBarToggle">&lt;&lt;</a></span><span><a href="http://tieba.baidu.com/f?kw=hv网页游戏"target="_blank"><img src="https://www.baidu.com/favicon.ico" class="favicon"></img>贴吧</a></span><span><a href="https://forums.e-hentai.org/index.php?showforum=76"target="_blank"><img src="https://forums.e-hentai.org/favicon.ico" class="favicon"></img>Forums</a></span>';
    if (g("option").quickSite) {
      g("option").quickSite.forEach((site) => {
        quickSiteBar.innerHTML = `${quickSiteBar.innerHTML}<span title="${
          site.name
        }"><a href="${site.url}"target="_blank">${
          site.fav ? `<img src="${site.fav}"class="favicon"></img>` : ""
        }${site.name}</a></span>`;
      });
    }
    gE(".quickSiteBarToggle", quickSiteBar).onclick = function () {
      const spans = gE("span", "all", quickSiteBar);
      for (let i = 1; i < spans.length; i++) {
        spans[i].style.display = this.textContent === "<<" ? "none" : "block";
      }
      this.textContent = this.textContent === "<<" ? ">>" : "<<";
    };
  }

  /** 闲置竞技场 */
  function idleArena() {
    let arena = getValue("arena", true) || {};
    if (arena.date !== g("dateNow")) {
      arena = {
        date: g("dateNow"),
        gr: g("option").idleArenaGrTime,
        done: [],
        token: {
          length: 0,
        },
      };
      // iframe打开四个网站，设定四个判断值，同时true才继续
      const getToken = function (data, e) {
        if (isIsekai) {
          const postokenInput = gE('input[name="postoken"]', data);
          if (postokenInput) arena.token.postoken = postokenInput.value;
        }
        if (e.target.responseURL.match(/ss=gr$/)) {
          const grImg = gE('img[src*="startgrindfest.png"]', data);
          if (grImg) {
            const match = grImg.getAttribute("onclick")?.match(/init_battle\(\d+,\s*'(.*?)'\)/);
            arena.token.gr = match ? match[1] : true;
          }
        } else {
          gE('img[src*="startchallenge.png"]', "all", data).forEach((_) => {
            const match = _.getAttribute("onclick")?.match(
              /init_battle\((\d+)(?:,\s*\d+(?:,\s*'(.*?)')?)?\)/
            );
            if (match) arena.token[match[1]] = match[2] || true;
          });
        }
        arena.token.length++;
      };
      post("?s=Battle&ss=gr", getToken);
      post("?s=Battle&ss=ar", getToken);
      post("?s=Battle&ss=ar&page=2", getToken);
      post("?s=Battle&ss=rb", getToken);
      const checkOnload = function () {
        if (arena.token.length < 4) {
          setTimeout(checkOnload, 200);
        } else {
          setValue("arena", arena);
          setTimeout(idleArena, 200);
        }
      };
      checkOnload();
      return;
    }
    arena.done = arena.done || [];
    arena.array = g("option").idleArenaValue.split(",").filter((id) =>
      id === "gr" || isNaN(id * 1) ? arena.gr > 0 : !arena.done.includes(id)
    );
    if (arena.array.length === 0) return;
    if (
      g("option").restoreStamina &&
      gE("#stamina_readout .fc4.far>div").textContent.match(/\d+/)[0] * 1 <=
        g("option").staminaLow &&
      gE("#stamina_readout .fc4.far>div").textContent.match(/\d+/)[0] * 1 < 85
    ) {
      post(window.location.href, goto, "recover=stamina");
      return;
    }
    let href;
    let id;
    while (arena.array.length > 0) {
      id = arena.array[0] * 1;
      if (isNaN(id)) {
        href = "gr";
        id = "gr";
      } else if (id >= 105) {
        href = "rb";
      } else if (id >= 19) {
        href = "ar&page=2";
      } else {
        href = "ar";
      }
      if (!(id in arena.token)) {
        arena.array.splice(0, 1);
      } else {
        break;
      }
    }
    if (arena.array.length === 0) {
      setValue("arena", arena);
      return;
    }
    document.title = _alert(
      -1,
      "闲置竞技场",
      "閒置競技場開始",
      "Idle Arena start"
    );
    if (arena.array[0] === "gr" && arena.gr <= 0) {
      arena.array.splice(0, 1);
      setValue("arena", arena);
      idleArena();
      return;
    }
    if (arena.array[0] === "gr" && arena.gr > 0) {
      arena.gr--;
    } else {
      arena.done.push(arena.array[0]);
      arena.array.splice(0, 1);
    }
    setValue("arena", arena);
    const token = arena.token[id];
    if (id === "gr") id = 1;
    post(
      `?s=Battle&ss=${href}`,
      goto,
      isIsekai
        ? `initid=${String(id)}&postoken=${arena.token.postoken}`
        : `initid=${String(id)}&inittoken=${token}`
    );
  }

  /** 每日日常活动 */
  function encounterCheck() {
    const timeNow = time(0);
    const encounter =
      getValue("encounter") &&
      getValue("encounter", true).dateNow === g("dateNow")
        ? getValue("encounter", true)
        : {
            dateNow: g("dateNow"),
            time: 0,
          };
    if (
      !encounter.lastTime ||
      (timeNow - encounter.lastTime >= 30 * 60 * 1000 && encounter.time < 24)
    ) {
      if (
        g("option").restoreStamina &&
        gE("#stamina_readout .fc4.far>div").textContent.match(/\d+/)[0] * 1 <=
          g("option").staminaLow
      ) {
        post(window.location.href, goto, "recover=stamina");
        return;
      }
      encounter.lastTime = timeNow;
      setValue("encounter", encounter);
      openUrl("https://e-hentai.org/news.php?encounter");
      return;
    }
    let lastEncounter;
    if (gE(".lastEncounter")) {
      lastEncounter = gE(".lastEncounter");
    } else {
      lastEncounter = gE("body").appendChild(cE("a"));
      lastEncounter.className = "lastEncounter";
      lastEncounter.title = `${time(3, encounter.lastTime)}\nEncounter TIme: ${
        encounter.time
      }`;
      lastEncounter.href = "https://e-hentai.org/news.php?encounter";
      lastEncounter.onclick = function () {
        if (
          encounter.time >= 24 &&
          _alert(1, "是否重置", "是否重置", "Whether to reset")
        )
          delValue("encounter");
      };
    }
    lastEncounter.innerHTML = `${Math.floor(
      (timeNow - encounter.lastTime) / 1000 / 60
    )}<l0>分钟前</l0><l1>分鐘前</l1><l2> mins before</l2>`;
    setTimeout(
      encounterCheck,
      (1 * 60 * 1000 * (Math.random() * 10 + 95)) / 100
    );
  }

  /** 解析技能页面提取法术 AoE 目标数 */
  function parseAbilityPage() {
    const abilityTop = gE("#ability_top");
    if (!abilityTop) return;
    const spellAoe = {};
    const slots = gE("[onmouseover*='overability']", "all", abilityTop);
    for (const slot of slots) {
      const onmouseover = slot.getAttribute("onmouseover");
      const params = onmouseover.split("','");
      if (params.length < 3) continue;
      const currentEffect = params[2];
      const spellSections = currentEffect.split(/Spells Modified:\s*/);
      for (let i = 1; i < spellSections.length; i++) {
        const section = spellSections[i];
        const nameMatch = section.match(/<strong>(.*?)<\/strong>/);
        if (!nameMatch) continue;
        const aoeMatch = section.match(/Changes max affected targets to (\d+)/);
        if (!aoeMatch) continue;
        spellAoe[nameMatch[1]] = parseInt(aoeMatch[1]);
      }
    }
    console.log("[AoE] 检测结果:", JSON.stringify(spellAoe));
    setValue("spellAoe", spellAoe);
    // 同步自动检测结果到 option，使设置页面 UI 同步显示
    const option = g("option");
    if (option) {
      if (!option.debuffSkillAoe) option.debuffSkillAoe = {};
      DEBUFF_SKILL_LIB.forEach((skill, key) => {
        if (skill.id && spellAoe[skill.name] !== undefined) {
          option.debuffSkillAoe[key] = spellAoe[skill.name];
        }
      });
      if (!option.spellAoe) option.spellAoe = {};
      OFFENSIVE_SPELL_LIB.forEach((name, key) => {
        if (spellAoe[name] !== undefined) {
          option.spellAoe[key] = spellAoe[name];
        }
      });
      setValue("option", option);
      console.log("[AoE] 已同步到 option:", JSON.stringify({ debuffSkillAoe: option.debuffSkillAoe, spellAoe: option.spellAoe }));
    }
  }

  /** 战斗主要逻辑 */
  function main() {
    if (getValue("disabled")) {
      document.title = _alert(
        -1,
        "hvAutoAttack暂停中",
        "hvAutoAttack暫停中",
        "hvAutoAttack Paused"
      );
      gE("#hvAABox2>button").innerHTML =
        "<l0>继续</l0><l1>繼續</l1><l2>Continue</l2>";
      return;
    }

    g("end", false); // 标记未结束,开始循环

    // 获取全部怪物信息
    if (
      getValue("monsterStatus") &&
      getValue("monsterStatus", true).length === g("monsterAll")
    ) {
      g("monsterStatus", getValue("monsterStatus", true));
    } else {
      fixMonsterStatus();
    }

    // 设置轮数
    g("turn", g("turn") + 1);

    // 获取玩家状态
    if (gE("#vbh")) {
      g("hp", (gE("#vbh>div>img").offsetWidth / 500) * 100);
      g("mp", (gE("#vbm>div>img").offsetWidth / 210) * 100);
      g("sp", (gE("#vbs>div>img").offsetWidth / 210) * 100);
      g(
        "oc",
        gE("#vcp>div>div")
          ? (gE("#vcp>div>div", "all").length -
              gE("#vcp>div>div#vcr", "all").length) *
              25
          : 0
      );
    } else {
      g("hp", (gE("#dvbh>div>img").offsetWidth / 414) * 100);
      g("mp", (gE("#dvbm>div>img").offsetWidth / 414) * 100);
      g("sp", (gE("#dvbs>div>img").offsetWidth / 414) * 100);
      g("oc", gE("#dvrc").textContent);
    }

    battleInfo();
    killBug();
    countMonsterHP();

    // 逃跑判断执行
    if (g("option").autoFlee && checkCondition(g("option").fleeCondition)) {
      gE("1001").click();
      setTimeout(goto, 3 * 1000);
      return;
    }

    // 暂停判断执行
    if (g("option").autoPause && checkCondition(g("option").pauseCondition)) {
      pauseChange();
      return;
    }

    // 使用宝石
    if (gE("#ikey_p")) useGem();
    if (g("end")) return;

    // 回血回魔
    if (g("option").item && g("option").itemOrderValue) deadSoon();
    if (g("end")) return;

    // 防御判断
    if (g("option").defend && checkCondition(g("option").defendCondition)) {
      gE("#ckey_defend").click();
      return;
    }

    // 卷轴判断
    if (
      g("option").scrollSwitch &&
      g("option").scroll &&
      checkCondition(g("option").scrollCondition) &&
      g("option").scrollRoundType &&
      g("option").scrollRoundType[g("roundType")]
    )
      useScroll();
    if (g("end")) return;

    // 自动魔药判断
    if (
      g("attackStatus") !== 0 &&
      g("option").infusionSwitch &&
      checkCondition(g("option").infusionCondition)
    )
      useInfusions();
    if (g("end")) return;

    // 自动施法Channe判断
    if (
      g("option").channelSkillSwitch &&
      g("option").channelSkill &&
      gE('#pane_effects>img[src*="channeling"]')
    )
      useChannelSkill();
    if (g("end")) return;

    // 自动施法BUFF判断
    if (
      g("option").buffSkillSwitch &&
      g("option").buffSkill &&
      checkCondition(g("option").buffSkillCondition)
    )
      useBuffSkill();
    if (g("end")) return;

    // 敌方全员虚弱判断
    if (
      g("option").debuffSkillSwitch &&
      g("option").debuffSkillAllWk &&
      gE('div.btm6 img[src*="weaken"]', "all").length < g("monsterAlive") &&
      checkCondition(g("option").debuffSkillWkCondition)
    )
      castDebuffOnAll("We");
    if (g("end")) return;

    // 敌方全员易伤判断
    if (
      g("option").debuffSkillSwitch &&
      g("option").debuffSkillAllIm &&
      gE('div.btm6 img[src*="imperil"]', "all").length < g("monsterAlive") &&
      checkCondition(g("option").debuffSkillImpCondition)
    )
      castDebuffOnAll("Im");
    if (g("end")) return;

    // 敌方DEBUFF判断
    if (
      g("option").debuffSkillSwitch &&
      g("option").debuffSkill &&
      checkCondition(g("option").debuffSkillCondition)
    )
      useDeSkill();
    if (g("end")) return;

    // 剩余判断
    attack();
    // if (g('end')) return
  }

  /** 暂停状态更改 */
  function pauseChange() {
    if (getValue("disabled")) {
      if (gE(".pauseChange"))
        gE(".pauseChange").innerHTML =
          "<l0>暂停</l0><l1>暫停</l1><l2>Pause</l2>";
      delValue(0);
      main();
    } else {
      if (gE(".pauseChange"))
        gE(".pauseChange").innerHTML =
          "<l0>继续</l0><l1>繼續</l1><l2>Continue</l2>";
      setValue("disabled", true);
      tagEndToTrue();
    }
  }

  /** 重载页面 */
  function reloader() {
    let delayAlert;
    let delayReload;
    let obj;
    let a;
    let cost;
    const eventStart = cE("a");
    eventStart.id = "eventStart";
    eventStart.onclick = function () {
      a = unsafeWindow.info;
      if (g("option").delayAlert)
        delayAlert = setTimeout(setAlarm, g("option").delayAlertTime * 1000);
      if (g("option").delayReload)
        delayReload = setTimeout(goto, g("option").delayReloadTime * 1000);
      if (g("option").recordUsage) {
        obj = {
          mode: a.mode,
        };
        if (a.mode === "items") {
          const itemEl = gE(
            `#pane_item div[id^="ikey"][onclick*="skill('${a.skill}')"]`
          );
          obj.item = itemEl ? itemEl.textContent : a.skill;
        } else if (a.mode === "magic") {
          const magicEl = gE(a.skill);
          obj.magic = magicEl ? magicEl.textContent : a.skill;
          const onmouseover = magicEl
            ? magicEl.getAttribute("onmouseover")
            : null;
          cost = onmouseover
            ? onmouseover.match(
                /\('.*', '.*', '.*', (\d+), (\d+), \d+\)/
              )
            : null;
          obj.mp = cost ? cost[1] * 1 : 0;
          obj.oc = cost ? cost[2] * 1 : 0;
        }
      }
    };
    gE("body").appendChild(eventStart);
    const eventEnd = cE("a");
    eventEnd.id = "eventEnd";
    eventEnd.onclick = function () {
      const timeNow = time(0);
      g("runSpeed", (1000 / (timeNow - g("timeNow"))).toFixed(2));
      g("timeNow", timeNow);
      if (g("option").delayAlert) clearTimeout(delayAlert);
      if (g("option").delayReload) clearTimeout(delayReload);
      const monsterDead = gE('img[src*="nbardead"]', "all").length;
      g("monsterAlive", g("monsterAll") - monsterDead);
      const bossDead = gE(
        'div.btm1[style*="opacity"] div.btm2[style*="background"]',
        "all"
      ).length;
      g("bossAlive", g("bossAll") - bossDead);
      const battleLog = gE("#textlog>tbody>tr>td", "all");
      if (g("option").recordUsage) {
        obj.log = battleLog;
        recordUsage(obj);
      }
      if (gE("#btcp")) {
        if (g("option").dropMonitor) dropMonitor(battleLog);
        if (g("option").recordUsage) recordUsage2();
        if (g("monsterAlive") > 0) {
          // Defeat
          setAlarm("Defeat");
          delValue(2);
        } else if (g("roundNow") !== g("roundAll")) {
          // Next Round
          gE("#pane_completion").removeChild(gE("#btcp"));
          post(window.location.href, (data) => {
            if (gE("#riddlecounter", data)) {
              if (g("option").riddlePopup && !window.opener) {
                window.open(
                  window.location.href,
                  "riddleWindow",
                  "resizable,scrollbars,width=1241,height=707"
                );
                return;
              }
              goto();
              return;
            }
            gE("#battle_main").replaceChild(
              gE("#battle_right", data),
              gE("#battle_right")
            );
            gE("#battle_main").replaceChild(
              gE("#battle_left", data),
              gE("#battle_left")
            );
            unsafeWindow.battle = new unsafeWindow.Battle();
            unsafeWindow.battle.clear_infopane();
            newRound();
            main();
          });
        } else if (g("roundNow") === g("roundAll")) {
          // Victory
          setAlarm("Victory");
          delValue(2);
          setTimeout(goto, 3 * 1000);
        }
      } else {
        main();
      }
    };
    gE("body").appendChild(eventEnd);
    window.sessionStorage.delay = g("option").delay;
    window.sessionStorage.delay2 = g("option").delay2;
    const fakeApiCall = cE("script");
    fakeApiCall.textContent = `api_call = ${function (b, a, d) {
      const delay = window.sessionStorage.delay * 1;
      const delay2 = window.sessionStorage.delay2 * 1;
      window.info = a;
      b.open("POST", `${MAIN_URL}json`);
      b.setRequestHeader("Content-Type", "application/json");
      b.withCredentials = true;
      b.onreadystatechange = d;
      b.onload = function () {
        document.getElementById("eventEnd").click();
      };
      document.getElementById("eventStart").click();
      if (a.mode === "magic" && a.skill >= 200) {
        if (delay <= 0) {
          b.send(JSON.stringify(a));
        } else {
          setTimeout(() => {
            b.send(JSON.stringify(a));
          }, (delay * (Math.random() * 50 + 50)) / 100);
        }
      } else if (delay2 <= 0) {
        b.send(JSON.stringify(a));
      } else {
        setTimeout(() => {
          b.send(JSON.stringify(a));
        }, (delay2 * (Math.random() * 50 + 50)) / 100);
      }
    }.toString()}`;
    gE("head").appendChild(fakeApiCall);
    const fakeApiResponse = cE("script");
    fakeApiResponse.textContent = `api_response = ${function (b) {
      if (b.readyState === 4) {
        if (b.status === 200) {
          const a = JSON.parse(b.responseText);
          if (a.login !== undefined) {
            //top.window.location.href = login_url;  // 修改后，不知道什么功能
          } else {
            if (a.error || a.reload)
              window.location.href = window.location.search;
            return a;
          }
        } else {
          window.location.href = window.location.search;
        }
      }
      return false;
    }.toString()}`;
    gE("head").appendChild(fakeApiResponse);
  }

  /** 新的回合 */
  function newRound() {
    // New Round
    g("turn", 0);
    if (window.location.hash !== "") goto();
    g("monsterAll", gE("div.btm1", "all").length);
    const monsterDead = gE('img[src*="nbardead"]', "all").length;
    g("monsterAlive", g("monsterAll") - monsterDead);
    g("bossAll", gE('div.btm2[style^="background"]', "all").length);
    const bossDead = gE(
      'div.btm1[style*="opacity"] div.btm2[style*="background"]',
      "all"
    ).length;
    g("bossAlive", g("bossAll") - bossDead);
    const battleLog = gE("#textlog>tbody>tr>td", "all");
    g(
      "roundType",
      (function () {
        if (getValue("roundType")) {
          return getValue("roundType");
        }
        let roundType;
        const temp = battleLog[battleLog.length - 1].textContent;
        if (!temp.match(/^Initializing/)) {
          roundType = "";
        } else if (
          temp.match(/^Initializing arena challenge/) &&
          temp.match(/\d+/)[0] * 1 <= 35
        ) {
          roundType = "ar";
        } else if (
          temp.match(/^Initializing arena challenge/) &&
          temp.match(/\d+/)[0] * 1 >= 105
        ) {
          roundType = "rb";
        } else if (temp.match(/^Initializing random encounter/)) {
          roundType = "ba";
          if (g("option").encounter) {
            const encounter = getValue("encounter", true);
            encounter.lastTime = time(0);
            encounter.time++;
            setValue("encounter", encounter);
          }
        } else if (temp.match(/^Initializing Item World/)) {
          roundType = "iw";
        } else if (temp.match(/^Initializing Grindfest/)) {
          roundType = "gr";
        } else if (temp.match(/^Initializing The Tower/)) {
          roundType = "tw";
        } else {
          roundType = "";
        }
        setValue("roundType", roundType);
        return roundType;
      })()
    );
    if (/You lose \d+ Stamina/.test(battleLog[0].textContent)) {
      const staminaLostLog = getValue("staminaLostLog", true) || {};
      staminaLostLog[time(3)] =
        battleLog[0].textContent.match(/You lose (\d+) Stamina/)[1] * 1;
      setValue("staminaLostLog", staminaLostLog);
      const losedStamina = battleLog[0].textContent.match(/\d+/)[0] * 1;
      if (losedStamina >= g("option").staminaLose) {
        setAlarm("Error");
        if (
          !_alert(
            1,
            "当前Stamina过低\n或Stamina损失过多\n是否继续？",
            "當前Stamina過低\n或Stamina損失過多\n是否繼續？",
            "Continue?\nYou either have too little Stamina or have lost too much"
          )
        ) {
          pauseChange();
          return;
        }
      }
    }
    if (battleLog[battleLog.length - 1].textContent.match("Initializing")) {
      const monsterStatus = [];
      let id = 0;
      for (
        let i = battleLog.length - 2;
        i > battleLog.length - 2 - g("monsterAll");
        i--
      ) {
        let hp = battleLog[i].textContent.match(/HP=(\d+)$/)[1] * 1;
        if (isNaN(hp)) hp = monsterStatus[monsterStatus.length - 1].hp;
        monsterStatus[id] = {
          order: id,
          id: id === 9 ? 0 : id + 1,
          hp,
        };
        id = id + 1;
      }
      setValue("monsterStatus", monsterStatus);
      g("monsterStatus", monsterStatus);
      let roundNow;
      let roundAll;
      const round = battleLog[battleLog.length - 1].textContent.match(
        /\(Round (\d+) \/ (\d+)\)/
      );
      if (g("roundType") !== "ba" && round !== null) {
        roundNow = round[1] * 1;
        roundAll = round[2] * 1;
      } else {
        roundNow = 1;
        roundAll = 1;
      }
      setValue("roundNow", roundNow);
      setValue("roundAll", roundAll);
    } else if (
      !getValue("monsterStatus") ||
      getValue("monsterStatus", true).length !== gE("div.btm2", "all").length
    ) {
      setValue("roundNow", 1);
      setValue("roundAll", 1);
      fixMonsterStatus();
    }
    g("roundNow", getValue("roundNow") * 1);
    g("roundAll", getValue("roundAll") * 1);
    g("roundLeft", getValue("roundAll") - g("roundNow"));
    g("skillOTOS", {
      OFC: 0,
      FRD: 0,
      T3: 0,
      T2: 0,
      T1: 0,
    });
  }

  /** 解决 HentaiVerse 可能出现的 bug */
  function killBug() {
    // 在 HentaiVerse 发生导致 turn 损失的 bug 时发出警告并移除问题元素: https://ehwiki.org/wiki/HentaiVerse_Bugs_%26_Errors#Combat
    const bugLog = gE('#textlog > tbody > tr > td[class="tlb"]', "all");
    const isBug =
      /(Slot is currently not usable)|(Item does not exist)|(Inventory slot is empty)|(You do not have a powerup gem)/;
    for (let i = 0; i < bugLog.length; i++) {
      if (bugLog[i].textContent.match(isBug)) {
        bugLog[i].className = "tlbWARN";
        setTimeout(() => {
          // 间隔时间以避免持续刷新
          window.location.href = window.location; // 刷新移除问题元素
        }, 700);
      } else {
        bugLog[i].className = "tlbQRA";
      }
    }
  }

  /** 获取战斗状况 */
  function battleInfo() {
    let logElement = gE(".hvAALog");
    if (!logElement) {
      logElement = gE("#hvAABox2").appendChild(cE("div"));
      logElement.className = "hvAALog";
    }
    const status = [
      "<l0>物理</l0><l1>物理</l1><l2>Physical</l2>",
      "<l0>火</l0><l1>火</l1><l2>Fire</l2>",
      "<l0>冰</l0><l1>冰</l1><l2>Cold</l2>",
      "<l0>雷</l0><l1>雷</l1><l2>Elec</l2>",
      "<l0>风</l0><l1>風</l1><l2>Wind</l2>",
      "<l0>圣</l0><l1>聖</l1><l2>Divine</l2>",
      "<l0>暗</l0><l1>暗</l1><l2>Forbidden</l2>",
    ];
    logElement.innerHTML = [
      `Turns: ${g("turn")}`,
      `<br>Speed: ${g("runSpeed")} t/s`,
      `<br>Round: ${g("roundNow")}/${g("roundAll")}`,
      `<br><l0>攻击模式</l0><l1>攻擊模式</l1><l2>Attack Mode</l2>: ${
        status[g("attackStatus")]
      }`,
      `<br><l0>敌人</l0><l1>敌人</l1><l2>Monsters</l2>: ${g(
        "monsterAlive"
      )}/${g("monsterAll")}`,
      `<br><l0>战役模式</l0><l1>戰役模式</l1><l2>Type</l2>: ${battleInfoType(
        g("roundType")
      )}`,
    ].join("");
    document.title = `${g("turn")}||${g("runSpeed")}||${g("roundNow")}/${g(
      "roundAll"
    )}||${g("monsterAlive")}/${g("monsterAll")}`;
  }

  /** 战役模式显示 */
  function battleInfoType(type) {
    switch (type) {
      case "ar":
        return "Arena";
      case "ba":
        return "Random Encounter";
      case "rb":
        return "Ring of Blood";
      case "tw":
        return "The Tower";
      case "iw":
        return "Item World";
      case "gr":
        return "GrindFest";
    }
  }

  /** 统计敌人血量，并根据权重排序 */
  function countMonsterHP() {
    const monsterHpElements = gE("div.btm4>div.btm5:nth-child(1)", "all");
    const monsterStatus = g("monsterStatus");
    const hpArray = [];

    monsterHpElements.forEach((monster, i) => {
      const isDead = !!gE('img[src*="nbardead.png"]', monster);
      const hpNow = isDead
        ? Infinity
        : Math.floor(
            (monsterStatus[i].hp * parseFloat(gE("img", monster).style.width)) /
              120
          ) + 1;

      monsterStatus[i].isDead = isDead;
      monsterStatus[i].hpNow = hpNow;

      if (!isDead) {
        hpArray.push(hpNow);
      }
    });

    const hpLowest = Math.min(...hpArray);
    const hpMost = Math.max(...hpArray);
    const isReverse = g("option").ruleReverse;
    const weightFactor = isReverse ? hpMost * 10 : 10 / hpLowest;

    monsterStatus.forEach((monster) => {
      monster.finWeight = monster.isDead
        ? Infinity
        : isReverse
        ? weightFactor / monster.hpNow
        : monster.hpNow * weightFactor;
    });

    const monsterBuffElements = gE("div.btm6", "all");
    monsterBuffElements.forEach((buffElement, i) => {
      DEBUFF_SKILL_LIB.forEach((skill, key) => {
        if (gE(`img[src*="${skill.img}"]`, buffElement)) {
          monsterStatus[i].finWeight += isReverse
            ? -g("option").weight[key]
            : g("option").weight[key];
        }
      });
    });

    monsterStatus.sort((a, b) => a.finWeight - b.finWeight);
    g("monsterStatus", monsterStatus);
  }

  /** 自动使用宝石 */
  function useGem() {
    const gemElement = gE("#ikey_p");
    if (!gemElement) return;

    const Gem = gemElement.textContent;
    const option = g("option");

    if (
      (Gem === "Health Gem" && g("hp") <= option.hp1) ||
      (Gem === "Mana Gem" && g("mp") <= option.mp1) ||
      (Gem === "Spirit Gem" && g("sp") <= option.sp1) ||
      Gem === "Mystic Gem"
    ) {
      gemElement.click();
      tagEndToTrue();
    }
  }

  /** 自动回血回魔 */
  function deadSoon() {
    const name = g("option").itemOrderName.split(",");
    const order = g("option").itemOrderValue.split(",");
    for (let i = 0; i < name.length; i++) {
      if (
        g("option").item[name[i]] &&
        checkCondition(g("option")[`item${name[i]}Condition`]) &&
        isOn(order[i])
      ) {
        isOn(order[i]).click();
        tagEndToTrue();
        return;
      }
    }
  }

  /** 自动使用卷轴 */
  function useScroll() {
    const scrollLib = {
      Go: {
        name: "Scroll of the Gods",
        id: 13299,
        mult: "3",
        img1: "absorb",
        img2: "shadowveil",
        img3: "sparklife",
      },
      Av: {
        name: "Scroll of the Avatar",
        id: 13199,
        mult: "2",
        img1: "haste",
        img2: "protection",
      },
      Pr: {
        name: "Scroll of Protection",
        id: 13111,
        mult: "1",
        img1: "protection",
      },
      Sw: {
        name: "Scroll of Swiftness",
        id: 13101,
        mult: "1",
        img1: "haste",
      },
      Li: {
        name: "Scroll of Life",
        id: 13221,
        mult: "1",
        img1: "sparklife",
      },
      Sh: {
        name: "Scroll of Shadows",
        id: 13211,
        mult: "1",
        img1: "shadowveil",
      },
      Ab: {
        name: "Scroll of Absorption",
        id: 13201,
        mult: "1",
        img1: "absorb",
      },
    };
    const scrollFirst = g("option").scrollFirst ? "_scroll" : "";
    let isUsed;
    for (const i in scrollLib) {
      if (
        g("option").scroll[i] &&
        gE(`.bti3>div[onmouseover*="${scrollLib[i].id}"]`) &&
        checkCondition(g("option")[`scroll${i}Condition`])
      ) {
        for (let j = 1; j <= scrollLib[i].mult; j++) {
          if (
            gE(
              `#pane_effects>img[src*="${
                scrollLib[i][`img${j}`]
              }${scrollFirst}"]`
            )
          ) {
            isUsed = true;
            break;
          }
          isUsed = false;
        }
        if (!isUsed) {
          gE(`.bti3>div[onmouseover*="${scrollLib[i].id}"]`).click();
          tagEndToTrue();
          return;
        }
      }
    }
  }

  const BUFF_SKILL_LIB = new Map([
    ["Pr", { name: "Protection", id: "411", img: "protection" }],
    ["SL", { name: "Spark of Life", id: "422", img: "sparklife" }],
    ["SS", { name: "Spirit Shield", id: "423", img: "spiritshield" }],
    ["Ha", { name: "Haste", id: "412", img: "haste" }],
    ["AF", { name: "Arcane Focus", id: "432", img: "arcanemeditation" }],
    ["He", { name: "Heartseeker", id: "431", img: "heartseeker" }],
    ["Re", { name: "Regen", id: "312", img: "regen" }],
    ["SV", { name: "Shadow Veil", id: "413", img: "shadowveil" }],
    ["Ab", { name: "Absorb", id: "421", img: "absorb" }],
  ]);

  const DEBUFF_SKILL_LIB = new Map([
    ["Sle", { name: "Sleep", id: "222", img: "sleep" }],
    ["Bl", { name: "Blind", id: "231", img: "blind" }],
    ["Slo", { name: "Slow", id: "221", img: "slow" }],
    ["Im", { name: "Imperil", id: "213", img: "imperil" }],
    ["MN", { name: "MagNet", id: "233", img: "magnet" }],
    ["Si", { name: "Silence", id: "232", img: "silence" }],
    ["Dr", { name: "Drain", id: "211", img: "drainhp" }],
    ["We", { name: "Weaken", id: "212", img: "weaken" }],
    ["Co", { name: "Confuse", id: "223", img: "confuse" }],
    ["CM", { name: "Coalesced Mana", id: null, img: "coalescemana" }],
    ["Stun", { name: "Stunned", id: null, img: "wpn_stun" }],
    ["PA", { name: "Penetrated Armor", id: null, img: "wpn_ap" }],
    ["BW", { name: "Bleeding Wound", id: null, img: "wpn_bleed" }],
  ]);

  const NAME_TO_BUFF_CODE = new Map([
    ["Protection", "Pr"],
    ["Spark of Life", "SL"],
    ["Spirit Shield", "SS"],
    ["Hastened", "Ha"],
    ["Arcane Focus", "AF"],
    ["Heartseeker", "He"],
    ["Regen", "Re"],
    ["Shadow Veil", "SV"],
  ]);

  const OFFENSIVE_SPELL_LIB = new Map([
    ["11", "Firebolt"],      ["12", "Fiery Blast"],     ["13", "Inferno"],
    ["21", "Snowball"],      ["22", "Freeze"],           ["23", "Blizzard"],
    ["31", "Spark"],         ["32", "Thunderbolt"],      ["33", "Chain Lightning"],
    ["41", "Gust"],          ["42", "Cyclone"],          ["43", "Tornado"],
    ["51", "Smite"],         ["52", "Banishment"],       ["53", "Wrath"],
    ["61", "Corruption"],    ["62", "Pestilence"],       ["63", "Disintegrate"],
  ]);

  /** 自动施法Channel技能 */
  function useChannelSkill() {
    const paneEffects = gE("#pane_effects");
    if (!paneEffects || !paneEffects.querySelector('img[src*="channeling"]'))
      return;

    const option = g("option");
    const skillPack = option.buffSkillOrderValue.split(",");
    const channelSkill = option.channelSkill;

    // 第一步：施放Channel技能
    if (channelSkill) {
      for (const j of skillPack) {
        if (
          channelSkill[j] &&
          needsRecast(paneEffects, BUFF_SKILL_LIB.get(j).img) &&
          isOn(BUFF_SKILL_LIB.get(j).id)
        ) {
          gE(BUFF_SKILL_LIB.get(j).id).click();
          tagEndToTrue();
          return;
        }
      }
    }

    // 第二步：使用其他技能
    if (option.channelSkill2 && option.channelSkill2OrderValue) {
      const order = option.channelSkill2OrderValue.split(",");
      for (const skillId of order) {
        if (isOn(skillId)) {
          gE(skillId).click();
          tagEndToTrue();
          return;
        }
      }
    }

    // 第三步：重新施放最先消失的Buff
    const buffs = paneEffects.querySelectorAll("img");
    if (buffs.length > 0) {
      for (const buff of buffs) {
        const onmouseover = buff.getAttribute("onmouseover");
        const spellName = onmouseover.match(/'(.*?)'/)[1];
        const buffLastTime = onmouseover.match(/\(.*,.*, (.*?)\)$/)[1] * 1;

        if (isNaN(buffLastTime) || buff.src.match(/_scroll.png$/)) {
          continue;
        }

        if (
          spellName === "Cloak of the Fallen" &&
          !paneEffects.querySelector('img[src*="sparklife"]') &&
          isOn("422")
        ) {
          gE("422").click();
          tagEndToTrue();
          return;
        }

        if (NAME_TO_BUFF_CODE.has(spellName)) {
          const skillCode = NAME_TO_BUFF_CODE.get(spellName);
          const skillInfo = BUFF_SKILL_LIB.get(skillCode);
          if (isOn(skillInfo.id)) {
            gE(skillInfo.id).click();
            tagEndToTrue();
            return;
          }
        }
      }
    }
  }

  /**
   * 检查并使用 Spirit 技能
   * @returns {boolean} 是否使用了 Spirit 技能
   */
  function checkAndActivateSpirit() {
    if (!g("option").preCastSS) {
      return false;
    }

    if (!checkCondition(g("option").preCastSSCondition)) {
      return false;
    }

    const spiritElement = gE("#ckey_spirit");
    if (!spiritElement) {
      return false;
    }

    const spiritOn = spiritElement.src.includes("spirit_a");
    if (spiritOn) {
      return false;
    }

    spiritElement.click();
    tagEndToTrue();
    return true;
  }

  /** 自动施法BUFF技能 */
  /** 检查效果是否需要(重新)施放: 不存在或剩余≤1回合 */
  function needsRecast(paneEffects, imgSrc) {
    const existing = paneEffects.querySelector(`img[src*="${imgSrc}"]`);
    if (!existing) return true;
    const remaining = parseInt(
      existing.getAttribute("onmouseover").match(/\(.*,.*, (.*?)\)$/)?.[1]
    );
    return remaining <= 1;
  }

  function useBuffSkill() {
    const paneEffects = gE("#pane_effects");
    if (!paneEffects) return;

    const option = g("option");
    const buffSkill = option.buffSkill;

    const skillPack = option.buffSkillOrderValue.split(",");

    for (const skill of skillPack) {
      if (
        buffSkill[skill] &&
        checkCondition(option[`buffSkill${skill}Condition`]) &&
        needsRecast(paneEffects, BUFF_SKILL_LIB.get(skill).img) &&
        isOn(BUFF_SKILL_LIB.get(skill).id)
      ) {
        if (checkAndActivateSpirit()) return;
        gE(BUFF_SKILL_LIB.get(skill).id).click();
        tagEndToTrue();
        return;
      }
    }

    const draughtPack = new Map([
      ["HD", { id: 11191, img: "healthpot" }],
      ["MD", { id: 11291, img: "manapot" }],
      ["SD", { id: 11391, img: "spiritpot" }],
      ["FV", { id: 19111, img: "flowers" }],
      ["BG", { id: 19131, img: "gum" }],
    ]);

    for (const [key, draught] of draughtPack) {
      if (
        !paneEffects.querySelector(`img[src*="${draught.img}"]`) &&
        buffSkill[key] &&
        checkCondition(option[`buffSkill${key}Condition`])
      ) {
        const draughtElement = gE(`.bti3>div[onmouseover*="${draught.id}"]`);
        if (draughtElement) {
          draughtElement.click();
          tagEndToTrue();
          return;
        }
      }
    }
  }

  /** 自动使用魔药 */
  function useInfusions() {
    const attackStatus = g("attackStatus");
    if (attackStatus === 0) return;

    const infusionLib = [
      null,
      { id: 12101, img: "fireinfusion" },
      { id: 12201, img: "coldinfusion" },
      { id: 12301, img: "elecinfusion" },
      { id: 12401, img: "windinfusion" },
      { id: 12501, img: "holyinfusion" },
      { id: 12601, img: "darkinfusion" },
    ];

    const infusion = infusionLib[attackStatus];
    const infusionElement = gE(`.bti3>div[onmouseover*="${infusion.id}"]`);
    const effectElement = gE(`#pane_effects>img[src*="${infusion.img}"]`);

    if (infusionElement && !effectElement) {
      infusionElement.click();
      tagEndToTrue();
    }
  }

  /** @returns {"cast"|"blocked"|"skip"} */
  function canApplyDebuff(monsterBuff, debuffKey) {
    const skill = DEBUFF_SKILL_LIB.get(debuffKey);
    if (!needsRecast(monsterBuff, skill.img)) return "skip";
    if (!isOn(skill.id)) return "skip";
    const imgs = gE("img", "all", monsterBuff);
    if (
      imgs.length < 6 ||
      !g("option").debuffSkillTurnAlert ||
      (g("option").debuffSkillTurn &&
        getLastBuffTurn(imgs) >= (g("option").debuffSkillTurn[debuffKey] || 0))
    ) return "cast";
    return "blocked";
  }

  /** 自动施法DEBUFF技能 */
  function useDeSkill() {
    const skillPack = g("option").debuffSkillOrderValue.split(",");
    const monsterBuff = gE(`#mkey_${g("monsterStatus")[0].id}>.btm6`);
    for (const key of skillPack) {
      if (!g("option").debuffSkill[key] || !checkCondition(g("option")[`debuffSkill${key}Condition`])) continue;
      const result = canApplyDebuff(monsterBuff, key);
      if (result === "cast") {
        if (checkAndActivateSpirit()) return;
        gE(DEBUFF_SKILL_LIB.get(key).id).click();
        const aoeCount = g("spellAoe")[DEBUFF_SKILL_LIB.get(key).name] || (g("option").debuffSkillAoe && g("option").debuffSkillAoe[key]) || 1;

        if (aoeCount >= 2 && g("monsterStatus").length > 1 && !g("monsterStatus")[1].isDead) {
          gE(`#mkey_${g("monsterStatus")[1].id}`).click();
        } else {
          gE(`#mkey_${g("monsterStatus")[0].id}`).click();
        }
        tagEndToTrue();
        return;
      }
      if (result === "blocked") {
        _alert(0,
          "无法正常施放DEBUFF技能，请尝试手动打怪",
          "無法正常施放DEBUFF技能，請嘗試手動打怪",
          "Can not cast de-skills normally, continue the script?\nPlease try attack manually.");
        pauseChange();
        tagEndToTrue();
        return;
      }
    }
  }

  /** 对所有怪物施放指定 debuff */
  function castDebuffOnAll(debuffKey) {
    const skill = DEBUFF_SKILL_LIB.get(debuffKey);
    const aoeCount = g("spellAoe")[DEBUFF_SKILL_LIB.get(debuffKey).name] || (g("option").debuffSkillAoe && g("option").debuffSkillAoe[debuffKey]) || 1;
    g("monsterStatus").sort((a, b) => a.order - b.order);
    const monsterBuffs = gE("div.btm6", "all");
    for (let i = 0; i < monsterBuffs.length; i++) {
      const monster = g("monsterStatus")[i];
      if (monster.isDead) continue;
      const result = canApplyDebuff(monsterBuffs[i], debuffKey);
      if (result === "cast") {
        if (checkAndActivateSpirit()) return;
        gE(skill.id).click();
        if (aoeCount >= 2) {
          const next = g("monsterStatus")[i + 1];
          gE(`#mkey_${(next && !next.isDead) ? next.id : monster.id}`).click();
        } else {
          gE(`#mkey_${monster.id}`).click();
        }
        tagEndToTrue();
        return;
      }
      if (result === "blocked") {
        _alert(0,
          `无法正常施放${skill.name}技能,请尝试手动打怪`,
          `無法正常施放${skill.name}技能,請嘗試手動打怪`,
          `Can not cast ${skill.name} skill normally, continue the script?\nPlease try attack manually.`);
        pauseChange();
        tagEndToTrue();
        return;
      }
    }
    g("monsterStatus").sort((a, b) => a.finWeight - b.finWeight);
  }

  /** 获取buff最后持续时间 */
  function getLastBuffTurn(imgs) {
    const lastImg = imgs[imgs.length - 1];
    return parseInt(
      lastImg.getAttribute("onmouseover").match(/\(.*,.*, (.*?)\)$/)[1]
    );
  }

  /** 自动打怪 专注 灵动架势 Ether Tap oc技能释放 */
  function attack() {
    const option = g("option");
    const spiritElement = gE("#ckey_spirit");
    const spiritOn = spiritElement && spiritElement.src.includes("spirit_a");
    const monsterStatus = g("monsterStatus");
    const aliveMonsters = monsterStatus.filter((monster) => !monster.isDead);

    // 专注
    if (option.focus && checkCondition(option.focusCondition)) {
      gE("#ckey_focus").click();
      return;
    }

    // 灵动架势
    if (
      (option.turnOnSS &&
        checkCondition(option.turnOnSSCondition) &&
        !spiritOn) ||
      (option.turnOffSS &&
        checkCondition(option.turnOffSSCondition) &&
        spiritOn)
    ) {
      spiritElement.click();
      tagEndToTrue();
      return;
    }

    // 检查 Ether Tap
    const firstMonster = aliveMonsters[0];
    const etherTapCondition =
      option.etherTap &&
      gE(`#mkey_${firstMonster.id}>div.btm6>img[src*="coalescemana"]`) &&
      (!gE('#pane_effects>img[onmouseover*="Ether Tap (x2)"]') ||
        gE('#pane_effects>img[src*="wpn_et"][id*="effect_expire"]')) &&
      checkCondition(option.etherTapCondition);

    if (!etherTapCondition) {
      const attackStatus = g("attackStatus");
      if (attackStatus !== 0) {
        const isChanneling = (option.channelForceHighTier !== false) &&
          gE('#pane_effects>img[src*="channeling"]');
        const shouldDowngrade = !isChanneling &&
          (option.spellTierDowngrade !== false) &&
          aliveMonsters.length <= (option.spellDowngradeThreshold || 3);

        let selectedTier = 0;
        if (shouldDowngrade) {
          if (isOn(`1${attackStatus}1`)) {
            gE(`1${attackStatus}1`).click();
            selectedTier = 1;
          }
        } else if ((isChanneling || checkCondition(option.highSkillCondition)) && isOn(`1${attackStatus}3`)) {
          gE(`1${attackStatus}3`).click();
          selectedTier = 3;
        } else if ((isChanneling || checkCondition(option.middleSkillCondition)) && isOn(`1${attackStatus}2`)) {
          gE(`1${attackStatus}2`).click();
          selectedTier = 2;
        } else if (isOn(`1${attackStatus}1`)) {
          gE(`1${attackStatus}1`).click();
          selectedTier = 1;
        }

        // AoE 目标选择
        if (selectedTier > 0) {
          const spellKey = `${attackStatus}${selectedTier}`;
          const spellName = OFFENSIVE_SPELL_LIB.get(spellKey);
          const aoeCount = spellName ? (g("spellAoe")[spellName] || (option.spellAoe && option.spellAoe[spellKey]) || 1) : 1;

          if (aoeCount >= 2 && aliveMonsters.length > 1) {
            monsterStatus.sort((a, b) => a.order - b.order);
            const aliveByOrder = monsterStatus.filter(m => !m.isDead);
            gE(`#mkey_${aliveByOrder[0].id}`).click();
            monsterStatus.sort((a, b) => a.finWeight - b.finWeight);
            tagEndToTrue();
            return;
          }
        }
      }
    }

    // 检查技能情况，并释放技能
    if (option.skillSwitch) {
      const skillOrder = (option.skillOrderValue || "OFC,FRD,T3,T2,T1").split(
        ","
      );
      const skillLib = new Map([
        ["OFC", { id: "1111", oc: 205 }], // 200 oc + 5 oc
        ["FRD", { id: "1101", oc: 105 }], // 100 oc + 5 oc
        ["T3", { id: `2${option.fightingStyle}03`, oc: 105 }], // 别的架势没用过，这是盾战的OC 100 oc + 5 oc
        ["T2", { id: `2${option.fightingStyle}02`, oc: 55 }], // 别的架势没用过，这是盾战的OC 50 oc + 5 oc
        ["T1", { id: `2${option.fightingStyle}01`, oc: 30 }], // 别的架势没用过，这是盾战的OC 25 oc + 5 oc
      ]);

      /** 当为盾战时，当怪物已经被晕眩，则跳过盾击
       * @type {boolean}
       * @example
       * // true - 盾战且已晕眩
       * // false - 不是盾战或没晕眩
       */
      const firstMonsterStunned =
        option.fightingStyle === "2" &&
        gE(`#mkey_${aliveMonsters[0].id} img[src*="wpn_stun"]`); // 检查怪物是否晕眩

      // 当最后一回合且仅剩最后一直怪物时,优先释放最后的慈悲,秒杀无需灵动架势
      if (
        option.mercifulBlow && // 按钮启动
        option.fightingStyle === "2" &&
        aliveMonsters.length === 1 &&
        g("roundNow") === g("roundAll") // 最后一回合
        // checkCondition(option['skillT3Condition']) 判断条件T3
      ) {
        const target = aliveMonsters[0];
        if (
          target.hpNow / target.hp < 0.248 &&
          gE(`#mkey_${target.id} img[src*="wpn_bleed"]`) &&
          g("oc") >= 105
        ) {
          const skillElement = gE(`2${option.fightingStyle}03`);
          if (isOn(skillElement)) {
            skillElement.click();
            gE(`#mkey_${target.id}`).click();
            tagEndToTrue();
            return;
          }
        }
      }

      const shouldDowngradePhysical = (option.physicalSkillDowngrade !== false) &&
        aliveMonsters.length <= (option.physicalDowngradeThreshold || 3);

      for (const skill of skillOrder) {
        const skillInfo = skillLib.get(skill);
        const condition =
          checkCondition(option[`skill${skill}Condition`]) &&
          isOn(skillInfo.id) &&
          g("oc") >= skillInfo.oc;

        // 少怪降级: 跳过全体攻击 (OFC/FRD 固定每目标伤害, 少怪=浪费OC; 流派技能总伤害不变)
        if (shouldDowngradePhysical && (skill === "OFC" || skill === "FRD")) {
          continue;
        }

        // 当当前为单手盾战，且怪物已经晕眩，跳过释放盾击
        if (firstMonsterStunned && skill === "T1") {
          continue;
        }

        if (spiritOn && condition) {
          if (
            !(
              option.skillOTOS &&
              option.skillOTOS[skill] &&
              g("skillOTOS")[skill] >= 1
            )
          ) {
            g("skillOTOS")[skill]++;
            gE(skillInfo.id).click();

            // Merciful Blow logic for multiple monsters
            if (
              option.mercifulBlow &&
              option.fightingStyle === "2" &&
              skill === "T3" &&
              aliveMonsters.length > 1
            ) {
              for (const monster of aliveMonsters) {
                if (
                  monster.hpNow / monster.hp < 0.248 &&
                  gE(`#mkey_${monster.id} img[src*="wpn_bleed"]`) // 流血状态
                ) {
                  gE(`#mkey_${monster.id}`).click();
                  tagEndToTrue();
                  return;
                }
              }
            }

            break;
          }
        }
      }
    }

    // 默认攻击第一个或者的目标
    gE(`#mkey_${firstMonster.id}`).click();
    tagEndToTrue();
  }

  /** 标记结束使重新循环判断 */
  function tagEndToTrue() {
    g("end", true);
  }

  /** 修复monsterStatus */
  function fixMonsterStatus() {
    document.title = _alert(
      -1,
      "monsterStatus错误，正在尝试修复",
      "monsterStatus錯誤，正在嘗試修復",
      "monsterStatus Error, trying to fix"
    );
    const monsterStatus = [];
    gE("div.btm2", "all").forEach((monster, i) => {
      monsterStatus.push({
        order: i,
        id: i === 9 ? 0 : i + 1,
        hp: monster.style.background === "" ? 1000 : 100000,
      });
    });
    setValue("monsterStatus", monsterStatus);
    goto();
  }

  /** 掉落检测 */
  function dropMonitor(battleLog) {
    const drop = getValue("drop", true) || {
      "#startTime": time(3),
      "#EXP": 0,
      "#Credit": 0,
    };

    const quality = [
      "Crude",
      "Fair",
      "Average",
      "Superior",
      "Exquisite",
      "Magnificent",
      "Legendary",
      "Peerless",
    ];
    const dropQuality = g("option").dropQuality;

    for (const log of battleLog) {
      const text = log.textContent;

      if (text === "You are Victorious!") {
        break;
      }

      if (/^You gain \d+ (EXP|Credit)/.test(text)) {
        const [, amount, type] = text.match(/^You gain (\d+) (EXP|Credit)/);
        drop[`#${type}`] += Number(amount);
        continue;
      }

      const item = gE("span", log);
      if (!item) continue;

      const name = item.textContent.match(/^\[(.*?)\]$/)[1];

      if (item.style.color === "rgb(255, 0, 0)") {
        for (let j = dropQuality; j < quality.length; j++) {
          if (name.includes(quality[j])) {
            const equipmentName = `Equipment of ${name.match(/^\w+/)[0]}`;
            drop[equipmentName] = (drop[equipmentName] || 0) + 1;
            break;
          }
        }
      } else if (item.style.color === "rgb(186, 5, 180)") {
        const [, amount = "1", crystalName = name] =
          name.match(/^(\d+)x (Crystal of \w+)$/) || [];
        drop[crystalName] = (drop[crystalName] || 0) + Number(amount);
      } else if (item.style.color === "rgb(168, 144, 0)") {
        drop["#Credit"] += Number(name.match(/\d+/)[0]);
      } else {
        drop[name] = (drop[name] || 0) + 1;
      }
    }

    if (g("option").recordEach && g("roundNow") === g("roundAll")) {
      const old = getValue("dropOld", true) || [];
      drop.__name = getValue("battleCode");
      drop["#endTime"] = time(3);
      old.push(drop);
      setValue("dropOld", old);
      delValue("drop");
    } else {
      setValue("drop", drop);
    }
  }

  /** 记录用户使用数据 */
  function recordUsage(parm) {
    const stats = getValue("stats", true) || {
      self: {
        _startTime: time(3),
        _turn: 0,
        _round: 0,
        _battle: 0,
        _monster: 0,
        _boss: 0,
        evade: 0,
        miss: 0,
        focus: 0,
      },
      restore: {
        // 回复量
      },
      items: {
        // 物品使用次数
      },
      magic: {
        // 技能使用次数
      },
      damage: {
        // 技能攻击造成的伤害
      },
      hurt: {
        // 受到攻击造成的伤害
        mp: 0,
        oc: 0,
        _avg: 0,
        _count: 0,
        _total: 0,
        _mavg: 0,
        _mcount: 0,
        _mtotal: 0,
        _pavg: 0,
        _pcount: 0,
        _ptotal: 0,
      },
      proficiency: {
        // 熟练度
      },
    };
    let text;
    let magic;
    let point;
    let reg;
    if (g("monsterAlive") === 0) {
      stats.self._turn += g("turn");
      stats.self._round += 1;
      if (g("roundNow") === g("roundAll")) stats.self._battle += 1;
    }
    if (parm.mode === "magic") {
      magic = parm.magic;
      stats.magic[magic] = magic in stats.magic ? stats.magic[magic] + 1 : 1;
      stats.hurt.mp += parm.mp;
      stats.hurt.oc += parm.oc;
    } else if (parm.mode === "items") {
      stats.items[parm.item] =
        parm.item in stats.items ? stats.items[parm.item] + 1 : 1;
    } else {
      stats.self[parm.mode] =
        parm.mode in stats.self ? stats.self[parm.mode] + 1 : 1;
    }
    const debug = false;
    let log = false;
    for (let i = 0; i < parm.log.length; i++) {
      if (parm.log[i].className === "tls") break;
      text = parm.log[i].textContent;
      if (debug) console.log(text);
      if (text.match(/you for \d+ \w+ damage/)) {
        reg = text.match(/you for (\d+) (\w+) damage/);
        magic = reg[2].replace("ing", "");
        point = reg[1] * 1;
        stats.hurt[magic] =
          magic in stats.hurt ? stats.hurt[magic] + point : point;
        stats.hurt._count++;
        stats.hurt._total += point;
        stats.hurt._avg = Math.round(stats.hurt._total / stats.hurt._count);
        if (magic.match(/pierc|crush|slash/)) {
          stats.hurt._pcount++;
          stats.hurt._ptotal += point;
          stats.hurt._pavg = Math.round(
            stats.hurt._ptotal / stats.hurt._pcount
          );
        } else {
          stats.hurt._mcount++;
          stats.hurt._mtotal += point;
          stats.hurt._mavg = Math.round(
            stats.hurt._mtotal / stats.hurt._mcount
          );
        }
      } else if (
        text.match(/^[\w ]+ [a-z]+s [\w+ -]+ for \d+( .*)? damage/) ||
        text.match(/^You .* for \d+ .* damage/)
      ) {
        // text.match(/for \d+ .* damage/)
        reg = text.match(/for (\d+)( .*)? damage/);
        magic = text.match(/^[\w ]+ [a-z]+s [\w+ -]+ for/)
          ? text
              .match(/^([\w ]+) [a-z]+s [\w+ -]+ for/)[1]
              .replace(/^Your /, "")
          : text.match(/^You (\w+)/)[1];
        point = reg[1] * 1;
        stats.damage[magic] =
          magic in stats.damage ? stats.damage[magic] + point : point;
      } else if (text.match(/Vital Theft hits .*? for \d+ damage/)) {
        magic = "Vital Theft";
        point = text.match(/Vital Theft hits .*? for (\d+) damage/)[1] * 1;
        stats.damage[magic] =
          magic in stats.damage ? stats.damage[magic] + point : point;
      } else if (
        text.match(
          /You (evade|parry|block) the attack|misses the attack against you|(casts|uses) .* misses the attack/
        )
      ) {
        stats.self.evade++;
      } else if (
        text.match(
          /(resists your spell|Your spell is absorbed|(evades|parries) your (attack|spell))|Your attack misses its mark|Your spell fails to connect/
        )
      ) {
        stats.self.miss++;
      } else if (text.match(/You gain the effect Focusing/)) {
        stats.self.focus++;
      } else if (
        text.match(/^Recovered \d+ points of/) ||
        text.match(/You are healed for \d+ Health Points/) ||
        text.match(/You drain \d+ HP from/)
      ) {
        magic =
          parm.mode === "defend"
            ? "defend"
            : text.match(/You drain \d+ HP from/)
            ? "drain"
            : parm.magic || parm.item;
        point = text.match(/\d+/)[0] * 1;
        stats.restore[magic] =
          magic in stats.restore ? stats.restore[magic] + point : point;
      } else if (text.match(/(restores|drain) \d+ points of/)) {
        reg =
          text.match(/^(.*) restores (\d+) points of (\w+)/) ||
          text.match(/^You (drain) (\d+) points of (\w+)/);
        magic = reg[1];
        point = reg[2] * 1;
        stats.restore[magic] =
          magic in stats.restore ? stats.restore[magic] + point : point;
      } else if (
        text.match(
          /absorbs \d+ points of damage from the attack into \d+ points of \w+ damage/
        )
      ) {
        reg = text.match(
          /(.*) absorbs (\d+) points of damage from the attack into (\d+) points of (\w+) damage/
        );
        point = reg[2] * 1;
        const prevText = parm.log[i - 1]?.textContent || "";
        const prevMatch = prevText.match(/you for (\d+) (\w+) damage/);
        magic = prevMatch ? prevMatch[2].replace("ing", "") : "unknown";
        stats.hurt[magic] =
          magic in stats.hurt ? stats.hurt[magic] + point : point;
        point = reg[3] * 1;
        magic = `${reg[1].replace("Your ", "")}_${reg[4]}`;
        stats.hurt[magic] =
          magic in stats.hurt ? stats.hurt[magic] + point : point;
      } else if (text.match(/You gain .* proficiency/)) {
        reg = text.match(/You gain ([\d.]+) points of (.*?) proficiency/);
        magic = reg[2];
        point = reg[1] * 1;
        stats.proficiency[magic] =
          magic in stats.proficiency ? stats.proficiency[magic] + point : point;
        stats.proficiency[magic] = stats.proficiency[magic].toFixed(3) * 1;
      } else if (
        text.trim() === "" ||
        text.match(
          /You (gain |cast |use |are Victorious|have reached Level|have obtained the title|do not have enough MP)/
        ) ||
        text.match(
          /Cooldown|has expired|Spirit Stance|gains the effect|insufficient Spirit|Stop beating dead ponies| defeat |Clear Bonus|brink of defeat|Stop \w+ing|Spawned Monster| drop(ped|s) |defeated/
        )
      ) {
        // nothing;
      } else if (debug) {
        log = true;
        setAudioAlarm("Error");
        console.log(text);
      }
    }
    if (debug && log) {
      console.table(stats);
      pauseChange();
    }
    setValue("stats", stats);
  }

  // 优化后的recordUsage2
  function recordUsage2() {
    const stats = getValue("stats", true);
    stats.self._monster += g("monsterAll");
    stats.self._boss += g("bossAll");

    if (g("option").recordEach && g("roundNow") === g("roundAll")) {
      const old = getValue("statsOld", true) || [];
      stats.__name = getValue("battleCode");
      stats.self._endTime = time(3);
      old.push(stats);
      setValue("statsOld", old);
      delValue("stats");
    } else {
      setValue("stats", stats);
    }
  }

  init();
})();
