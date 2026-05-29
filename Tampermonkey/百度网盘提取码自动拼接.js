// ==UserScript==
// @name         百度网盘提取码自动拼接
// @namespace    http://tampermonkey.net/
// @version      2.1.1
// @description  自动检测页面中的百度网盘链接，智能查找并拼接提取码；分享页面接管 Baidu 自身的慢速自动提交，立即点击提交按钮加速跳转
// @author       JoeZhangYN
// @match        *://*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=baidu.com
// @grant        GM_setClipboard
// @grant        GM_registerMenuCommand
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // ==================== 配置项 ====================
    const CONFIG = {
        debug: false,                    // 调试模式
        maxSearchDepth: 6,               // 向上查找的最大层级（10→6 减少 innerText 读次）
        maxTableRows: 50,                // 表格超过此行数时不全局搜索
        maxSiblingTextLength: 500,       // 相邻元素文本超过此长度时跳过
        visualIndicator: true,           // 是否显示视觉标识
        indicatorStyle: 'underline',     // 标识样式: 'underline' | 'badge' | 'both'
        autoProcess: true,               // 自动处理
        processDelay: [800, 3000],       // 延迟处理时间点(ms)
        scanThrottleMs: 250,             // processAllLinks 节流间隔
        observerDebounceMs: 500,         // MutationObserver 触发后到 scan 的延迟
        autoSubmitOnSharePage: true,     // 在 pan.baidu.com/s/* 分享页接管自动提交
        autoSubmitClickDelayMs: 0,       // 填充后到点击的间隔；> 0 可绕开部分反自动化检测
        autoSubmitMaxWaitMs: 15000,      // 等待密码框/提交按钮出现的最长时间
    };

    // ==================== 工具函数 ====================
    const log = (...args) => CONFIG.debug && console.log('[百度网盘]', ...args);

    // ==================== 分支：百度网盘分享页自动提交 ====================
    // 分享页只跑这段（接管 Baidu 自身的慢速自动提交），不跑下面的链接拼接逻辑。
    if (CONFIG.autoSubmitOnSharePage
        && location.hostname === 'pan.baidu.com'
        && location.pathname.startsWith('/s/')) {
        runAutoSubmitOnSharePage();
        return;
    }

    function runAutoSubmitOnSharePage() {
        const pwd = new URLSearchParams(location.search).get('pwd');
        if (!pwd || !/^[0-9a-zA-Z]{4}$/.test(pwd)) return;

        // 多套选择器 + 文本兜底，防 Baidu 改 class
        const INPUT_SELECTORS = [
            'input.pickpw',
            'input[placeholder*="提取码"]',
            'input[placeholder*="提取"]',
            '.input-area input[type="text"]',
            'input[type="text"][maxlength="4"]',
        ];
        const BUTTON_SELECTORS = [
            'a.g-button-right',
            'a.g-button.g-button-blue',
            '.submit-btn',
            '[node-type="verify-form-submit"]',
            '.share-input-line a.g-button',
        ];
        const BUTTON_TEXT_RE = /^(提取(文件)?|确定|提交)$/;

        const isVisible = (el) => !!(el && el.offsetParent !== null);
        const findInput = () => {
            for (const sel of INPUT_SELECTORS) {
                const el = document.querySelector(sel);
                if (isVisible(el)) return el;
            }
            return null;
        };
        const findButton = () => {
            for (const sel of BUTTON_SELECTORS) {
                const el = document.querySelector(sel);
                if (isVisible(el)) return el;
            }
            // 文本兜底：扫一切按钮形态控件，匹配 "提取文件 / 确定 / 提交"
            const candidates = document.querySelectorAll(
                'a.g-button, button, a[class*="button"], a[class*="btn"], div[class*="btn"]'
            );
            for (const el of candidates) {
                const text = (el.innerText || el.textContent || '').trim();
                if (BUTTON_TEXT_RE.test(text) && isVisible(el)) return el;
            }
            return null;
        };

        let submitted = false;
        const tryFillAndSubmit = () => {
            if (submitted) return true;
            const input = findInput();
            const button = findButton();
            if (!input || !button) return false;

            if (input.value !== pwd) {
                input.focus();
                input.value = pwd;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }

            const doClick = () => {
                button.click();
                submitted = true;
                log('分享页：已自动点击提交');
            };
            if (CONFIG.autoSubmitClickDelayMs > 0) {
                setTimeout(doClick, CONFIG.autoSubmitClickDelayMs);
                submitted = true; // 标记已调度，避免 observer 再触发
            } else {
                doClick();
            }
            return true;
        };

        // 立即试一次（@run-at document-start 时往往太早，但成本极低）
        if (document.readyState !== 'loading' && tryFillAndSubmit()) return;

        // MutationObserver 等元素出现 —— 观察 documentElement，body 不存在时也能用
        const observer = new MutationObserver(() => {
            if (tryFillAndSubmit()) observer.disconnect();
        });
        const startObserve = () => observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
        });
        if (document.documentElement) {
            startObserve();
        } else {
            document.addEventListener('readystatechange', startObserve, { once: true });
        }

        // DOMContentLoaded 时再尝试一次（兜底 observer 漏触发的极端情况）
        document.addEventListener('DOMContentLoaded', tryFillAndSubmit, { once: true });

        // 超时停止观察，避免长期空转
        setTimeout(() => {
            if (!submitted) {
                observer.disconnect();
                log('分享页：自动提交等待超时');
            }
        }, CONFIG.autoSubmitMaxWaitMs);
    }

    // 百度网盘链接正则
    const BAIDU_PAN_REGEX = /https?:\/\/pan\.baidu\.com\/s\/([a-zA-Z0-9_-]+)/;

    // 提取码匹配模式（按优先级排序）
    const CODE_PATTERNS = [
        // 标准格式（码可选，支持"提取码"和"提取"）
        /提取码?\s*[:：]\s*([0-9a-zA-Z]{4})\b/,
        /提取码?\s*[:：]?\s*【([0-9a-zA-Z]{4})】/,
        /提取码?\s*[:：]?\s*\[([0-9a-zA-Z]{4})\]/,
        /提取码?\s*([0-9a-zA-Z]{4})\b/,


        // 密码格式
        /密码\s*[:：]\s*([0-9a-zA-Z]{4})\b/,
        /密码\s*[:：]?\s*【([0-9a-zA-Z]{4})】/,
        /密码\s*[:：]?\s*\[([0-9a-zA-Z]{4})\]/,
        /密码\s*([0-9a-zA-Z]{4})\b/,

        // pwd格式
        /pwd\s*[:：=]\s*([0-9a-zA-Z]{4})\b/i,

        // 其他常见格式
        /验证码?\s*[:：]?\s*([0-9a-zA-Z]{4})\b/,
        /访问码?\s*[:：]?\s*([0-9a-zA-Z]{4})\b/,
        /code\s*[:：=]\s*([0-9a-zA-Z]{4})\b/i,

        // 括号格式 (xxxx)
        /[(（]([0-9a-zA-Z]{4})[)）]/,
    ];

    // 预编译 global 版正则（保留原 flags，仅追加 g）——避免每次调用 new RegExp
    const CODE_PATTERNS_G = CODE_PATTERNS.map(p =>
        new RegExp(p.source, p.flags.includes('g') ? p.flags : p.flags + 'g')
    );

    // 已处理的链接集合（防止重复处理）
    const processedLinks = new WeakSet();

    // 单次 scan 内的 textContent 缓存——避免父级走链时重复读取同一节点
    // processAllLinks 进入时设为 WeakMap，退出时置 null（停留期间 GC 友好）
    let textCache = null;
    function getText(el) {
        if (!el) return '';
        if (!textCache) return el.textContent || '';
        let t = textCache.get(el);
        if (t === undefined) {
            t = el.textContent || '';
            textCache.set(el, t);
        }
        return t;
    }

    // ==================== 核心函数 ====================

    // 从文本中提取所有可能的提取码
    function extractAllCodes(text) {
        if (!text) return [];

        const codes = [];
        const seen = new Set();

        for (const pattern of CODE_PATTERNS_G) {
            pattern.lastIndex = 0;
            let m;
            while ((m = pattern.exec(text)) !== null) {
                const code = m[1];
                if (!seen.has(code)) {
                    seen.add(code);
                    codes.push({ code, index: m.index });
                }
                // 防止零宽匹配死循环
                if (m.index === pattern.lastIndex) pattern.lastIndex++;
            }
        }

        return codes;
    }

    // 检查链接是否已包含pwd参数
    function hasPwdParam(url) {
        return /[?&]pwd=[0-9a-zA-Z]{4}/.test(url);
    }

    // 给链接添加pwd参数
    function appendPwd(url, code) {
        // 清理URL末尾可能的空白或特殊字符
        url = url.trim().replace(/[#\s]+$/, '');

        if (url.includes('?')) {
            return url + '&pwd=' + code;
        } else {
            return url + '?pwd=' + code;
        }
    }

    // 计算元素之间的DOM距离
    function getDOMDistance(el1, el2) {
        const rect1 = el1.getBoundingClientRect();
        const rect2 = el2.getBoundingClientRect();

        return Math.sqrt(
            Math.pow(rect1.top - rect2.top, 2) +
            Math.pow(rect1.left - rect2.left, 2)
        );
    }

    // 在容器中查找最近的提取码
    function findCodeInContainer(container, linkElement) {
        // textContent 不触发 layout reflow（innerText 会）；scan 期内缓存复用
        const text = getText(container);
        const codes = extractAllCodes(text);

        if (codes.length === 0) return null;
        if (codes.length === 1) return codes[0].code;

        // 多个提取码时，尝试找最近的
        // 方法：查找链接文本在容器文本中的位置，选择最近的提取码
        const linkText = linkElement.href || '';
        const linkMatch = linkText.match(BAIDU_PAN_REGEX);

        if (linkMatch) {
            const searchText = linkMatch[0];
            const linkIndex = text.indexOf(searchText);

            if (linkIndex !== -1) {
                // 按距离排序
                codes.sort((a, b) => {
                    return Math.abs(a.index - linkIndex) - Math.abs(b.index - linkIndex);
                });
            }
        }

        return codes[0].code;
    }

    // 场景1: 在table中智能查找
    function findCodeInTable(linkElement) {
        const table = linkElement.closest('table');
        if (!table) return null;

        // 1. 优先在同一单元格中查找
        const td = linkElement.closest('td, th');
        if (td) {
            const code = findCodeInContainer(td, linkElement);
            if (code) {
                log('在同一单元格中找到:', code);
                return code;
            }
        }

        // 2. 在同一行中查找
        const tr = linkElement.closest('tr');
        if (tr) {
            const code = findCodeInContainer(tr, linkElement);
            if (code) {
                log('在同一行中找到:', code);
                return code;
            }
        }

        // 3. 在整个表格中查找（如果表格不太大）
        if (table.rows.length <= CONFIG.maxTableRows) {
            const code = findCodeInContainer(table, linkElement);
            if (code) {
                log('在表格中找到:', code);
                return code;
            }
        }

        return null;
    }

    // 场景2: 在div/列表结构中查找
    function findCodeInStructure(linkElement) {
        // 常见的容器标签
        const containerTags = ['DIV', 'LI', 'P', 'ARTICLE', 'SECTION', 'DD', 'BLOCKQUOTE'];

        let parent = linkElement.parentElement;
        let depth = 0;

        while (parent && depth < CONFIG.maxSearchDepth) {
            if (containerTags.includes(parent.tagName)) {
                // 检查当前容器
                const code = findCodeInContainer(parent, linkElement);
                if (code) {
                    log(`在${parent.tagName}(深度${depth})中找到:`, code);
                    return code;
                }

                // 检查相邻兄弟元素（textContent 而非 innerText，避免 layout reflow）
                const siblings = [parent.previousElementSibling, parent.nextElementSibling];
                for (const sibling of siblings) {
                    if (!sibling) continue;
                    const siblingText = getText(sibling);
                    if (siblingText.length < CONFIG.maxSiblingTextLength) {
                        const siblingCode = findCodeInContainer(sibling, linkElement);
                        if (siblingCode) {
                            log('在相邻元素中找到:', siblingCode);
                            return siblingCode;
                        }
                    }
                }
            }

            parent = parent.parentElement;
            depth++;
        }

        return null;
    }

    // 在链接文本本身查找（有些网站把提取码写在链接文字里）
    function findCodeInLinkText(linkElement) {
        const text = linkElement.innerText || linkElement.textContent || '';
        const codes = extractAllCodes(text);

        if (codes.length > 0) {
            log('在链接文字中找到:', codes[0].code);
            return codes[0].code;
        }

        return null;
    }

    // 综合查找提取码
    function findCode(linkElement) {
        // 按优先级依次查找
        return findCodeInLinkText(linkElement)
            || findCodeInTable(linkElement)
            || findCodeInStructure(linkElement);
    }

    // ==================== 视觉反馈 ====================

    function addVisualIndicator(linkElement, code) {
        if (!CONFIG.visualIndicator) return;

        linkElement.dataset.baiduPwd = code;

        if (CONFIG.indicatorStyle === 'underline' || CONFIG.indicatorStyle === 'both') {
            linkElement.style.cssText += `
                border-bottom: 2px dashed #4CAF50 !important;
                text-decoration: none !important;
            `;
        }

        if (CONFIG.indicatorStyle === 'badge' || CONFIG.indicatorStyle === 'both') {
            const badge = document.createElement('span');
            badge.textContent = `[${code}]`;
            badge.style.cssText = `
                display: inline-block;
                background: #4CAF50;
                color: white;
                font-size: 10px;
                padding: 1px 4px;
                border-radius: 3px;
                margin-left: 4px;
                font-family: monospace;
                vertical-align: middle;
            `;
            badge.className = 'baidu-pwd-badge';

            // 避免重复添加
            if (!linkElement.querySelector('.baidu-pwd-badge')) {
                linkElement.appendChild(badge);
            }
        }

        linkElement.title = `提取码: ${code} (已自动添加)`;
    }

    // ==================== 链接处理 ====================

    function processLink(linkElement) {
        // 跳过已处理的
        if (processedLinks.has(linkElement)) return;

        const href = linkElement.href;
        if (!href || !BAIDU_PAN_REGEX.test(href)) return;

        // 标记为已处理
        processedLinks.add(linkElement);

        // 已有pwd参数
        if (hasPwdParam(href)) {
            log('链接已包含提取码:', href);
            return;
        }

        log('处理链接:', href);

        const code = findCode(linkElement);

        if (code) {
            const newHref = appendPwd(href, code);
            linkElement.href = newHref;
            addVisualIndicator(linkElement, code);
            log('已更新:', newHref);
        } else {
            log('未找到提取码');
        }
    }

    // 节流：相邻调用合并，避免 init+多个 processDelay+observer 重复触发全文档扫描
    let lastScanAt = 0;
    let pendingScan = null;
    function processAllLinks() {
        const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
        const elapsed = now - lastScanAt;
        if (elapsed < CONFIG.scanThrottleMs) {
            // 已有 pending 就不再排；否则补排一次到节流窗末尾
            if (!pendingScan) {
                pendingScan = setTimeout(() => {
                    pendingScan = null;
                    processAllLinks();
                }, CONFIG.scanThrottleMs - elapsed);
            }
            return;
        }
        lastScanAt = now;

        textCache = new WeakMap();
        try {
            const links = document.querySelectorAll('a[href*="pan.baidu.com/s/"]');
            log(`扫描到 ${links.length} 个链接`);

            for (const link of links) {
                try {
                    processLink(link);
                } catch (e) {
                    console.error('[百度网盘] 处理出错:', e);
                }
            }
        } finally {
            textCache = null; // 释放本轮缓存，等待 GC
        }
    }

    // ==================== 复制增强 ====================

    // 监听复制事件，确保复制的链接带有提取码
    function setupCopyEnhancement() {
        document.addEventListener('copy', (e) => {
            const selection = window.getSelection();
            if (!selection.rangeCount) return;

            const text = selection.toString();
            if (!BAIDU_PAN_REGEX.test(text)) return;

            // 检查选中的是否是我们处理过的链接
            const anchorNode = selection.anchorNode;
            const linkElement = anchorNode?.parentElement?.closest?.('a[data-baidu-pwd]');

            if (linkElement && linkElement.dataset.baiduPwd) {
                const code = linkElement.dataset.baiduPwd;
                let newText = text;

                if (!hasPwdParam(text)) {
                    newText = appendPwd(text.trim(), code);
                    e.clipboardData.setData('text/plain', newText);
                    e.preventDefault();
                    log('复制增强:', newText);
                }
            }
        });
    }

    // ==================== DOM监听 ====================

    function observeDOM() {
        // 性能要点：原实现对每个 mutation 的每个 addedNode 跑 querySelector
        // → 在 Twitter/Facebook 这类高频 mutate 站点 CPU 飙高。
        // 改为：mutation 命中即"约 scan 一次"（节流由 processAllLinks 自身保证），
        // 把 N 次子树查询合并为 1 次 document 级 querySelectorAll。
        let scheduled = false;
        const schedule = () => {
            if (scheduled) return;
            scheduled = true;
            setTimeout(() => {
                scheduled = false;
                processAllLinks();
            }, CONFIG.observerDebounceMs);
        };

        const observer = new MutationObserver(schedule);
        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }

    // ==================== 菜单命令 ====================

    function registerMenuCommands() {
        if (typeof GM_registerMenuCommand === 'function') {
            GM_registerMenuCommand('🔄 重新扫描页面', processAllLinks);
            GM_registerMenuCommand('🐛 切换调试模式', () => {
                CONFIG.debug = !CONFIG.debug;
                alert(`调试模式: ${CONFIG.debug ? '开启' : '关闭'}`);
            });
        }
    }

    // ==================== 初始化 ====================

    function init() {
        log('脚本启动');

        // 注册菜单
        registerMenuCommands();

        // 设置复制增强
        setupCopyEnhancement();

        // 处理现有链接
        processAllLinks();

        // 监听DOM变化
        observeDOM();

        // 延迟处理（应对懒加载）
        CONFIG.processDelay.forEach(delay => {
            setTimeout(processAllLinks, delay);
        });
    }

    // 启动
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();