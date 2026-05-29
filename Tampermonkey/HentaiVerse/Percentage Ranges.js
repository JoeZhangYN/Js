// ==UserScript==
// @name             Percentage Ranges
// @description      Stats to %
// @namespace        https://gist.github.com/hvscripts
// @version          1.1.9
// @author           剑行血间, SIRIUSs
// @homepage         https://forums.e-hentai.org/index.php?showuser=5363065
// @match            *://hentaiverse.org/isekai/*
// @match            *://alt.hentaiverse.org/isekai/*
// @match            https://forums.e-hentai.org/*
// @icon           https://hentaiverse.org/y/favicon.png
// @updateURL        https://gist.githubusercontent.com/hvscripts/2ecad2b7e2f681ab84ab5dee3509b194/raw/Percentage_Ranges.js
// @downloadURL      https://gist.githubusercontent.com/hvscripts/2ecad2b7e2f681ab84ab5dee3509b194/raw/Percentage_Ranges.js
// @connect          hentaiverse.org
// @connect          alt.hentaiverse.org
// @grant            GM_setValue
// @grant            GM_getValue
// @grant            GM_xmlhttpRequest
// @grant            GM_addStyle
// @run-at           document-end
// ==/UserScript==

(function () {
    'use strict';

    // Configuration, use false replace true to disable some features
    const CONFIGS = {
        /** @type {'current' | QualityKey} */
        default_quality: 'current', // 'current' | 'Legendary' | 'Magnificent' | 'Exquisite' ...
        key_toggle: 'f',
        key_pin: 'q',
        key_forge: 'w',
        key_delete: 'delete',
        key_link: 'l',
        enable_on_forums: true,
    };

    /**
     * @typedef {keyof typeof QUALITY_CONFIG} QualityKey
     * @typedef {{range:[number, number], cap: number}} QualityConfig
     * @satisfies {Object.<string, QualityConfig>}
     */
    const QUALITY_CONFIG = {
        Peerless: { range: [200, 200], cap: 50 },
        Legendary: { range: [170, 200], cap: 40 },
        Magnificent: { range: [150, 180], cap: 30 },
        Exquisite: { range: [120, 160], cap: 20 },
        Superior: { range: [90, 130], cap: 20 },
        Average: { range: [60, 100], cap: 20 },
        Fair: { range: [30, 70], cap: 20 },
        Crude: { range: [0, 40], cap: 20 },
    };


    /** @satisfies {Record<string, HTMLButtonElement>} */
    const UI_BUTTONS = {
        get PERCENT() {
            return createBtn({
                text: '%',
                onclick: actionTogglePercent,
                style: 'font-weight: bold;',
            });
        },
        get FORGE() {
            return createBtn({
                text: '🔨',
                onclick: actionToggleForge,
            });
        },
    };

    GM_addStyle(`
        .hv-lpr-avg {
            padding: 2px;
            font-size:12px; font-weight: bold;
        }
        .hv-txt-red { color: #f03939ff; }
        .hv-txt-green { color: #0ab844ff; }
        .hv-txt-mid { color: #1d3271ff; }
    `);

    const REGEX_VAL = /^(\d+(?:\.\d+)?)(?:\s+(.+))?$/;
    const REGEX_BASE = /Base:\s*([+-]?[\d.]+)/i;
    const REGEX_TIER = /Tier\s+(\d+)\s*\/\s*(\d+)\s*\/\s*(\d+)/i;
    const REGEX_DAMAGE = /^(Magic|Attack|Void|Crushing|Piercing|Slashing) Damage/;

    const state = {
        showPercent: GM_getValue('showPercent', true),
        showMaxForge: false,
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
        ),
    };

    /**
     * @typedef {Object} EquipBase
     * @property {string} title
     * @property {QualityKey} quality
     * @property {[number, number]} range
     * @property {number} forge_max
     * @property {'Soulbound' | 'Tradeable'} type
     * @property {Stat[]} stats
     * @property {HTMLElement} _eq
     * @property {HTMLElement} _avg
     */

    /**
     * @typedef {EquipBase & { type: 'Soulbound', tier_up: number, tier_iw: number, tier_max: number, _eqt: Element }} SoulboundItem
     * @typedef {EquipBase & { type: 'Tradeable', level: number}} TradeableItem
     * @typedef {SoulboundItem | TradeableItem} EquipData
     */

    /**
     * @typedef {Object} Stat
     * @property {string} title
     * @property {number} val
     * @property {string} valStr
     * @property {number | null} base
     * @property {1 | 2} rate
     * @property {string | null} prefix
     * @property {string | null} suffix
     * @property {string | null} typeText
     * @property {HTMLElement} _el
     * @property {Node | null} _preNode
     * @property {Node | null} _sufNode
     */

    /** @type {WeakMap<HTMLElement, EquipData>} */
    const equipMap = new WeakMap();

    /** @param {HTMLElement} container */
    const parseEquip = (container) => {
        if ($(container, '.hv-lpr-avg')) return;
        const eq = $(container, '.eq');
        const eqt = $(container, '.eqt');
        if (!eq || !eqt) return;

        const title = container.firstElementChild?.textContent.trim();
        if (!title) return;

        const found = /** @type {Array<[QualityKey, QualityConfig]>} */ (
            Object.entries(QUALITY_CONFIG)
        ).find(([key]) => title.startsWith(key));
        if (!found) return;

        const [quality, { range, cap }] = found;

        /** @type {Stat[]} */
        const stats = [];

        const rows = [
            ...eq.querySelectorAll('.ex > div, .ep > div'),
            ...Array.from(eq.querySelectorAll('[title^="Base: "]')).filter(
                (el) => !el.closest('.ex, .ep')
            ),
        ];

        for (const row of rows) {
            const span = row.querySelector('span');
            if (!span) continue;

            // 810 Slashing Damage, 34.24
            const match = span.textContent.trim().match(REGEX_VAL);
            if (!match) continue;

            const [_, valStr, typeText] = match;
            const name = typeText || row.firstElementChild?.textContent.trim();
            if (!name) continue;

            const baseMatch = row.getAttribute('title')?.match(REGEX_BASE);
            const prefixNode = span.previousSibling;
            const suffixNode = span.parentNode?.nextSibling || null;

            stats.push({
                title: name,
                val: parseFloat(valStr),
                valStr,
                base: baseMatch ? parseFloat(baseMatch[1]) : null,
                rate: REGEX_DAMAGE.test(name) ? 2 : 1,
                prefix: prefixNode?.nodeType === 3 ? prefixNode.textContent : '',
                suffix: suffixNode?.textContent || null,
                typeText,
                _el: span,
                _preNode: prefixNode,
                _sufNode: suffixNode,
            });
        }

        // create avg node
        const avg = el('div', {
            class: 'hv-lpr-avg',
            style: container.closest('#popup_box')
            ? 'position: absolute; bottom: 4px; left: 0; right: 0; text-align :center;'
            : undefined,
        });
        container.appendChild(avg);

        // Tier X / Y / Z
        const tierMatch = eqt.textContent.match(REGEX_TIER);

        /** @type {EquipData} */
        const equip = {
            title,
            quality,
            range,
            stats,
            _eq: eq,
            _avg: avg,
            ...(tierMatch
                ? {
                type: 'Soulbound',
                tier_up: +tierMatch[1],
                tier_iw: +tierMatch[2],
                tier_max: +tierMatch[3],
                forge_max: +tierMatch[3] * 2,
                _eqt: eqt,
            }
                : {
                type: 'Tradeable',
                level: +(eqt.textContent.match(/Level (\d+)/i)?.[1] || 0),
                forge_max: cap,
            }),
        };

        // console.log(equip);
        equipMap.set(container, equip);

        const excludePatterns = [
            '?s=Character&ss=eq',
            '?s=Battle&ss=iw',
            '?s=Bazaar&ss=am&screen=modify&',
        ];

        const showCompare =
              /^(\/isekai)?\/equip/.test(location.pathname) ||
              (document.getElementById('equipinfo')?.contains(container) &&
               location.search !== '' &&
               excludePatterns.every((pattern) => !location.search.includes(pattern)));

        let compareQuality = null;

        // inject compare select
        if (showCompare) {
            const initQuality =
                  CONFIGS.default_quality === 'current' ? quality : CONFIGS.default_quality;

            if (initQuality !== quality) {
                compareQuality = initQuality;
            }

            const select = el(
                'select',
                {
                    id: 'hv-quality-compare',
                    onchange: () =>
                    renderEquip(container, /** @type {QualityKey} */ (select.value)),
                },
                Object.keys(QUALITY_CONFIG).map((k) =>
                                                el('option', { value: k, selected: k === initQuality }, [k])
                                               )
            );

            container.appendChild(
                el('div', { style: 'padding: 6px; border-top: 1px solid #A47C78;' }, [
                    el('b', {}, ['与其他稀有度对比: ']),
                    select,
                    ...(state.isMobile ? [UI_BUTTONS.PERCENT, UI_BUTTONS.FORGE] : []),
                ])
            );
        }

        renderEquip(container, compareQuality);
    };

    const charmExclusiveBonus = ['HP Bonus', 'MP Bonus', 'Counter-parry'];

    /**
     * @param {HTMLElement} container
     * @param {QualityKey | null} compareQuality
     */
    const renderEquip = (container, compareQuality = null) => {
        const equip = equipMap.get(container);
        if (!equip) return;

        const { showPercent, showMaxForge } = state;

        if (equip.type === 'Soulbound') {
            const { tier_up: up, tier_iw: iw, tier_max: max } = equip;

            // Tier X / Y / Z -> X(+A) | Y(+B) / Z
            if (showMaxForge && (max - up > 0 || max - iw > 0)) {
                const diffX =
                      max - up > 0 ? `${up}<span class="hv-txt-green">+${max - up}</span>` : max;
                const diffY =
                      max - iw > 0 ? `${iw}<span class="hv-txt-green">+${max - iw}</span>` : max;
                equip._eqt.innerHTML = `Tier ${diffX} / ${diffY} / ${max}`;
            } else {
                equip._eqt.textContent = `Tier ${up} / ${iw} / ${max}`;
            }
        }

        let totalPercent = 0;
        let statCount = 0;

        let realKey = compareQuality;
        // 定义中文到英文的映射
        const cnMap = {
            '☯无双☯': 'Peerless', '✪传奇✪': 'Legendary', '☆史诗☆': 'Magnificent',
            '✧精良✧': 'Exquisite', '上等': 'Superior', '中等': 'Average',
            '劣质': 'Fair', '粗糙': 'Crude'
        };
        // 如果是中文，转换为对应的英文键名
        if (cnMap[realKey]) {
            realKey = cnMap[realKey];
        }
        // 使用转换后的 realKey 去查找配置
        const [min, max] = compareQuality ? QUALITY_CONFIG[realKey].range : equip.range;


        const forge_current = equip.type === 'Soulbound' ? equip.tier_up + equip.tier_iw : 0;

        /**
         * @param {number} percent
         * @param {number} [max]
         * @param {number} [min]
         */
        const getColor = (percent, max = 70, min = 30) =>
        percent >= max ? 'hv-txt-green' : percent <= min ? 'hv-txt-red' : 'hv-txt-mid';

        equip.stats.forEach((stat) => {
            const el = stat._el;
            el.classList.remove('hv-txt-red', 'hv-txt-green', 'hv-txt-mid');

            let percent = null;
            if (stat.base !== null) {
                const span = max - min || 30;
                percent = parseFloat((((stat.base - (max - span)) / span) * 100).toFixed(1));
                totalPercent += percent;
                statCount++;
            }

            const isForgeMode =
                  showMaxForge &&
                  equip.forge_max > forge_current &&
                  !charmExclusiveBonus.includes(stat.title);
            const isPercentMode = showPercent && !isForgeMode && percent !== null;

            // remove/restore '+' 'x' '%'
            const hideSurrounding = isForgeMode || isPercentMode;
            if (stat._preNode) {
                stat._preNode.textContent = hideSurrounding ? '' : stat.prefix;
            }
            if (stat._sufNode && !stat.typeText) {
                stat._sufNode.textContent = hideSurrounding ? '' : stat.suffix;
            }

            const typeText = stat.typeText ? ` ${stat.typeText}` : '';

            if (isForgeMode) {
                const maxVal =
                      (stat.val * (1 + (equip.forge_max * stat.rate) / 100)) /
                      (1 + (forge_current * stat.rate) / 100);
                const gainText = Math.round((maxVal - stat.val) * 100) / 100;
                el.innerHTML = `${stat.valStr}<span class="hv-txt-green">+${gainText}</span>${typeText}`;
            } else if (isPercentMode && percent !== null) {
                el.textContent = `${percent}%${typeText}`;
                el.classList.add(getColor(percent));
            } else {
                el.textContent = `${stat.valStr}${typeText}`;
            }
        });

        if (equip._avg) {
            if (statCount > 0) {
                const avg = parseFloat((totalPercent / statCount).toFixed(1));
                const mode = showMaxForge ? '最大强化(按W返回F切换)' : showPercent ? '百分比(按F返回W切换)' : '数值(按F返回W切换)';

                equip._avg.innerHTML =
                    `<div class="${getColor(avg, 60, 40)}" style="margin-bottom: 4px;">优秀度: ${avg}%</div>` +
                    `<div style="font-size: 12px;" title="热键: f, w">显示模式: ${mode}</div>`;
            } else {
                equip._avg.textContent = '';
            }
        }
    };

    const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
            if (m.type === 'childList') {
                for (const node of m.addedNodes) {
                    if (!(node instanceof HTMLElement)) return;
                    if (!node.classList.contains('showequip')) return;
                    parseEquip(node);
                }
            } else if (m.type === 'attributes' && m.attributeName === 'style') {
                const target = m.target;
                if (!(target instanceof HTMLElement)) return;
                if (target.style.visibility === 'visible') {
                    parseEquip(target);
                }
            }
        }
    });

    const popup = document.getElementById('popup_box');
    if (popup) observer.observe(popup, { attributes: true });

    const equipInfo = document.getElementById('equipinfo');
    if (equipInfo) observer.observe(equipInfo, { childList: true });

    // Initial check
    $$('.showequip').forEach(parseEquip);

    function actionTogglePercent() {
        // pressing toggle (f) should always exit MaxForge mode
        if (state.showMaxForge) state.showMaxForge = false;

        state.showPercent = !state.showPercent;
        GM_setValue('showPercent', state.showPercent);

        renderAll();
    }

    function actionToggleForge() {
        // toggle max forge mode; when enabling it, exit percentage mode
        state.showMaxForge = !state.showMaxForge;
        if (state.showMaxForge) state.showPercent = false;

        renderAll();
    }

    function renderAll() {
        if (popup?.style.visibility === 'visible') renderEquip(popup);

        $$('.showequip').forEach((el) => {
            const select = el.querySelector('select');
            renderEquip(el, select ? /** @type {QualityKey} */ (select.value) : null);
        });
    }

    /** @param {KeyboardEvent} e */
    const isValidKey = (e) => {
        if (e.repeat || e.ctrlKey || e.altKey || e.metaKey) return false;

        const target = /** @type {HTMLElement | null} */ (e.target);
        if (!target) return false;

        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) return false;

        return true;
    };

    const REGEX_TARGET = /^https?:\/\/(alt\.)?hentaiverse\.org\/((isekai\/)?equip|r\/)/;

    document.addEventListener(
        'keydown',
        (e) => {
            if (!isValidKey(e)) return;

            const key = e.key.toLowerCase();

            if (key === CONFIGS.key_toggle) {
                e.preventDefault();
                actionTogglePercent();
            } else if (key === CONFIGS.key_forge) {
                e.preventDefault();
                actionToggleForge();
            } else if (key === CONFIGS.key_link) {
                if (!REGEX_TARGET.test(location.href)) return;

                const equip = equipMap.get($$('.showequip')[0]);
                if (!equip) return;

                window.prompt(
                    'Forum Link:',
                    '[url=' + location.href + ']' + equip.title + '[/url]'
                );
            }
        },
        true
    );

    if (CONFIGS.enable_on_forums && !/hentaiverse\.org/.test(location.hostname)) {
        const CACHE_PREFIX = 'HvPerc_';

        /** @param {string} url */
        const getCache = (url) => sessionStorage.getItem(CACHE_PREFIX + url);
        /**
         * @param {string} url
         * @param {string} data
         */
        const setCache = (url, data) => {
            const save = () => sessionStorage.setItem(CACHE_PREFIX + url, data);
            try {
                save();
            } catch (e) {
                console.warn('SessionStorage is full, cache failed');
                Object.keys(sessionStorage)
                    .filter((k) => k.startsWith(CACHE_PREFIX))
                    .forEach((k) => sessionStorage.removeItem(k));
                console.info('Cleared cache, retrying...');
                try {
                    save();
                } catch (e) {
                    console.error('Retry failed', e);
                }
            }
        };

        /** @type {HTMLAnchorElement | null} */
        let curLink = null;

        /** @param {string} url */
        const fetchData = (url) =>
        GM_xmlhttpRequest({
            method: 'GET',
            url: url.replace(/^http:/, 'https:'),
            headers: { Origin: 'https://hentaiverse.org' },
            onload: (res) => {
                try {
                    const doc = new DOMParser().parseFromString(res.responseText, 'text/html');
                    // Remove dropped by
                    doc.querySelector('div[style*="border-top"] p')?.remove();

                    // TODO: remove #showequip
                    const content = doc.querySelector('.showequip, #showequip');
                    if (!content) return renderTooltip({ err: doc.body.textContent }, url);

                    // Add link for title
                    const titleDiv = content.firstElementChild;
                    if (titleDiv && !titleDiv.querySelector('a')) {
                        const link = el('a', {
                            href: url,
                            target: '_blank',
                            style: 'color: inherit; text-decoration: none; cursor: pointer',
                        });
                        link.append(...titleDiv.childNodes);
                        titleDiv.replaceChildren(link);
                    }

                    setCache(url, content.outerHTML);

                    if (curLink && curLink.href === url) {
                        renderTooltip({ html: content.outerHTML }, url);
                    }
                } catch (err) {
                    console.error('Failed to parse tooltip response', err);
                    renderTooltip({ err: 'Parse Error' }, url);
                }
            },
            onerror: () => renderTooltip({ err: 'Network Error' }, url),
        });

        /** @type {HTMLDivElement | null} */
        let tip = null;
        /** @type {number | null} */
        let hoverTimer;
        /** @type {number | null} */
        let hideTimer;

        let isTouch = false;

        const clearHoverTimer = () => {
            if (hoverTimer) {
                clearTimeout(hoverTimer);
                hoverTimer = null;
            }
        };
        const cleanHideTimer = () => {
            if (hideTimer) {
                clearTimeout(hideTimer);
                hideTimer = null;
            }
        };

        const hideTip = () => {
            if (tip) tip.style.display = 'none';
        };

        /**
         * TODO: remove param _url
         * @param {{ html: string } | { err: string }} data
         * @param {string} [_url]
         */
        const renderTooltip = (data, _url = '') => {
            if (!tip) {
                tip = el('div', {
                    style: 'display: none; z-index: 10000;',
                    class: _url.includes('/isekai/') ? 'hv-tip' : 'hv-tip hv-tip-persistent',
                    onmouseenter: () => cleanHideTimer(),
                    onmouseleave: () => {
                        hideTimer = setTimeout(() => {
                            curLink = null;
                            hideTip();
                        }, 200);
                    },
                });

                document.body.appendChild(tip);
            }

            if ('err' in data) {
                tip.innerHTML = `<div class="hv-err">${data.err}</div>`;
            } else {
                tip.innerHTML = data.html;

                const eq = /** @type {HTMLElement} */ (tip.firstElementChild);
                if (!eq) return;

                if (_url.includes('/isekai/')) {
                    parseEquip(eq);

                    if (state.isMobile) {
                        const pinBtn = createBtn({
                            text: '📌',
                            onclick: actionPinWindow,
                        });
                        eq.append(UI_BUTTONS.PERCENT, UI_BUTTONS.FORGE, pinBtn);
                    }
                }
            }

            if (!curLink) return;
            tip.style.display = 'block';

            const rect = curLink.getBoundingClientRect();
            const tRect = tip.getBoundingClientRect();

            let top;
            let left;

            if (isTouch) {
                top = rect.top - tRect.height - 20;
                left = (window.innerWidth - tRect.width) / 2;
            } else {
                top = rect.top + 10;
                left = rect.right + 10;
            }

            if (left + tRect.width > window.innerWidth) {
                left = rect.left - tRect.width - 10;
                if (left < 0) left = 5;
            }
            if (top + tRect.height > window.innerHeight) {
                if (top < 0) {
                    top = rect.bottom + 10;
                } else {
                    top = window.innerHeight - tRect.height - 10;
                }
            }

            tip.style.top = `${Math.max(5, top)}px`;
            tip.style.left = `${Math.max(5, left)}px`;
        };

        document.addEventListener('mouseover', (e) => {
            if (isTouch) return;

            const target = /** @type {HTMLElement} */ (e.target);
            const link = target.closest('a');
            if (!link) return;

            if (
                link.closest('.hv-tip') ||
                link.closest('.hv-pin-box') ||
                // TODO: remove
                link.closest('.hv-tip-persistent')
            ) {
                return;
            }

            const url = link.href.replace(/^http:/, 'https:');
            if (!REGEX_TARGET.test(url)) return;

            cleanHideTimer();
            clearHoverTimer();
            hideTip();

            curLink = link;

            const cached = getCache(url);
            if (cached) {
                renderTooltip({ html: cached }, url);
            } else {
                hoverTimer = setTimeout(() => fetchData(url), 200);
            }
        });

        document.addEventListener('mouseout', (e) => {
            if (!curLink || isTouch) return;

            const related = /** @type {Node} */ (e.relatedTarget);
            if (curLink.contains(related) || tip?.contains(related)) return;

            const link = /** @type {Element} */ (e.target).closest('a');
            if (link === curLink) {
                clearHoverTimer();
                hideTimer = setTimeout(() => {
                    curLink = null;
                    hideTip();
                }, 200);
            }
        });

        document.addEventListener(
            'touchstart',
            (e) => {
                isTouch = true;
                const target = /** @type {HTMLElement} */ (e.target);

                if (tip && tip.style.display !== 'none' && !tip.contains(target)) {
                    hideTip();
                }

                const link = target.closest('a');
                if (!link) return;

                const url = link.href.replace(/^http:/, 'https:');
                if (!REGEX_TARGET.test(url)) return;

                curLink = link;
                if (hoverTimer) clearTimeout(hoverTimer);

                hoverTimer = setTimeout(() => {
                    const cached = getCache(url);
                    if (cached) renderTooltip({ html: cached }, url);
                    else fetchData(url);
                }, 500);
            },
            { passive: true }
        );

        document.addEventListener('touchend', clearHoverTimer);
        document.addEventListener('touchmove', clearHoverTimer);

        document.addEventListener('contextmenu', (e) => {
            if (isTouch) {
                const target = /** @type {HTMLElement} */ (e.target);
                const link = target.closest('a');

                if (link && REGEX_TARGET.test(link.href.replace(/^http:/, 'https:'))) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }
        });

        let zIndex = 10002;

        function actionPinWindow() {
            if (!tip || !(tip.style.display !== 'none') || !curLink) return;

            const url = curLink.href;
            if (document.querySelector(`.hv-pin-box[data-url="${url}"]`)) return;

            hideTip();

            // TODO: remove hv-tip-persistent
            const pinWin = el('div', {
                class: `hv-pin-box hv-tip${url.includes('/isekai/') ? '' : ' hv-tip-persistent'}`,
                dataset: { url },
                style: `position:fixed;
                        top: ${tip.style.top}; left: ${tip.style.left};
                        z-index:${++zIndex};`,
                onmousedown: () => (pinWin.style.zIndex = String(++zIndex)),
                ontouchstart: () => {
                    pinWin.style.zIndex = String(++zIndex);
                },
            });

            const closeBtn = el(
                'span',
                {
                    class: 'hv-pin-close',
                    style: 'cursor: pointer; font-family: monospace;',
                    onclick: () => pinWin.remove(),
                    onpointerdown: (e) => e.stopPropagation(),
                },
                ['[X]']
            );

            const header = el(
                'div',
                {
                    class: 'hv-pin-header',
                    style: 'touch-action: none; user-select: none;',
                    onpointerdown: (e) => {
                        if (e.button !== 0 || !e.isPrimary) return;
                        e.preventDefault();

                        const target = /** @type {HTMLElement} */ (e.currentTarget);

                        target.setPointerCapture(e.pointerId);

                        const startX = e.clientX;
                        const startY = e.clientY;
                        const { left, top } = pinWin.getBoundingClientRect();

                        /** @param {PointerEvent} ev */
                        const onMove = (ev) => {
                            pinWin.style.left = left + (ev.clientX - startX) + 'px';
                            pinWin.style.top = top + (ev.clientY - startY) + 'px';
                        };

                        /** @param {PointerEvent} ev */
                        const onUp = (ev) => {
                            target.onpointermove = null;
                            target.onpointerup = null;
                            target.releasePointerCapture(ev.pointerId);
                        };

                        target.onpointermove = onMove;
                        target.onpointerup = onUp;
                    },
                },
                [el('span', {}, ['Pinned']), closeBtn]
            );

            const content = el('div', {
                class: 'hv-pin-body',
                innerHTML: getCache(url) || tip.innerHTML,
            });

            const eq = /** @type {HTMLElement | null} */ (content.firstElementChild);
            if (!eq) return;

            parseEquip(eq);

            if (state.isMobile) {
                content.append(UI_BUTTONS.PERCENT, UI_BUTTONS.FORGE);
            }

            pinWin.appendChild(header);
            pinWin.appendChild(content);
            document.body.appendChild(pinWin);
        }

        document.addEventListener('keydown', (e) => {
            if (!isValidKey(e)) return;

            const key = e.key.toLowerCase();

            if (key === CONFIGS.key_pin) {
                actionPinWindow();
            } else if (key === CONFIGS.key_delete) {
                $$('.hv-pin-box:hover').forEach((w) => w.remove());
            }
        });

        GM_addStyle(`
            .hv-tip {
                position: fixed;
                width: 420px;
                font-size: 8pt; font-family: verdana; text-align: center;
                color: #5C0D11;
                background-color: #E3E0D1;
                padding: 4px 0;
                border: 1px solid #5C0D11;
            }
            .hv-tip p { margin: 0; }
            .hv-tip .showequip>div {
                margin: 3px auto 0;
                padding: 1px;
            }
            .hv-tip .showequip > div:first-child,
            .hv-tip .eq span,
            .hv-tip .eqt,
            .hv-tip .eqr,
            .hv-tip .eqc{ font-weight: bold; }
            .hv-tip .showequip > div:first-child {
                border-bottom: 1px solid #A47C78;
                font-size: 10pt;
                padding: 2px 0 4px;
            }
            .hv-tip .eq>div {
                margin: 1px auto;
                padding: 1px;
                text-align: center;
                min-height: 17px;
            }
            .hv-tip .eqt, .hv-tip .eqr {
                font-size: 110%;
            }
            .hv-tip .ex, .hv-tip .ep {
                display: grid;
                gap: 2px 5px;
                justify-items: center;
            }
            .hv-tip .ex {
                grid-template-columns: repeat(2,1fr);
                border-top: 1px solid #A47C78;
                text-align: right !important;
            }
            .hv-tip .ex>div {
                width: 165px;
                height: 18px;
            }
            .hv-tip .ex>div>div:nth-child(1) {
                float: left;
                width: 99px;
                padding: 2px;
                white-space: nowrap;
            }
            .hv-tip .ex>div>div:nth-child(2) {
                float: left;
                width: 45px;
                padding: 2px 0 2px 2px;
            }
            .hv-tip .ex>div>div:nth-child(3) {
                float: left;
                width: 6px;
                padding: 2px;
            }
            .hv-tip .ep>div {
                width: 115px;
                height: 18px;
            }
            .hv-tip .ep>div:first-child {
                font-weight: bold;
                margin: 4px auto 0 !important;
                width: 320px !important;
                grid-column: 1 / -1;
            }
            .hv-tip .ep>div>div:nth-child(1) {
                float: left;
                width: 60px;
                padding: 2px;
                text-align: right; white-space: nowrap;
            }
            .hv-tip .ep>div>div:nth-child(2) {
                float: left;
                width: 45px;
                padding: 2px 0 2px 2px;
                text-align: left;
            }
            .hv-tip .ep1 {
                grid-template-columns: repeat(1,1fr);
            }
            .hv-tip .ep2 {
                grid-template-columns: repeat(2,1fr);
            }
            .hv-tip .ep3 {
                grid-template-columns: repeat(3,1fr);
            }
            .hv-tip a:link, .hv-tip a:visited, .hv-tip a:active {
                color: #5C0D11;
            }
            .hv-err {
                padding: 10px;
                color: #FF2323;
                font-weight: bold;
            }
            .hv-pin-box {
                display: flex;
                flex-direction: column;
                border: 1px solid #5C0D11;
                box-shadow: 0 4px 10px rgba(0,0,0,0.4);
                z-index: 10001;
                padding: 0;
            }
            .hv-pin-header {
                background-color: #5C0D11;
                color: #EDEBDF;
                padding: 3px 6px;
                cursor: move;
                display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;
                font-size: 10px; font-weight: bold;
                user-select: none;
            }
            .hv-pin-close:hover {
                color: #FF6666;
            }
            .hv-pin-body {
                padding: 4px 0;
                overflow: auto;
                max-height: 80vh;
            }

            .hv-tip-persistent #showequip > div:first-child {
                font-weight: bold;
                font-size: 120%;
                border-bottom: 1px solid #A47C78;
            }
            .hv-tip-persistent .eq>div:nth-child(1),
            .hv-tip-persistent .eq>div:nth-child(2),
            .hv-tip-persistent #equip_extended>div:last-child>div {
                font-size: 110%;
                font-weight: bold;
            }
            .hv-tip-persistent .ex, .hv-tip .ep {
                padding-top: 3px !important;
                margin: 2px auto 0 !important;
                display: flex; justify-content: center; flex-flow: row wrap;
            }
            .hv-tip-persistent #equip_extended>div:last-child {
                margin: 7px auto 2px;
                text-align: center;
            }
            .hv-tip-persistent #eu>span,
            .hv-tip-persistent .es>div:first-child>span {
                color: red;
            }
            .hv-tip-persistent #ep>span {
                color: blue;
            }
        `);
    }

    /**
     * @param {HTMLElement} container
     * @param {string} selector
     * @returns {HTMLElement | null}
     */
    function $(container, selector) {
        return container.querySelector(selector);
    }

    /**
     * @param {string} selector
     * @returns {NodeListOf<HTMLElement>}
     */
    function $$(selector) {
        return document.querySelectorAll(selector);
    }

    /**
     * Helper to create DOM elements
     * @template {keyof HTMLElementTagNameMap} K
     * @param {K} tag
     * @param {Omit<Partial<HTMLElementTagNameMap[K]>, 'style'> & {
     * class?: string;
     * style?: string | Partial<CSSStyleDeclaration>;
     * dataset?: Record<string, string>;
     * }} [props]
     * @param {(Node | string | number | boolean | null | undefined)[]} [children]
     * @returns {HTMLElementTagNameMap[K]}
     */
    function el(tag, props = /** @type {any} */ ({}), children = []) {
        const e = document.createElement(tag);

        Object.entries(props).forEach(([k, v]) => {
            if (v === undefined || v === null || v === false) return;

            if (k === 'style' && typeof v === 'object') {
                Object.assign(e.style, v);
            } else if (k === 'dataset' && typeof v === 'object') {
                Object.assign(e.dataset, v);
            } else if (k.startsWith('on') && typeof v === 'function') {
                // @ts-expect-error
                e[k.toLowerCase()] = v;
            } else if (k in e) {
                // @ts-expect-error
                e[k] = v;
            } else {
                e.setAttribute(k, String(v));
            }
        });

        if (children.length > 0) {
            const fragment = document.createDocumentFragment();
            children.forEach((c) => {
                if (c != null && typeof c !== 'boolean') {
                    fragment.append(typeof c === 'number' ? String(c) : c);
                }
            });
            e.append(fragment);
        }

        return e;
    }

    /**
     * @param {Omit<Partial<HTMLElementTagNameMap['button']>, 'style'> & {
     * text: string; class?: string; style?: string;
     * }} config
     */
    function createBtn(config) {
        return el(
            'button',
            {
                type: 'button',
                class: config.class,
                style: `margin-left: 5px;
                        cursor: pointer !important;
                        transition: color 0.2s;
                        border: none;
                        background: transparent;
                        ${config.style ?? ''}`,
                onclick: config.onclick,
            },
            [config.text]
        );
    }
})();