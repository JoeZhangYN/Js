// ==UserScript==
// @name         百度网盘提取码自动拼接
// @namespace    http://tampermonkey.net/
// @version      2.0.1
// @description  自动检测页面中的百度网盘链接，智能查找并拼接提取码
// @author       JoeZhangYN
// @match        *://*/*
// @exclude      https://pan.baidu.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=baidu.com
// @grant        GM_setClipboard
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function() {
    'use strict';

    // ==================== 配置项 ====================
    const CONFIG = {
        debug: false,                    // 调试模式
        maxSearchDepth: 10,              // 向上查找的最大层级
        maxTableRows: 50,                // 表格超过此行数时不全局搜索
        maxSiblingTextLength: 500,       // 相邻元素文本超过此长度时跳过
        visualIndicator: true,           // 是否显示视觉标识
        indicatorStyle: 'underline',     // 标识样式: 'underline' | 'badge' | 'both'
        autoProcess: true,               // 自动处理
        processDelay: [500, 2000, 5000], // 延迟处理时间点(ms)
    };

    // ==================== 工具函数 ====================
    const log = (...args) => CONFIG.debug && console.log('[百度网盘]', ...args);

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

    // 已处理的链接集合（防止重复处理）
    const processedLinks = new WeakSet();

    // ==================== 核心函数 ====================

    // 从文本中提取所有可能的提取码
    function extractAllCodes(text) {
        if (!text) return [];

        const codes = [];
        const seen = new Set();

        for (const pattern of CODE_PATTERNS) {
            const matches = text.matchAll(new RegExp(pattern, 'g'));
            for (const match of matches) {
                const code = match[1];
                if (!seen.has(code)) {
                    seen.add(code);
                    codes.push({
                        code,
                        index: match.index,
                        pattern: pattern.source
                    });
                }
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
        const text = container.innerText || container.textContent;
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

                // 检查相邻兄弟元素
                const siblings = [parent.previousElementSibling, parent.nextElementSibling];
                for (const sibling of siblings) {
                    if (sibling && sibling.innerText?.length < CONFIG.maxSiblingTextLength) {
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

    function processAllLinks() {
        const links = document.querySelectorAll('a[href*="pan.baidu.com/s/"]');
        log(`扫描到 ${links.length} 个链接`);

        links.forEach(link => {
            try {
                processLink(link);
            } catch (e) {
                console.error('[百度网盘] 处理出错:', e);
            }
        });
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
        let timeout = null;

        const observer = new MutationObserver((mutations) => {
            let hasNewContent = false;

            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType !== 1) continue;

                    if (node.tagName === 'A' && node.href?.includes('pan.baidu.com/s/')) {
                        hasNewContent = true;
                        break;
                    }
                    if (node.querySelector?.('a[href*="pan.baidu.com/s/"]')) {
                        hasNewContent = true;
                        break;
                    }
                }
                if (hasNewContent) break;
            }

            if (hasNewContent) {
                // 防抖处理
                clearTimeout(timeout);
                timeout = setTimeout(processAllLinks, 200);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
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