// ==UserScript==
// @name          Auto_sign
// @namespace     http://tampermonkey.net/
// @version       0.15.0
// @description   多站自动签到（论坛点击式 + 52jidi SPA + 52pojie iframe）；带 #autosign 一键链式签完今天没签的站
// @author        JoeZhangYN
// @match         http*://www.moesola.com/
// @match         http*://bbs.tsdrm.com/
// @match         http*://zodgame.xyz/plugin.php?id=dsu_paulsign:sign
// @match         http*://ts2f.com/forum.php
// @match         http*://www.tsdm.live/forum.php
// @match         http*://bbs.anjian.com/
// @match         http*://bbs.gfan.com/home.php?mod=task
// @match         http*://bbs.gfan.net.cn/forum.php
// @match         http*://bbs.gfan.net.cn/home.php?mod=task
// @match         http*://bbs.vcb-s.com
// @match         http*://www.repaik.com/plugin.php?id=dsu_paulsign:sign
// @match         http*://www.hdpfans.com/qiandao
// @match         http*://www.kamigami.org/plugin.php?id=dsu_paulsign:sign
// @match         http*://bbs.kafan.cn/
// @match         http*://bbs.zdfx.net/k_misign-sign.html
// @match         http*://bbs.vcb-s.com/dsu_paulsign-sign.html
// @match         http*://www.btba.com.cn/
// @match         http*://hk-pic1.xyz/forum.php
// @match         http*://www.4k123.com/plugin.php?id=k_misign:sign
// @match         http*://www.52pojie.cn/*
// @exclude       http*://www.52pojie.cn/home.php?mod=task*
// @match         http*://bbs.itzmx.com/dsu_paulsign-sign.html
// @match         http*://www.tenlonstudio.com/mission/today
// @match         http*://www.cgboynb.com/user/balance
// @match         http*://www.hifini.com/sg_sign.htm
// @match         http*://www.hifiti.com/sg_sign.htm
// @match         http*://www.sglynp.com/
// @match         http*://gmgard.moe/
// @match         http*://fxacg.net/dc_signin-sign.html
// @match         http*://xueshu.fun/user/coin/
// @match         http*://www.4ksg.com/plugin.php?id=dc_signin*
// @match         http*://neoacg.com/dsu_paulsign-sign.html
// @match         http*://52jidi.com/level*
// @match         http*://www.52jidi.com/level*
// @grant         none
// ==/UserScript==

(function () {
  "use strict";

  // ==================== 配置项 ====================
  const CONFIG = {
    clickWaitMs: 15000,      // 等待目标元素出现的最长时间（超时即放弃，避免无限轮询）
    pollIntervalMs: 800,     // 轮询查找元素的间隔
    spaWaitMs: 60000,        // SPA（52jidi）等待按钮渲染的最长时间（页面慢，给足 60s）
    spaPollMs: 1000,         // SPA 轮询兜底间隔（防止 MutationObserver 漏触发）
    delayAfterMoodMs: 3000,  // 选心情后到点击提交按钮的间隔（k_misign / dc_signin）
    chainSettleMs: 4000,     // 链式跳转前的缓冲，给当前站签到请求 flush 的时间
    chainMaxPerSiteMs: 25000,// 链式单站最长等待（含慢加载），超时即跳下一个，避免卡死
  };

  const myDate = new Date();
  const locationHost = location.host;

  // ==================== 站点配置 ====================
  // type 说明：
  //   click             选心情(id) → 点击 → Discuz 弹窗提交
  //   window            先弹出签到窗(showParam) → 选心情 → 提交
  //   double-click      先点 preClickId，延迟后再点签到按钮(id)（k_misign）
  //   click-with-delay  选心情(id) → 延迟后点提交按钮(selector)
  //   conditional-click 已签(signedText)则跳过，否则点击
  //   spa-text          React SPA：扫描所有 button，点击文字精确匹配(text)的第一个
  //   iframe-task       后台隐藏 iframe 提交任务签到 + localStorage 当天去重（52pojie）
  const sites = [
    { host: "www.moesola.com", type: "click", id: "kx_s" },
    { host: "ts2f.com", type: "click", id: "KX2" },
    { host: "www.kamigami.org", type: "click", id: "kx" },
    { host: "www.repaik.com", type: "click", id: "kx" },
    { host: "bbs.vcb-s.com", type: "click", id: "kx" },
    { host: "www.itsk.com", type: "click", id: "1kx" },
    { host: "bbs.itzmx.com", type: "click", id: "kx" },
    { host: "zodgame.xyz", type: "click", id: "kx" },
    { host: "neoacg.com", type: "click", id: "kx" },
    {
      host: "hk-pic1.xyz",
      type: "window",
      id: "kx",
      showParam: ["dsu_paulsign", "plugin.php?id=dsu_paulsign:sign&4351398b"],
    },
    {
      host: "www.tsdm.live",
      type: "window",
      id: "kx",
      showParam: ["dsu_paulsign", "plugin.php?id=dsu_paulsign:sign&8e8c972f"],
    },
    {
      host: "bbs.gfan.net.cn",
      type: "window",
      id: "kx",
      showParam: ["dsu_paulsign", "plugin.php?id=dsu_paulsign:sign&b963c74f"],
    },
    {
      host: "bbs.gfan.com",
      type: "window",
      id: "kx",
      showParam: ["dsu_paulsign", "plugin.php?id=dsu_paulsign:sign&b963c74f"],
    },
    {
      host: "bbs.anjian.com",
      type: "double-click",
      id: "Buttonaddsignin",
      preClickId: "pper_a",
    },
    { host: "www.hdpfans.com", type: "click", id: "JD_sign" },
    { host: "www.4k123.com", type: "click", id: "JD_sign" },
    { host: "bbs.kafan.cn", type: "click", id: "pper_a" },
    { host: "bbs.zdfx.net", type: "click", id: "JD_sign" },
    { host: "www.btba.com.cn", type: "click", id: "qiandao" },
    {
      host: "www.tenlonstudio.com",
      type: "click",
      id: "1kx",
      selector:
        "#main > div.custom-page-title.box.b2-radius.b2-pd.mg-b > div.custom-page-row.gold-row.mg-t > div:nth-child(2) > button",
    },
    {
      host: "www.cgboynb.com",
      type: "click",
      id: "1kx",
      selector:
        "body > main > div:nth-child(1) > div.author-header.mb20.radius8.main-shadow.main-bg.full-widget-sm > div.header-content > div > div.header-btns.flex0.flex.ac > a.but.c-blue.ml10.pw-1em.radius.initiate-checkin",
    },
    {
      host: "www.hifini.com",
      type: "conditional-click",
      id: "1kx",
      selector: "#sign",
      signedText: "已签",
    },
    {
      host: "www.hifiti.com",
      type: "conditional-click",
      id: "1kx",
      selector: "#sign",
      signedText: "已签",
    },
    {
      host: "www.sglynp.com",
      type: "click",
      id: "1kx",
      selector: "#fx_checkin_b",
    },
    {
      host: "gmgard.moe",
      type: "click",
      id: "1kx",
      selector: "#checkin",
    },
    {
      host: "xueshu.fun",
      type: "click",
      id: "1kx",
      selector:
        "#main > div.container.user-top-container > div > div.col-lg-3.menu-column > div > div.card.mb-lg-4.mb-2 > div > button",
    },
    {
      host: "fxacg.net",
      type: "click-with-delay",
      id: "emot_1",
      selector: "#signform > p > button",
    },
    {
      host: "www.4ksg.com",
      type: "click-with-delay",
      id: "emot_1",
      selector: "#signform > p > button",
    },
    // —— 52jidi 关卡页：点击签到任务的「去完成」按钮 ——
    //   页面无「未完成」按钮，"未完成" 只是任务状态标签；签到按钮文字是 "去完成"，
    //   点击触发 POST api.52jidi.com/misc/clockin。精确匹配 "去完成" 只命中签到，
    //   不会误点 "去推广 / 去邀请 / 去互助区"（那些是会跳转的其它任务）。
    { host: "52jidi.com", type: "spa-text", text: "去完成" },
    // —— 52pojie 吾爱破解：后台 iframe 提交每日任务签到（实现见下方 sign52pojie）——
    { host: "www.52pojie.cn", type: "iframe-task" },
  ];

  // ==================== 工具函数 ====================

  // 填写签到留言（dsu_paulsign 的 todaysay / 部分站点的 content 输入框）
  function setSaying() {
    const message = `今天又来签到来了。现在的时间是${myDate.getHours()}时${myDate.getMinutes()}分${myDate.getSeconds()}秒。`;
    const input =
      document.getElementById("todaysay") || document.getElementById("content");
    if (input) input.value = message;
  }

  // 轮询等待元素出现并点击。
  // 返回："clicked" | "signed"（命中 signedText 跳过点击）| "timeout"（超时放弃，不再无限轮询）
  function clickWhenExists({
    id,
    selector,
    delay = 0,
    signedText,
    timeout = CONFIG.clickWaitMs,
  } = {}) {
    return new Promise((resolve) => {
      const deadline = Date.now() + timeout;
      const tryClick = () => {
        const el = selector
          ? document.querySelector(selector)
          : id
          ? document.getElementById(id)
          : null;
        if (el) {
          if (signedText && el.textContent.trim().includes(signedText)) {
            resolve("signed");
            return;
          }
          el.click();
          resolve("clicked");
          return;
        }
        if (Date.now() >= deadline) {
          resolve("timeout");
          return;
        }
        setTimeout(tryClick, CONFIG.pollIntervalMs);
      };
      setTimeout(tryClick, delay);
    });
  }

  // SPA 专用：扫描所有 <button>，点击文字内容精确匹配 text 的第一个。
  // 类名是 emotion 动态生成（如 css-tjsggz，每次构建都变），故按文字匹配而非脆弱长选择器。
  // 页面慢、按钮异步渲染：初始 DOM 往往没有该按钮，故三重保险等待——
  //   1) 立即查一次（已渲染则秒点）
  //   2) MutationObserver 监听整树：DOM 一变就重试，按钮出现的瞬间即点（响应最快）
  //   3) setInterval 低频轮询兜底：防止个别渲染方式（文本节点替换 / 异步框架）不触发 observer
  // 命中即点一次并清理全部监听（仅点第一个）；spaWaitMs 内都没出现才放弃。
  function clickFirstButtonByText(
    text,
    { timeout = CONFIG.spaWaitMs, interval = CONFIG.spaPollMs } = {}
  ) {
    return new Promise((resolve) => {
      const want = text.trim();
      const find = () =>
        [...document.querySelectorAll("button")].find(
          (btn) => btn.textContent.trim() === want
        );

      let settled = false;
      let observer = null;
      let poller = null;
      let timer = null;

      const finish = (result) => {
        if (settled) return;
        settled = true;
        if (observer) observer.disconnect();
        if (poller) clearInterval(poller);
        if (timer) clearTimeout(timer);
        resolve(result);
      };

      const attempt = () => {
        if (settled) return;
        const btn = find();
        if (btn) {
          btn.click();
          finish("clicked");
        }
      };

      // 1) 立即试一次（按钮已渲染则秒点）
      attempt();
      if (settled) return;

      // 2) MutationObserver：DOM 一变就立刻重试，按钮出现瞬间即点
      observer = new MutationObserver(attempt);
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        characterData: true,
      });

      // 3) 低频轮询兜底：observer 没捕获到时仍能补上
      poller = setInterval(attempt, interval);

      // 4) 超时放弃，避免无限挂监听
      timer = setTimeout(() => finish("timeout"), timeout);
    });
  }

  // ==================== 签到分发 ====================
  async function handleSignIn(site) {
    switch (site.type) {
      case "click":
        setSaying();
        await clickWhenExists(site);
        showWindow("qwindow", "qiandao", "post", "0");
        break;
      case "window":
        showWindow(...site.showParam);
        setSaying();
        await clickWhenExists(site);
        showWindow("qwindow", "qiandao", "post", "0");
        break;
      case "double-click":
        await clickWhenExists({ id: site.preClickId });
        // 修复：原代码把延迟作为第二个位置参数传入而被忽略，改为放进选项对象生效
        await clickWhenExists({ id: site.id, delay: CONFIG.delayAfterMoodMs });
        break;
      case "click-with-delay":
        setSaying();
        await clickWhenExists({ id: site.id });
        await clickWhenExists({
          selector: site.selector,
          delay: CONFIG.delayAfterMoodMs,
        });
        break;
      case "conditional-click":
        await clickWhenExists(site);
        break;
      case "spa-text":
        await clickFirstButtonByText(site.text);
        break;
      case "iframe-task":
        await sign52pojie();
        break;
    }
  }

  // ==================== Discuz 签到弹窗（仅 Discuz 页面可用） ====================
  function showWindow(k, url, mode = "get", cache = 1) {
    // 依赖 Discuz 全局函数（showMenu / ajaxget / ajaxpost / doane）。
    // 非 Discuz 站点（自定义 selector 的那些）缺失这些全局，直接跳过避免 ReferenceError 中断脚本。
    if (typeof showMenu !== "function") return;

    const menuid = `fwin_${k}`;
    let menuObj = document.getElementById(menuid);

    if (!menuObj) {
      menuObj = document.createElement("div");
      menuObj.id = menuid;
      menuObj.className = "fwinmask";
      menuObj.style.display = "none";
      document.getElementById("append_parent")?.appendChild(menuObj);
      menuObj.innerHTML = `
        <table cellpadding="0" class="fwin">
          <tr><td class="t_l"></td><td class="t_c"></td><td class="t_r"></td></tr>
          <tr><td class="m_l"></td><td class="m_c" id="fwin_content_${k}"></td><td class="m_r"></td></tr>
          <tr><td class="b_l"></td><td class="b_c"></td><td class="b_r"></td></tr>
        </table>`;
    }

    const initMenu = () => {
      const objs = menuObj.getElementsByTagName("*");
      let fctrlidinit = false;
      for (const obj of objs) {
        if (obj.id) obj.setAttribute("fwin", k);
        if (obj.className === "flb" && !fctrlidinit) {
          if (!obj.id) obj.id = `fctrl_${k}`;
          fctrlidinit = true;
        }
      }
      showMenu({
        mtype: "win",
        menuid,
        duration: 3,
        pos: "00",
        zindex: JSMENU?.["zIndex"]?.["win"] || 100,
        cache,
      });
    };

    const fetchContent = () => {
      if (mode === "get") {
        const contentUrl = `${url}${url.includes("?") ? "&" : "?"}infloat=yes&handlekey=${k}${
          cache === -1 ? `&t=${+new Date()}` : ""
        }`;
        ajaxget(contentUrl, `fwin_content_${k}`, null, "", "", initMenu);
      } else {
        ajaxpost(url, `fwin_content_${k}`, "", "", "", initMenu);
      }
    };

    fetchContent();
    doane();
  }

  // ==================== 52pojie 吾爱破解：后台 iframe 签到（整合自 ZFDev 脚本） ====================
  // 机制：吾爱破解每日签到 = 访问任务 apply 链接即完成，故用隐藏 iframe 后台提交，不打扰浏览。
  // 全站 @match 下用 localStorage 按 toDateString 当天去重，避免每开一页都签一次；
  // 并对 /home.php?mod=task* 做 @exclude，防止 iframe 内再次注入脚本造成递归签到。
  function sign52pojie() {
    let settle;
    const finished = new Promise((r) => (settle = r)); // 供链式调度 await：签到结束/超时即 resolve
    const STORE_KEY = "autoSign"; // 沿用原脚本 key，兼容已装过 ZFDev 版的去重记录
    const today = () => new Date().toDateString();
    const saveDate = () => localStorage.setItem(STORE_KEY, today());
    const isSignedToday = () => localStorage.getItem(STORE_KEY) === today();

    const s = {
      busy: 0, // 已检测到签到入口的标志位（原 s.o）
      applied: "本期您已申请过此任务",
      done: "任务已完成",
      forbidden: "403 Forbidden",
      needJs: "请开启JavaScript并刷新该页",
      iconSel: '#hd .wp #um p > a > img[src*="qds.png"]', // 顶栏「签到」图标，存在即未签
      drawFlag: "?mod=task&do=draw", // apply 成功后会重定向到领奖 draw 页
      signedIcon:
        '<img src="https://static.52pojie.cn/static/image/common/wbs.png" class="qq_bind" align="absmiddle" alt="">',
    };

    // 后台隐藏 iframe 提交每日签到任务，resolve 出任务页文本供判定结果
    const bSign = () =>
      new Promise((resolve) => {
        const f = document.createElement("iframe");
        f.src = "/home.php?mod=task&do=apply&id=2&referer=%2Fforum.php";
        f.style.cssText = "display:none;width:0;height:0;border:0;"; // 隐藏，免打扰
        f.onload = (e) => {
          const search = e.target.contentWindow.location.search;
          const text = f.contentWindow.document.body.textContent;
          // 仅当已重定向到 draw 页且内容非「请开启JS」时才算拿到结果
          if (search.indexOf(s.drawFlag) >= 0 && text.indexOf(s.needJs) <= 0) {
            f.remove();
            resolve(text);
          }
        };
        document.body.append(f);
      });

    const autoSign = (num) => {
      if (isSignedToday()) return settle("already");

      const icon = document.querySelector(s.iconSel);
      if (!s.busy && !icon) return settle("no-entry"); // 无签到入口且未启动过 → 退出
      s.busy = 1;

      // 探测 Discuz 前端是否就绪（new Ajax 是 Discuz 全局）；未就绪则重试，最多 2 次
      try {
        new Ajax();
      } catch (err) {
        if (!num || num < 2) {
          setTimeout(() => autoSign(num + 1), 2000);
          return;
        }
        return settle("not-ready"); // 重试 2 次仍未就绪 → 放弃，放行链式
      }

      const anchor = icon ? icon.parentNode : null; // 顶栏签到 <a>，仅做视觉反馈，判空兜底
      if (anchor) anchor.text = "自动签到中..";

      bSign().then((res) => {
        if (res.indexOf(s.applied) > 0 || res.indexOf(s.done) > 0) {
          saveDate();
          if (anchor) anchor.outerHTML = s.signedIcon;
          console.log("[Auto_sign][52pojie] 签到完成");
          settle("done");
        } else if (res.indexOf(s.forbidden) > 0 || res.indexOf(s.needJs) > 0) {
          autoSign(0); // 被拦 / JS 未就绪 → 重来
        } else {
          console.log("[Auto_sign][52pojie] 签到失败", res.slice(0, 80));
          settle("fail");
        }
      });
    };

    setTimeout(() => settle("timeout"), 30000); // 兜底：iframe 卡住时不阻塞链式前进
    autoSign(0);
    return finished;
  }

  // ==================== 链式调度：一次打开自动签完今天没签的纳入站 ====================
  // 跨站状态用 URL hash 传递（#autosign=<已签 host 的 JSON>）。刻意保持 @grant none —— 改用
  // GM_* 会让脚本进沙箱、访问不到页面全局（showMenu/ajaxpost/Ajax 等）而打断现有签到；
  // 而 localStorage 跨域隔离，一个站读不到别站的状态，故用随跳转流转的 hash 承载链式状态。
  // 启动：打开任一纳入站并带 #autosign=start（建议存成书签）；无 #autosign 时只签当前站、不跳。
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  // host → 跳转用的签到页 URL（取各站 @match 的签到页，均为已验证能签到的地址）。
  // 删一行即把该站移出链式，增一行即纳入；链式顺序 = 此处书写顺序。
  const CHAIN_URLS = {
    "www.moesola.com": "https://www.moesola.com/",
    "ts2f.com": "https://ts2f.com/forum.php",
    "www.kamigami.org": "https://www.kamigami.org/plugin.php?id=dsu_paulsign:sign",
    "www.repaik.com": "https://www.repaik.com/plugin.php?id=dsu_paulsign:sign",
    "bbs.vcb-s.com": "https://bbs.vcb-s.com/dsu_paulsign-sign.html",
    "bbs.itzmx.com": "https://bbs.itzmx.com/dsu_paulsign-sign.html",
    "zodgame.xyz": "https://zodgame.xyz/plugin.php?id=dsu_paulsign:sign",
    "neoacg.com": "https://neoacg.com/dsu_paulsign-sign.html",
    "www.tsdm.live": "https://www.tsdm.live/forum.php",
    "bbs.gfan.net.cn": "https://bbs.gfan.net.cn/forum.php",
    "bbs.gfan.com": "https://bbs.gfan.com/home.php?mod=task",
    "hk-pic1.xyz": "https://hk-pic1.xyz/forum.php",
    "bbs.anjian.com": "https://bbs.anjian.com/",
    "www.hdpfans.com": "https://www.hdpfans.com/qiandao",
    "www.4k123.com": "https://www.4k123.com/plugin.php?id=k_misign:sign",
    "bbs.kafan.cn": "https://bbs.kafan.cn/",
    "bbs.zdfx.net": "https://bbs.zdfx.net/k_misign-sign.html",
    "www.btba.com.cn": "https://www.btba.com.cn/",
    "www.tenlonstudio.com": "https://www.tenlonstudio.com/mission/today",
    "www.cgboynb.com": "https://www.cgboynb.com/user/balance",
    "www.hifini.com": "https://www.hifini.com/sg_sign.htm",
    "www.hifiti.com": "https://www.hifiti.com/sg_sign.htm",
    "www.sglynp.com": "https://www.sglynp.com/",
    "gmgard.moe": "https://gmgard.moe/",
    "xueshu.fun": "https://xueshu.fun/user/coin/",
    "fxacg.net": "https://fxacg.net/dc_signin-sign.html",
    "www.4ksg.com": "https://www.4ksg.com/plugin.php?id=dc_signin",
    "52jidi.com": "https://52jidi.com/level",
    "www.52pojie.cn": "https://www.52pojie.cn/",
  };

  // 解析链式状态：返回已签 host 数组；无 #autosign → null（非链式，签完不跳）
  function parseChainState() {
    const m = location.hash.match(/autosign=([^&]*)/);
    if (!m) return null;
    const raw = decodeURIComponent(m[1]);
    if (raw === "start" || raw === "") return [];
    try {
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  const currentChainHost = () =>
    Object.keys(CHAIN_URLS).find((h) => locationHost.includes(h)) || null;
  const nextChainHost = (done) =>
    Object.keys(CHAIN_URLS).find((h) => !done.includes(h)) || null;

  // ==================== 入口 ====================
  (async () => {
    const site = sites.find((s) => locationHost.includes(s.host));

    // 先签当前站：动作结束或单站超时(chainMaxPerSiteMs)即返回，失败也不卡住链式
    if (site) {
      await Promise.race([handleSignIn(site), delay(CONFIG.chainMaxPerSiteMs)]);
    }

    // 仅链式模式（URL 带 #autosign）才继续跳转下一个未签站
    const done = parseChainState();
    if (done === null) return;

    const host = currentChainHost();
    if (host && !done.includes(host)) done.push(host); // 记下本站已尝试

    const next = nextChainHost(done);
    if (!next) {
      console.log(`[Auto_sign] 今日链式签到结束，共处理 ${done.length} 站`);
      return;
    }
    await delay(CONFIG.chainSettleMs); // 给当前站请求 flush 的缓冲
    location.href =
      CHAIN_URLS[next] + "#autosign=" + encodeURIComponent(JSON.stringify(done));
  })();
})();
