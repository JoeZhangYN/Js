// ==UserScript==
// @name         二维码自动解析 (增强版)
// @description  悬停自动识别二维码，支持快捷键触发深度扫描和框选
// @namespace    http://tampermonkey.net/
// @require      https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js
// @require      https://unpkg.com/@zxing/library@latest/umd/index.min.js
// @match        *://*/*
// @grant        GM_setClipboard
// @grant        GM_openInTab
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @run-at       document-start
// @version      3.3
// @author       JoeZhangYN
// @license      GPLv3
// ==/UserScript==

/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                         📱 二维码自动解析 - 使用说明                           ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║                                                                              ║
 * ║  【自动扫描】                                                                 ║
 * ║  • 鼠标悬停在图片上时自动进行快速扫描（仅扫描全图，不影响浏览）                 ║
 * ║  • 识别成功后显示结果，失败则静默结束                                          ║
 * ║                                                                              ║
 * ║  【识别成功后的操作】                                                          ║
 * ║  ┌─────────────────┬────────────────────────────────────────────────────┐   ║
 * ║  │ 左键单击        │ 如果是链接则打开，否则复制内容到剪贴板               │   ║
 * ║  │ 左键长按(0.5秒) │ 复制链接到剪贴板（不打开）                           │   ║
 * ║  └─────────────────┴────────────────────────────────────────────────────┘   ║
 * ║                                                                              ║
 * ║  【手动扫描快捷键】(鼠标悬停在图片上时按下)                                    ║
 * ║  ┌─────────────────┬────────────────────────────────────────────────────┐   ║
 * ║  │ Q 键            │ 区域扫描 - 将图片分成15个区域逐一扫描                │   ║
 * ║  │ W 键            │ 深度扫描 - 区域扫描 + 反色 + 二值化，最强识别力      │   ║
 * ║  │ E 键            │ 框选模式 - 手动框选二维码所在区域                    │   ║
 * ║  │ Esc 键          │ 取消框选                                             │   ║
 * ║  └─────────────────┴────────────────────────────────────────────────────┘   ║
 * ║                                                                              ║
 * ║  【组合键操作】(适合不方便用键盘的场景)                                        ║
 * ║  ┌─────────────────┬────────────────────────────────────────────────────┐   ║
 * ║  │ 右键 + 1次左键  │ 深度扫描（等同于 W 键）                              │   ║
 * ║  │ 右键 + 2次左键  │ 框选模式（等同于 E 键）                              │   ║
 * ║  │ 右键 + 3次左键  │ 原图框选（不缩放，适合高清大图）                      │   ║
 * ║  └─────────────────┴────────────────────────────────────────────────────┘   ║
 * ║  操作方法：按住右键不放 → 点击左键1/2/3次 → 松开右键                         ║
 * ║                                                                              ║
 * ║  【什么时候需要手动扫描？】                                                    ║
 * ║  • 二维码只占图片的一小部分（如海报角落的二维码）                              ║
 * ║  • 二维码颜色特殊（如白底黑码以外的配色）                                      ║
 * ║  • 二维码有复杂背景干扰                                                       ║
 * ║                                                                              ║
 * ║  【区域扫描原理】                                                             ║
 * ║  ┌───┬───┬───┐                                                              ║
 * ║  │ 1 │ 2 │ 3 │  将图片分成 9宫格 + 4个角落 + 中心区域                        ║
 * ║  ├───┼───┼───┤  共15个区域，逐一放大扫描                                     ║
 * ║  │ 4 │ 5 │ 6 │  找到二维码即停止                                             ║
 * ║  ├───┼───┼───┤                                                              ║
 * ║  │ 7 │ 8 │ 9 │                                                              ║
 * ║  └───┴───┴───┘                                                              ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

(function() {
    'use strict';

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║                            ⚙️ 用户配置区                                ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    const CONFIG = {
        // ═══════════════ 快捷键设置 ═══════════════
        HOTKEY_REGION: 'q',         // 区域扫描 - 分区逐一扫描
        HOTKEY_DEEP: 'w',           // 深度扫描 - 最强识别模式
        HOTKEY_CROP: 'e',           // 框选模式 - 手动选择区域

        // ═══════════════ 扫描参数 ═══════════════
        HOVER_DELAY: 400,           // 悬停多久后开始扫描（毫秒）
        SCAN_SIZE: 500,             // 扫描时图像缩放到的目标尺寸（像素）
        AUTO_SCAN_MAX_SIZE: 2000,   // 图片超过此尺寸不自动扫描
        MIN_QR_SIZE: 30,            // 图片最小边小于此值不扫描

        // ═══════════════ 图片过滤 ═══════════════
        ASPECT_RATIO_LIMIT: 3,      // 宽高比超过此值不自动扫描（如3:1横幅）

        // ═══════════════ 交互设置 ═══════════════
        LONG_PRESS_TIME: 500,       // 长按多久触发复制（毫秒）
        CACHE_SIZE: 200,            // 缓存数量上限
    };

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║                              核心代码                                   ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    // === 资源池 ===
    const ResourcePool = {
        canvas: null,
        ctx: null,
        get() {
            if (!this.canvas) {
                this.canvas = document.createElement('canvas');
                this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
            }
            return { canvas: this.canvas, ctx: this.ctx };
        }
    };

    // === ZXing 管理 ===
    const ZXingManager = {
        reader: null,
        init() {
            if (this.reader || !window.ZXing) return;
            const init = () => this.getReader();
            requestIdleCallback?.(init) || setTimeout(init, 1000);
        },
        getReader() {
            if (!window.ZXing) return null;
            if (!this.reader) {
                const hints = new Map();
                hints.set(ZXing.DecodeHintType.TRY_HARDER, true);
                hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [
                    ZXing.BarcodeFormat.QR_CODE,
                    ZXing.BarcodeFormat.DATA_MATRIX
                ]);
                this.reader = new ZXing.BrowserMultiFormatReader(hints);
            }
            return this.reader;
        }
    };

    // === 状态 ===
    let hoverTimer = null;
    let tooltip = null;
    let currentTarget = null;
    let hoveredElement = null;
    let lastMouseScreenX = 0, lastMouseScreenY = 0;
    let lastMouseClientX = 0, lastMouseClientY = 0;
    let topWinOffset = null;

    let isRightClickHolding = false;
    let leftClickCount = 0;
    let interactionTarget = null;
    let suppressContextMenu = false;
    let suppressClick = false;
    let longPressTimer = null;

    let isCropping = false;
    let isNoScaleCrop = false;
    let cropOverlay = null;
    let cropBox = null;
    let cropStart = { x: 0, y: 0 };
    let cropTarget = null;

    const qrCache = new Map();
    const canvasCache = new WeakMap();
    const isTop = window.self === window.top;

    // === 样式 ===
    GM_addStyle(`
        #qr-tooltip {
            position: fixed; z-index: 2147483647;
            background: rgba(0,0,0,0.9); color: #fff;
            padding: 8px 12px; font-size: 12px;
            max-width: 320px; word-break: break-all;
            pointer-events: none; display: none;
            border: 1px solid #555; line-height: 1.5;
        }
        .qr-detected { cursor: pointer !important; }
        #qr-crop-overlay {
            position: fixed; inset: 0;
            background: rgba(0,0,0,0.3);
            z-index: 2147483646; cursor: crosshair; display: none;
        }
        #qr-crop-box {
            position: absolute; border: 2px solid #4CAF50;
            background: rgba(76,175,80,0.2);
            pointer-events: none; display: none;
        }
    `);

    // === 工具函数 ===
    const isUrl = t => t && /^\s*https?:\/\/\S+\s*$/i.test(t);
    const escapeHtml = t => t?.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])) || '';

    // === 通信 ===
    function sendToTop(type, payload = {}) {
        if (isTop) handleMessage({ data: { type, payload } });
        else window.top.postMessage({ type: 'QR_MSG', action: type, payload }, '*');
    }

    if (isTop) {
        window.addEventListener('message', e => {
            if (e.data?.type === 'QR_MSG') handleMessage({ data: { type: e.data.action, payload: e.data.payload } });
        });
    }

    function handleMessage(e) {
        const { type, payload } = e.data;
        if (type === 'SHOW') renderTooltip(payload.text, payload.coords, payload.isLink, payload.method);
        else if (type === 'HIDE') hideTooltip();
        else if (type === 'FEEDBACK') showFeedback();
    }

    // === UI ===
    function getTooltip() {
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'qr-tooltip';
            document.body.appendChild(tooltip);
        }
        return tooltip;
    }

    function renderTooltip(text, coords, isLink, method) {
        const tip = getTooltip();
        const isLoading = text.startsWith('⌛');
        const isError = text.startsWith('❌');

        let html;
        if (isLoading) {
            html = `<div style="color:#FFD700;font-weight:bold">${escapeHtml(text)}</div>`;
        } else if (isError) {
            html = `<div style="color:#FF5252;font-weight:bold">${escapeHtml(text)}</div>`;
        } else {
            html = `
                <div style="margin-bottom:4px">
                    <span style="color:#F6B64E;font-weight:bold">[识别成功]</span>
                    <span style="color:#B28BF7"> (${escapeHtml(method || '')})</span>
                </div>
                <div style="color:${isLink ? '#4dabf7' : '#fff'};margin-bottom:6px">${escapeHtml(text)}</div>
                <div style="color:#4CAF50;font-size:11px;border-top:1px solid #444;padding-top:4px">
                    ${isLink ? '🔗 点击打开 | 📋 长按复制' : '📋 点击复制'}
                </div>`;
        }

        tip.innerHTML = html;
        tip.style.display = 'block';

        const offX = topWinOffset?.x ?? (window.screenX + window.outerWidth - window.innerWidth);
        const offY = topWinOffset?.y ?? (window.screenY + window.outerHeight - window.innerHeight);

        let left = coords.absLeft - offX;
        let top = coords.absBottom - offY + 10;

        const rect = tip.getBoundingClientRect();
        if (top + rect.height > window.innerHeight) top = coords.absTop - offY - rect.height - 10;
        if (left + rect.width > window.innerWidth) left = window.innerWidth - rect.width - 10;
        if (left < 0) left = 10;

        tip.style.left = left + 'px';
        tip.style.top = top + 'px';
    }

    function hideTooltip() { if (tooltip) tooltip.style.display = 'none'; }

    function showFeedback() {
        const tip = getTooltip();
        if (tip.style.display === 'none') return;
        const orig = tip.innerHTML;
        tip.innerHTML = `<div style="font-size:14px;text-align:center;color:#4dabf7;font-weight:bold">✅ 已复制</div>`;
        setTimeout(() => { if (tip.style.display !== 'none') tip.innerHTML = orig; }, 800);
    }

    function showTooltip(text, el, method = '') {
        if (currentTarget !== el) currentTarget = el;
        const rect = el.getBoundingClientRect();
        const fx = lastMouseScreenX - lastMouseClientX || 0;
        const fy = lastMouseScreenY - lastMouseClientY || 0;
        sendToTop('SHOW', {
            text, method,
            coords: { absLeft: rect.left + fx, absTop: rect.top + fy, absBottom: rect.bottom + fy },
            isLink: isUrl(text)
        });
    }

    function reqHideTooltip() { currentTarget = null; sendToTop('HIDE'); }
    function reqFeedback() { sendToTop('FEEDBACK'); }

    // === 缓存 ===
    function setCache(key, val, isCanvas) {
        if (isCanvas) {
            canvasCache.set(key, val);
        } else {
            if (qrCache.size >= CONFIG.CACHE_SIZE) qrCache.delete(qrCache.keys().next().value);
            qrCache.set(key, val);
        }
    }

    function getCache(t) {
        return t.tagName === 'IMG' ? qrCache.get(t.src) : canvasCache.get(t);
    }

    // === 扫描核心 ===
    function scanJSQR(data) {
        try {
            const r = jsQR(data.data, data.width, data.height);
            return r?.data || null;
        } catch { return null; }
    }

    function scanZXing(data) {
        return new Promise(resolve => {
            const reader = ZXingManager.getReader();
            if (!reader) return resolve(null);

            const { canvas, ctx } = ResourcePool.get();
            canvas.width = data.width;
            canvas.height = data.height;
            ctx.putImageData(data, 0, 0);

            const img = new Image();
            img.onload = () => reader.decodeFromImageElement(img).then(r => resolve(r.text)).catch(() => resolve(null));
            img.onerror = () => resolve(null);
            img.src = canvas.toDataURL('image/png');
        });
    }

    function extractRegion(img, region, targetSize) {
        const { canvas, ctx } = ResourcePool.get();
        let dstW = region.w, dstH = region.h;
        const maxDim = Math.max(dstW, dstH);
        if (targetSize && maxDim > targetSize) {
            const scale = targetSize / maxDim;
            dstW = Math.round(dstW * scale);
            dstH = Math.round(dstH * scale);
        }
        const pad = 20;
        canvas.width = dstW + pad * 2;
        canvas.height = dstH + pad * 2;
        ctx.fillStyle = '#FFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, region.x, region.y, region.w, region.h, pad, pad, dstW, dstH);
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    function getRegions(w, h) {
        const regions = [{ x: 0, y: 0, w, h, name: '全图' }];
        if (w < 100 || h < 100) return regions;

        const gw = w / 3, gh = h / 3;
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                regions.push({ x: Math.round(c * gw), y: Math.round(r * gh), w: Math.round(gw), h: Math.round(gh), name: `区域${r * 3 + c + 1}` });
            }
        }

        const hw = w / 2, hh = h / 2;
        regions.push({ x: 0, y: 0, w: hw, h: hh, name: '左上' });
        regions.push({ x: hw, y: 0, w: hw, h: hh, name: '右上' });
        regions.push({ x: 0, y: hh, w: hw, h: hh, name: '左下' });
        regions.push({ x: hw, y: hh, w: hw, h: hh, name: '右下' });
        regions.push({ x: w / 4, y: h / 4, w: hw, h: hh, name: '中心' });

        return regions;
    }

    function makeVariant(data, type) {
        const { data: d, width: w, height: h } = data;
        const out = new Uint8ClampedArray(d.length);

        if (type === 'invert') {
            for (let i = 0; i < d.length; i += 4) {
                out[i] = 255 - d[i];
                out[i + 1] = 255 - d[i + 1];
                out[i + 2] = 255 - d[i + 2];
                out[i + 3] = 255;
            }
        } else {
            // Otsu
            const hist = new Array(256).fill(0);
            const total = w * h;
            for (let i = 0; i < d.length; i += 4) hist[Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2])]++;
            let sum = 0; for (let i = 0; i < 256; i++) sum += i * hist[i];
            let sumB = 0, wB = 0, maxV = 0, thresh = 128;
            for (let t = 0; t < 256; t++) {
                wB += hist[t]; if (!wB) continue;
                const wF = total - wB; if (!wF) break;
                sumB += t * hist[t];
                const v = wB * wF * Math.pow(sumB / wB - (sum - sumB) / wF, 2);
                if (v > maxV) { maxV = v; thresh = t; }
            }
            for (let i = 0; i < d.length; i += 4) {
                const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
                out[i] = out[i + 1] = out[i + 2] = g > thresh ? 255 : 0;
                out[i + 3] = 255;
            }
        }
        return new ImageData(out, w, h);
    }

    // === 扫描流程 ===

    // 快速扫描：仅全图
    async function quickScan(img) {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        const data = extractRegion(img, { x: 0, y: 0, w, h }, CONFIG.SCAN_SIZE);

        let r = scanJSQR(data);
        if (r) return { text: r, method: 'JSQR' };

        r = await scanZXing(data);
        if (r) return { text: r, method: 'ZXing' };

        return null;
    }

    // 区域扫描：15个区域
    async function regionScan(img, el) {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        const regions = getRegions(w, h);

        for (let i = 0; i < regions.length; i++) {
            const reg = regions[i];
            if (i > 0) showTooltip(`⌛ 扫描 ${reg.name} (${i + 1}/${regions.length})`, el);

            const data = extractRegion(img, reg, CONFIG.SCAN_SIZE);
            let r = scanJSQR(data);
            if (r) return { text: r, method: `JSQR ${reg.name}` };

            r = await scanZXing(data);
            if (r) return { text: r, method: `ZXing ${reg.name}` };
        }
        return null;
    }

    // 深度扫描：区域 + 变体
    async function deepScan(img, el) {
        let r = await regionScan(img, el);
        if (r) return r;

        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        const full = extractRegion(img, { x: 0, y: 0, w, h }, CONFIG.SCAN_SIZE);

        showTooltip('⌛ 尝试反色...', el);
        const inv = makeVariant(full, 'invert');
        r = scanJSQR(inv);
        if (r) return { text: r, method: 'JSQR 反色' };
        r = await scanZXing(inv);
        if (r) return { text: r, method: 'ZXing 反色' };

        showTooltip('⌛ 尝试二值化...', el);
        const bin = makeVariant(full, 'binary');
        r = scanJSQR(bin);
        if (r) return { text: r, method: 'JSQR 二值化' };
        r = await scanZXing(bin);
        if (r) return { text: r, method: 'ZXing 二值化' };

        return null;
    }

    // === 主入口 ===
    async function scan(target, mode = 'quick', cropRect = null) {
        const isImg = target.tagName === 'IMG';
        const key = isImg ? target.src : target;

        const img = await loadImage(target);
        if (!img) {
            setCache(key, { status: 'failed' }, !isImg);
            return;
        }

        let result = null;

        // 框选
        if (cropRect) {
            showTooltip('⌛ 框选解析...', target);
            const sx = (img.naturalWidth || img.width) / (target.clientWidth || target.width);
            const sy = (img.naturalHeight || img.height) / (target.clientHeight || target.height);
            const reg = { x: cropRect.x * sx, y: cropRect.y * sy, w: cropRect.w * sx, h: cropRect.h * sy };
            const data = extractRegion(img, reg, cropRect.noScale ? null : CONFIG.SCAN_SIZE);

            result = scanJSQR(data) || await scanZXing(data);
            if (result) return success(result, '框选', isImg ? 'IMG' : 'CANVAS', key, target);
            return fail(target, true);
        }

        // 快速扫描
        if (mode === 'quick') {
            result = await quickScan(img);
            if (result) return success(result.text, result.method, isImg ? 'IMG' : 'CANVAS', key, target);
            setCache(key, { status: 'failed' }, !isImg);
            return; // 静默失败，不显示任何提示
        }

        // 区域扫描
        if (mode === 'region') {
            showTooltip('⌛ 区域扫描...', target);
            result = await regionScan(img, target);
            if (result) return success(result.text, result.method, isImg ? 'IMG' : 'CANVAS', key, target);
            return fail(target, true);
        }

        // 深度扫描
        if (mode === 'deep') {
            showTooltip('⌛ 深度扫描...', target);
            result = await deepScan(img, target);
            if (result) return success(result.text, result.method, isImg ? 'IMG' : 'CANVAS', key, target);
            return fail(target, true);
        }
    }

    function loadImage(target) {
        return new Promise(resolve => {
            if (target.tagName === 'CANVAS') {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => resolve(null);
                img.src = target.toDataURL();
                return;
            }

            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => {
                GM_xmlhttpRequest({
                    method: 'GET', url: target.src, responseType: 'blob',
                    onload: r => {
                        if (r.status !== 200) return resolve(null);
                        const url = URL.createObjectURL(r.response);
                        const fb = new Image();
                        fb.onload = () => { resolve(fb); URL.revokeObjectURL(url); };
                        fb.onerror = () => { resolve(null); URL.revokeObjectURL(url); };
                        fb.src = url;
                    },
                    onerror: () => resolve(null)
                });
            };
            img.src = target.src;
        });
    }

    function success(text, method, type, key, el) {
        setCache(key, { status: 'success', text, method }, type === 'CANVAS');
        el.dataset.hasQr = 'true';
        el.classList.add('qr-detected');
        showTooltip(text, el, method);
    }

    function fail(el, showMsg) {
        if (showMsg) showTooltip('❌ 未识别到二维码，可尝试框选(E)', el);
    }

    // === 框选 ===
    function startCrop(target, noScale = false) {
        if (isCropping) return;
        isCropping = true;
        isNoScaleCrop = noScale;
        cropTarget = target;

        if (!cropOverlay) {
            cropOverlay = document.createElement('div');
            cropOverlay.id = 'qr-crop-overlay';
            cropBox = document.createElement('div');
            cropBox.id = 'qr-crop-box';
            cropOverlay.appendChild(cropBox);
            document.body.appendChild(cropOverlay);

            const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

            cropOverlay.addEventListener('contextmenu', e => {
                e.preventDefault(); e.stopPropagation();
                endCrop();
                if (cropTarget) showTooltip('❌ 已取消', cropTarget);
            });

            cropOverlay.addEventListener('mousedown', e => {
                if (e.button === 2 || !cropTarget) return;
                const rect = cropTarget.getBoundingClientRect();
                cropStart = { x: clamp(e.clientX, rect.left, rect.right), y: clamp(e.clientY, rect.top, rect.bottom) };
                cropBox.style.cssText = `left:${cropStart.x}px;top:${cropStart.y}px;width:0;height:0;display:block`;

                const move = ev => {
                    const x = clamp(ev.clientX, rect.left, rect.right);
                    const y = clamp(ev.clientY, rect.top, rect.bottom);
                    cropBox.style.width = Math.abs(x - cropStart.x) + 'px';
                    cropBox.style.height = Math.abs(y - cropStart.y) + 'px';
                    cropBox.style.left = Math.min(x, cropStart.x) + 'px';
                    cropBox.style.top = Math.min(y, cropStart.y) + 'px';
                };

                const up = ev => {
                    window.removeEventListener('mousemove', move);
                    window.removeEventListener('mouseup', up);
                    if (ev.button !== 0 || !isCropping) return;

                    const box = cropBox.getBoundingClientRect();
                    const imgRect = cropTarget.getBoundingClientRect();
                    endCrop();

                    if (box.width < 5 || box.height < 5) return;
                    scan(cropTarget, 'crop', {
                        x: box.left - imgRect.left, y: box.top - imgRect.top,
                        w: box.width, h: box.height, noScale: isNoScaleCrop
                    });
                };

                window.addEventListener('mousemove', move);
                window.addEventListener('mouseup', up);
            });
        }

        cropOverlay.style.display = 'block';
        showTooltip(noScale ? '⌛ 原图框选 - 拖拽选择' : '⌛ 框选模式 - 拖拽选择', target);
    }

    function endCrop() {
        isCropping = false;
        if (cropOverlay) cropOverlay.style.display = 'none';
        if (cropBox) cropBox.style.display = 'none';
    }

    // === 事件 ===
    document.addEventListener('mousemove', e => {
        lastMouseScreenX = e.screenX; lastMouseScreenY = e.screenY;
        lastMouseClientX = e.clientX; lastMouseClientY = e.clientY;
        if (isTop) topWinOffset = { x: e.screenX - e.clientX, y: e.screenY - e.clientY };
    }, true);

    document.addEventListener('mouseover', e => {
        if (isCropping) return;
        const t = e.target;
        if (t.tagName !== 'IMG' && t.tagName !== 'CANVAS') return;
        if (t.tagName === 'IMG' && (!t.complete || !t.naturalWidth)) return;

        hoveredElement = t;

        const w = t.tagName === 'IMG' ? t.naturalWidth : (t.width || t.clientWidth);
        const h = t.tagName === 'IMG' ? t.naturalHeight : (t.height || t.clientHeight);

        const cache = getCache(t);
        if (cache) {
            if (cache.status === 'success') {
                if (!t.dataset.hasQr) { t.dataset.hasQr = 'true'; t.classList.add('qr-detected'); }
                showTooltip(cache.text, t, cache.method);
            }
            return;
        }

        // 尺寸过滤
        if (w > CONFIG.AUTO_SCAN_MAX_SIZE || h > CONFIG.AUTO_SCAN_MAX_SIZE) {
            setCache(t.tagName === 'IMG' ? t.src : t, { status: 'skipped' }, t.tagName === 'CANVAS');
            return;
        }
        const ratio = Math.max(w, h) / Math.min(w, h);
        if (ratio > CONFIG.ASPECT_RATIO_LIMIT || Math.min(w, h) < CONFIG.MIN_QR_SIZE) {
            setCache(t.tagName === 'IMG' ? t.src : t, { status: 'skipped' }, t.tagName === 'CANVAS');
            return;
        }

        hoverTimer = setTimeout(() => {
            if (isCropping || getCache(t)) return;
            scan(t, 'quick'); // 默认只做快速扫描
        }, CONFIG.HOVER_DELAY);
    });

    document.addEventListener('mouseout', e => {
        if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
        const t = e.target;
        if (t.tagName === 'IMG' || t.tagName === 'CANVAS') {
            clearTimeout(hoverTimer);
            hoveredElement = null;
            if (currentTarget === t && !isCropping) reqHideTooltip();
        }
    });

    // 快捷键
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && isCropping) {
            endCrop();
            showTooltip('❌ 已取消', currentTarget || document.body);
            return;
        }

        if (!hoveredElement) return;
        const key = e.key.toLowerCase();

        if (key === CONFIG.HOTKEY_REGION) {
            e.preventDefault(); scan(hoveredElement, 'region');
        } else if (key === CONFIG.HOTKEY_DEEP) {
            e.preventDefault(); scan(hoveredElement, 'deep');
        } else if (key === CONFIG.HOTKEY_CROP) {
            e.preventDefault(); startCrop(hoveredElement, false);
        }
    });

    document.addEventListener('mousedown', e => {
        if (isCropping) return;

        if (e.button === 2) {
            isRightClickHolding = true;
            leftClickCount = 0;
            interactionTarget = e.target;
            suppressContextMenu = false;
        } else if (e.button === 0) {
            if (isRightClickHolding && interactionTarget?.tagName?.match(/^(IMG|CANVAS)$/)) {
                e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
                leftClickCount++;
                suppressContextMenu = suppressClick = true;
                return;
            }

            const t = e.target;
            if (t.tagName?.match(/^(IMG|CANVAS)$/) && t.dataset.hasQr === 'true') {
                const cache = getCache(t);
                const data = cache?.status === 'success' ? cache.text : null;
                if (data && isUrl(data)) {
                    longPressTimer = setTimeout(() => {
                        GM_setClipboard(data);
                        reqFeedback();
                        suppressClick = true;
                        longPressTimer = null;
                    }, CONFIG.LONG_PRESS_TIME);
                }
            }
        }
    }, true);

    document.addEventListener('mouseup', e => {
        if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
        if (isCropping) return;

        if (e.button === 2) {
            isRightClickHolding = false;
            if (leftClickCount > 0 && interactionTarget) {
                if (leftClickCount === 1) scan(interactionTarget, 'deep');
                else if (leftClickCount === 2) startCrop(interactionTarget, false);
                else if (leftClickCount === 3) startCrop(interactionTarget, true);
            }
            interactionTarget = null;
            leftClickCount = 0;
        }
    }, true);

    document.addEventListener('contextmenu', e => {
        if (suppressContextMenu) { e.preventDefault(); e.stopPropagation(); suppressContextMenu = false; }
    }, true);

    document.addEventListener('click', e => {
        if (suppressClick) {
            e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
            suppressClick = false;
            return;
        }

        const t = e.target;
        if (t.tagName?.match(/^(IMG|CANVAS)$/) && t.dataset.hasQr === 'true') {
            const cache = getCache(t);
            const data = cache?.status === 'success' ? cache.text : null;
            if (data) {
                e.preventDefault(); e.stopPropagation();
                if (isUrl(data)) GM_openInTab(data, { active: true, insert: true });
                else { GM_setClipboard(data); reqFeedback(); }
            }
        }
    }, true);

    // === 初始化 ===
    ZXingManager.init();

})();