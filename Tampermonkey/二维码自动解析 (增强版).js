// ==UserScript==
// @name         二维码自动解析 (增强版)
// @description  悬停自动识别二维码，支持快捷键触发深度扫描和框选
// @namespace    http://tampermonkey.net/
// @resource     jsqrWorker https://unpkg.com/jsqr@1.4.0/dist/jsQR.js#sha256=bc40c8a15196236b2314db0856f72ca0b49980cd5413b8c852a7349f5fee0859
// @resource     zxingWorker https://unpkg.com/@zxing/library@0.23.0/umd/index.min.js#sha256=3ede94153fb0c5b67a12d7adff6decd827c2b22714fdc6faecf27a8f20937ea6
// @match        *://*/*
// @grant        GM_setClipboard
// @grant        GM_openInTab
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @grant        GM_xmlhttpRequest
// @connect      *
// @sandbox      DOM
// @run-at       document-start
// @version      4.0
// @author       JoeZhangYN
// @license      GPLv3
// ==/UserScript==

(function() {
    'use strict';

    const CONFIG = {
        HOTKEY_REGION: 'q',
        HOTKEY_DEEP: 'w',
        HOTKEY_CROP: 'e',
        HOVER_DELAY: 400,
        QUICK_SCAN_SIZE: 600,
        DEEP_SCAN_SIZE: 1200,
        CROP_SCAN_SIZE: 1600,
        AUTO_SCAN_MAX_SIZE: 2000,
        MIN_QR_SIZE: 30,
        ASPECT_RATIO_LIMIT: 3,
        LONG_PRESS_TIME: 500,
        CACHE_SIZE: 200,
        IMAGE_REQUEST_TIMEOUT: 10000,
        DECODE_TIMEOUT: 10000,
        WORKER_IDLE_TIMEOUT: 60000,
        AUTO_USE_GM_CROSS_ORIGIN: false,
    };

    const CanvasPool = {
        canvas: null,
        ctx: null,
        get() {
            if (!this.canvas) {
                this.canvas = document.createElement('canvas');
                this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
            }
            return { canvas: this.canvas, ctx: this.ctx };
        },
    };

    const PixelAccessProbe = {
        canvas: null,
        ctx: null,
        canRead(image) {
            if (!this.canvas) {
                this.canvas = document.createElement('canvas');
                this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
            }
            this.canvas.width = 1;
            this.canvas.height = 1;
            try {
                this.ctx.drawImage(image, 0, 0, 1, 1);
                this.ctx.getImageData(0, 0, 1, 1);
                return true;
            } catch {
                return false;
            }
        },
    };

    const DecodeWorker = {
        worker: null,
        pending: new Map(),
        nextId: 1,
        unavailableReason: null,
        idleTimer: null,
        get() {
            if (this.unavailableReason) return null;
            clearTimeout(this.idleTimer);
            this.idleTimer = null;
            if (this.worker) return this.worker;
            try {
                const jsQrSource = GM_getResourceText('jsqrWorker');
                const zxingSource = GM_getResourceText('zxingWorker');
                if (!jsQrSource || !zxingSource) throw new Error('decoder-resource-missing');
                const handler = `
                    const FORMATS = [ZXing.BarcodeFormat.QR_CODE, ZXing.BarcodeFormat.DATA_MATRIX];
                    const zxingHints = new Map([
                        [ZXing.DecodeHintType.TRY_HARDER, true],
                        [ZXing.DecodeHintType.POSSIBLE_FORMATS, FORMATS],
                    ]);
                    let nativeDetectorPromise;

                    function getNativeDetector() {
                        if (typeof self.BarcodeDetector !== 'function'
                            || typeof self.BarcodeDetector.getSupportedFormats !== 'function') {
                            return Promise.resolve(null);
                        }
                        if (!nativeDetectorPromise) {
                            nativeDetectorPromise = self.BarcodeDetector.getSupportedFormats()
                                .then(formats => {
                                    const supported = ['qr_code', 'data_matrix']
                                        .filter(format => formats.includes(format));
                                    return supported.length
                                        ? new self.BarcodeDetector({ formats: supported })
                                        : null;
                                })
                                .catch(() => null);
                        }
                        return nativeDetectorPromise;
                    }

                    async function decodeNative(candidate) {
                        const detector = await getNativeDetector();
                        if (!detector || typeof self.ImageData !== 'function') return null;
                        try {
                            const results = await detector.detect(new self.ImageData(
                                candidate.pixels,
                                candidate.width,
                                candidate.height
                            ));
                            const result = results.find(item => item.rawValue);
                            if (!result) return null;
                            return {
                                text: result.rawValue,
                                format: String(result.format || 'barcode').toUpperCase(),
                                method: 'BarcodeDetector ' + candidate.name,
                            };
                        } catch {
                            return null;
                        }
                    }

                    function decodeJsQr(candidate) {
                        try {
                            const result = self.jsQR(candidate.pixels, candidate.width, candidate.height);
                            return result?.data || null;
                        } catch {
                            return null;
                        }
                    }

                    function decodeZXing(candidate) {
                        try {
                            const luma = new Uint8ClampedArray(candidate.width * candidate.height);
                            for (let source = 0, target = 0; source < candidate.pixels.length; source += 4, target++) {
                                luma[target] = Math.round(
                                    candidate.pixels[source] * 0.299
                                    + candidate.pixels[source + 1] * 0.587
                                    + candidate.pixels[source + 2] * 0.114
                                );
                            }
                            const source = new ZXing.RGBLuminanceSource(luma, candidate.width, candidate.height);
                            const bitmap = new ZXing.BinaryBitmap(new ZXing.HybridBinarizer(source));
                            const reader = new ZXing.MultiFormatReader();
                            reader.setHints(zxingHints);
                            const result = reader.decodeWithState(bitmap);
                            return {
                                text: result.getText(),
                                format: ZXing.BarcodeFormat[result.getBarcodeFormat()] || 'BARCODE',
                            };
                        } catch {
                            return null;
                        }
                    }

                    function crop(source, x, y, width, height, name) {
                        const pixels = new Uint8ClampedArray(width * height * 4);
                        for (let row = 0; row < height; row++) {
                            const start = ((y + row) * source.width + x) * 4;
                            pixels.set(source.pixels.subarray(start, start + width * 4), row * width * 4);
                        }
                        return { pixels, width, height, name };
                    }

                    function regions(source) {
                        if (source.width < 90 || source.height < 90) return [];
                        const result = [];
                        const thirdWidth = Math.floor(source.width / 3);
                        const thirdHeight = Math.floor(source.height / 3);
                        for (let row = 0; row < 3; row++) {
                            for (let column = 0; column < 3; column++) {
                                const x = column * thirdWidth;
                                const y = row * thirdHeight;
                                const width = column === 2 ? source.width - x : thirdWidth;
                                const height = row === 2 ? source.height - y : thirdHeight;
                                result.push(crop(source, x, y, width, height, '区域' + (row * 3 + column + 1)));
                            }
                        }
                        const halfWidth = Math.floor(source.width / 2);
                        const halfHeight = Math.floor(source.height / 2);
                        result.push(crop(source, 0, 0, halfWidth, halfHeight, '左上'));
                        result.push(crop(source, source.width - halfWidth, 0, halfWidth, halfHeight, '右上'));
                        result.push(crop(source, 0, source.height - halfHeight, halfWidth, halfHeight, '左下'));
                        result.push(crop(source, source.width - halfWidth, source.height - halfHeight, halfWidth, halfHeight, '右下'));
                        result.push(crop(source, Math.floor(source.width / 4), Math.floor(source.height / 4), halfWidth, halfHeight, '中心'));
                        return result;
                    }

                    function invert(source) {
                        const pixels = source.pixels.slice();
                        for (let index = 0; index < pixels.length; index += 4) {
                            pixels[index] = 255 - pixels[index];
                            pixels[index + 1] = 255 - pixels[index + 1];
                            pixels[index + 2] = 255 - pixels[index + 2];
                        }
                        return { ...source, pixels, name: '反色' };
                    }

                    function otsu(source) {
                        const histogram = new Uint32Array(256);
                        const gray = new Uint8ClampedArray(source.width * source.height);
                        for (let input = 0, output = 0; input < source.pixels.length; input += 4, output++) {
                            const value = Math.round(
                                source.pixels[input] * 0.299
                                + source.pixels[input + 1] * 0.587
                                + source.pixels[input + 2] * 0.114
                            );
                            gray[output] = value;
                            histogram[value]++;
                        }
                        const total = gray.length;
                        let sum = 0;
                        for (let value = 0; value < 256; value++) sum += value * histogram[value];
                        let backgroundSum = 0;
                        let backgroundWeight = 0;
                        let bestVariance = 0;
                        let threshold = 128;
                        for (let value = 0; value < 256; value++) {
                            backgroundWeight += histogram[value];
                            if (!backgroundWeight) continue;
                            const foregroundWeight = total - backgroundWeight;
                            if (!foregroundWeight) break;
                            backgroundSum += value * histogram[value];
                            const difference = backgroundSum / backgroundWeight
                                - (sum - backgroundSum) / foregroundWeight;
                            const variance = backgroundWeight * foregroundWeight * difference * difference;
                            if (variance > bestVariance) {
                                bestVariance = variance;
                                threshold = value;
                            }
                        }
                        const pixels = new Uint8ClampedArray(source.pixels.length);
                        for (let input = 0, output = 0; input < gray.length; input++, output += 4) {
                            const value = gray[input] > threshold ? 255 : 0;
                            pixels[output] = pixels[output + 1] = pixels[output + 2] = value;
                            pixels[output + 3] = 255;
                        }
                        return { ...source, pixels, name: '二值化' };
                    }

                    function decodeCandidate(candidate) {
                        const jsQr = decodeJsQr(candidate);
                        if (jsQr) return { text: jsQr, format: 'QR_CODE', method: 'jsQR ' + candidate.name };
                        const zxing = decodeZXing(candidate);
                        if (zxing) return { ...zxing, method: 'ZXing ' + candidate.name };
                        return null;
                    }

                    self.onmessage = async event => {
                        const { id, pixels, width, height, mode } = event.data;
                        try {
                            const full = {
                                pixels: new Uint8ClampedArray(pixels),
                                width,
                                height,
                                name: mode === 'crop' ? '框选' : '全图',
                            };
                            // Native detection is attempted once for the full image. Region and
                            // preprocessing fallbacks stay in the local JS decoders below.
                            let result = await decodeNative(full) || decodeCandidate(full);
                            if (!result && mode !== 'quick') {
                                for (const candidate of regions(full)) {
                                    result = decodeCandidate(candidate);
                                    if (result) break;
                                }
                            }
                            if (!result && mode === 'deep') result = decodeCandidate(invert(full));
                            if (!result && mode === 'deep') result = decodeCandidate(otsu(full));
                            self.postMessage(result
                                ? { id, status: 'decoded', ...result }
                                : { id, status: 'not-found' });
                        } catch (error) {
                            self.postMessage({ id, status: 'failed', reason: error?.message || 'decode-failed' });
                        }
                    };
                `;
                const workerUrl = URL.createObjectURL(new Blob([
                    jsQrSource,
                    '\n',
                    zxingSource,
                    '\n',
                    handler,
                ], { type: 'text/javascript' }));
                this.worker = new Worker(workerUrl);
                URL.revokeObjectURL(workerUrl);
                this.worker.onmessage = event => {
                    const pending = this.pending.get(event.data?.id);
                    if (!pending) return;
                    clearTimeout(pending.timeout);
                    this.pending.delete(event.data.id);
                    pending.resolve(event.data);
                    this.scheduleIdleTermination();
                };
                this.worker.onerror = () => this.disable('worker-runtime-failed');
                return this.worker;
            } catch (error) {
                this.unavailableReason = error?.message || 'worker-create-failed';
                return null;
            }
        },
        decode(imageData, mode) {
            const worker = this.get();
            if (!worker) {
                return Promise.resolve({
                    status: 'failed',
                    reason: this.unavailableReason || 'worker-unavailable',
                });
            }
            const id = this.nextId++;
            const pixels = imageData.data.slice().buffer;
            return new Promise(resolve => {
                const timeout = setTimeout(() => {
                    if (!this.pending.has(id)) return;
                    this.stopWorker({ status: 'failed', reason: 'decode-timeout' });
                }, CONFIG.DECODE_TIMEOUT);
                this.pending.set(id, { resolve, timeout });
                worker.postMessage({
                    id,
                    pixels,
                    width: imageData.width,
                    height: imageData.height,
                    mode,
                }, [pixels]);
            });
        },
        scheduleIdleTermination() {
            clearTimeout(this.idleTimer);
            if (!this.worker || this.pending.size) return;
            this.idleTimer = setTimeout(() => {
                if (this.pending.size) return;
                this.worker?.terminate();
                this.worker = null;
                this.idleTimer = null;
            }, CONFIG.WORKER_IDLE_TIMEOUT);
        },
        stopWorker(decision) {
            clearTimeout(this.idleTimer);
            this.idleTimer = null;
            for (const pending of this.pending.values()) {
                clearTimeout(pending.timeout);
                pending.resolve(decision);
            }
            this.pending.clear();
            this.worker?.terminate();
            this.worker = null;
        },
        cancelAll() {
            const hadPendingWork = this.pending.size > 0;
            if (hadPendingWork) {
                this.stopWorker({ status: 'cancelled' });
            } else {
                this.scheduleIdleTermination();
            }
        },
        disable(reason) {
            this.stopWorker({ status: 'failed', reason });
            this.unavailableReason = reason;
        },
    };

    let hoverTimer = null;
    let tooltip = null;
    let currentTarget = null;
    let hoveredElement = null;
    let lastMouseScreenX = 0;
    let lastMouseScreenY = 0;
    let lastMouseClientX = 0;
    let lastMouseClientY = 0;
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
    let activeScanToken = 0;

    const qrCache = new Map();
    const canvasCache = new WeakMap();
    const isTop = window.self === window.top;

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

    const isUrl = text => text && /^\s*https?:\/\/\S+\s*$/i.test(text);
    const escapeHtml = text => text?.replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
    }[char])) || '';
    const getTargetCacheKey = target => target.currentSrc || target.src;

    function sendToTop(type, payload = {}) {
        if (isTop) handleMessage({ data: { type, payload } });
        else window.top.postMessage({ type: 'QR_MSG', action: type, payload }, '*');
    }

    if (isTop) {
        window.addEventListener('message', event => {
            if (event.data?.type === 'QR_MSG') {
                handleMessage({ data: { type: event.data.action, payload: event.data.payload } });
            }
        });
    }

    function handleMessage(event) {
        const { type, payload } = event.data;
        if (type === 'SHOW') renderTooltip(payload.text, payload.coords, payload.isLink, payload.method);
        else if (type === 'HIDE') hideTooltip();
        else if (type === 'FEEDBACK') showFeedback();
    }

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
        const isLoading = text.startsWith('处理中');
        const isError = text.startsWith('失败');
        if (isLoading || isError) {
            tip.innerHTML = `<div style="color:${isError ? '#FF5252' : '#FFD700'};font-weight:bold">${escapeHtml(text)}</div>`;
        } else {
            tip.innerHTML = `
                <div style="margin-bottom:4px">
                    <span style="color:#F6B64E;font-weight:bold">[识别成功]</span>
                    <span style="color:#B28BF7"> (${escapeHtml(method || '')})</span>
                </div>
                <div style="color:${isLink ? '#4dabf7' : '#fff'};margin-bottom:6px">${escapeHtml(text)}</div>
                <div style="color:#4CAF50;font-size:11px;border-top:1px solid #444;padding-top:4px">
                    ${isLink ? '点击打开 | 长按复制' : '点击复制'}
                </div>`;
        }
        tip.style.display = 'block';

        const offX = topWinOffset?.x ?? (window.screenX + window.outerWidth - window.innerWidth);
        const offY = topWinOffset?.y ?? (window.screenY + window.outerHeight - window.innerHeight);
        let left = coords.absLeft - offX;
        let top = coords.absBottom - offY + 10;
        const rect = tip.getBoundingClientRect();
        if (top + rect.height > window.innerHeight) top = coords.absTop - offY - rect.height - 10;
        if (left + rect.width > window.innerWidth) left = window.innerWidth - rect.width - 10;
        if (left < 0) left = 10;
        tip.style.left = `${left}px`;
        tip.style.top = `${top}px`;
    }

    function hideTooltip() {
        if (tooltip) tooltip.style.display = 'none';
    }

    function showFeedback() {
        const tip = getTooltip();
        if (tip.style.display === 'none') return;
        const original = tip.innerHTML;
        tip.innerHTML = '<div style="font-size:14px;text-align:center;color:#4dabf7;font-weight:bold">已复制</div>';
        setTimeout(() => {
            if (tip.style.display !== 'none') tip.innerHTML = original;
        }, 800);
    }

    function showTooltip(text, element, method = '') {
        currentTarget = element;
        const rect = element.getBoundingClientRect();
        const frameX = lastMouseScreenX - lastMouseClientX || 0;
        const frameY = lastMouseScreenY - lastMouseClientY || 0;
        sendToTop('SHOW', {
            text,
            method,
            coords: {
                absLeft: rect.left + frameX,
                absTop: rect.top + frameY,
                absBottom: rect.bottom + frameY,
            },
            isLink: isUrl(text),
        });
    }

    function reqHideTooltip() {
        currentTarget = null;
        sendToTop('HIDE');
    }

    function reqFeedback() {
        sendToTop('FEEDBACK');
    }

    function setCache(key, value, isCanvas) {
        if (isCanvas) {
            canvasCache.set(key, value);
            return;
        }
        if (qrCache.size >= CONFIG.CACHE_SIZE) qrCache.delete(qrCache.keys().next().value);
        qrCache.set(key, value);
    }

    function getCache(target) {
        return target.tagName === 'IMG'
            ? qrCache.get(getTargetCacheKey(target))
            : canvasCache.get(target);
    }

    function classifyScanRequest(mode, cropRect) {
        if (cropRect) {
            return {
                status: 'accepted',
                mode: 'crop',
                cropRect,
                userInitiated: true,
                allowPrivilegedFetch: true,
                targetSize: cropRect.noScale ? null : CONFIG.CROP_SCAN_SIZE,
            };
        }
        if (!['quick', 'region', 'deep'].includes(mode)) {
            return { status: 'rejected', reason: 'unknown-scan-mode' };
        }
        const userInitiated = mode !== 'quick';
        return {
            status: 'accepted',
            mode,
            cropRect: null,
            userInitiated,
            allowPrivilegedFetch: userInitiated || CONFIG.AUTO_USE_GM_CROSS_ORIGIN,
            targetSize: userInitiated ? CONFIG.DEEP_SCAN_SIZE : CONFIG.QUICK_SCAN_SIZE,
        };
    }

    function extractPixels(image, target, request) {
        const sourceWidth = image.naturalWidth || image.width;
        const sourceHeight = image.naturalHeight || image.height;
        let region = { x: 0, y: 0, width: sourceWidth, height: sourceHeight };
        if (request.cropRect) {
            const scaleX = sourceWidth / (target.clientWidth || target.width);
            const scaleY = sourceHeight / (target.clientHeight || target.height);
            region = {
                x: Math.max(0, Math.round(request.cropRect.x * scaleX)),
                y: Math.max(0, Math.round(request.cropRect.y * scaleY)),
                width: Math.max(1, Math.round(request.cropRect.w * scaleX)),
                height: Math.max(1, Math.round(request.cropRect.h * scaleY)),
            };
            region.width = Math.min(region.width, sourceWidth - region.x);
            region.height = Math.min(region.height, sourceHeight - region.y);
        }

        let outputWidth = region.width;
        let outputHeight = region.height;
        const maximum = Math.max(outputWidth, outputHeight);
        if (request.targetSize && maximum > request.targetSize) {
            const scale = request.targetSize / maximum;
            outputWidth = Math.max(1, Math.round(outputWidth * scale));
            outputHeight = Math.max(1, Math.round(outputHeight * scale));
        }

        const padding = 20;
        const { canvas, ctx } = CanvasPool.get();
        canvas.width = outputWidth + padding * 2;
        canvas.height = outputHeight + padding * 2;
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(
            image,
            region.x,
            region.y,
            region.width,
            region.height,
            padding,
            padding,
            outputWidth,
            outputHeight
        );
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    const isCrossOrigin = url => {
        try {
            return new URL(url, location.href).origin !== location.origin;
        } catch {
            return false;
        }
    };

    function loadNativeImage(source, cors = false) {
        return new Promise(resolve => {
            const image = new Image();
            let settled = false;
            const finish = result => {
                if (settled) return;
                settled = true;
                clearTimeout(timeout);
                image.onload = null;
                image.onerror = null;
                resolve(result);
            };
            const timeout = setTimeout(() => {
                finish(null);
                image.src = '';
            }, CONFIG.IMAGE_REQUEST_TIMEOUT);
            if (cors) {
                image.crossOrigin = 'anonymous';
                image.referrerPolicy = 'no-referrer';
            }
            image.onload = () => finish(image);
            image.onerror = () => finish(null);
            image.src = source;
        });
    }

    function loadViaGM(url) {
        return new Promise(resolve => {
            if (typeof GM_xmlhttpRequest === 'undefined') return resolve(null);
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                responseType: 'blob',
                timeout: CONFIG.IMAGE_REQUEST_TIMEOUT,
                onload: response => {
                    if (response.status < 200 || response.status >= 300 || !response.response) {
                        resolve(null);
                        return;
                    }
                    const objectUrl = URL.createObjectURL(response.response);
                    const image = new Image();
                    image.onload = () => {
                        URL.revokeObjectURL(objectUrl);
                        resolve(image);
                    };
                    image.onerror = () => {
                        URL.revokeObjectURL(objectUrl);
                        resolve(null);
                    };
                    image.src = objectUrl;
                },
                onerror: () => resolve(null),
                ontimeout: () => resolve(null),
            });
        });
    }

    async function acquireImage(target, request) {
        if (target.tagName === 'CANVAS') {
            return PixelAccessProbe.canRead(target)
                ? { status: 'ready', image: target, source: 'rendered-canvas' }
                : { status: 'blocked', reason: 'tainted-canvas' };
        }

        const source = getTargetCacheKey(target);
        if (!source) return { status: 'failed', reason: 'missing-image-source' };
        if (target.complete && target.naturalWidth && PixelAccessProbe.canRead(target)) {
            return { status: 'ready', image: target, source: 'rendered-image' };
        }
        if (/^(data|blob):/i.test(source)) {
            const image = await loadNativeImage(source);
            return image
                ? { status: 'ready', image, source: 'embedded-image' }
                : { status: 'failed', reason: 'embedded-load-failed' };
        }
        if (isCrossOrigin(source)) {
            if (!request.allowPrivilegedFetch) {
                return { status: 'blocked', reason: 'cross-origin-permission-required' };
            }
            const corsImage = await loadNativeImage(source, true);
            if (corsImage) return { status: 'ready', image: corsImage, source: 'cors-image' };
            const image = await loadViaGM(source);
            return image
                ? { status: 'ready', image, source: 'gm-image' }
                : { status: 'failed', reason: 'privileged-load-failed' };
        }

        const image = await loadNativeImage(source);
        return image
            ? { status: 'ready', image, source: 'same-origin-image' }
            : { status: 'failed', reason: 'same-origin-load-failed' };
    }

    async function scan(target, mode = 'quick', cropRect = null) {
        const request = classifyScanRequest(mode, cropRect);
        if (request.status !== 'accepted') return;
        const token = ++activeScanToken;
        const alive = () => token === activeScanToken;
        const force = request.mode === 'crop';
        const isImage = target.tagName === 'IMG';
        const cacheKey = isImage ? getTargetCacheKey(target) : target;

        if (request.userInitiated) showTooltip('处理中...', target);
        const acquisition = await acquireImage(target, request);
        if (!alive() && !force) return;
        if (acquisition.status !== 'ready') {
            setCache(cacheKey, acquisition, !isImage);
            if (request.userInitiated) {
                showTooltip(
                    acquisition.status === 'blocked'
                        ? '失败：浏览器禁止读取该图片像素'
                        : '失败：无法读取图片',
                    target
                );
            }
            return;
        }

        let imageData;
        try {
            imageData = extractPixels(acquisition.image, target, request);
        } catch {
            const decision = { status: 'blocked', reason: 'pixel-read-failed' };
            setCache(cacheKey, decision, !isImage);
            if (request.userInitiated) showTooltip('失败：无法读取图片像素', target);
            return;
        }

        const result = await DecodeWorker.decode(imageData, request.mode);
        if (!alive() && !force) return;
        if (result.status === 'decoded') {
            setCache(cacheKey, {
                status: 'success',
                text: result.text,
                method: result.method,
            }, !isImage);
            target.dataset.hasQr = 'true';
            target.classList.add('qr-detected');
            showTooltip(result.text, target, result.method);
            return;
        }
        if (result.status === 'cancelled') return;
        setCache(cacheKey, result, !isImage);
        if (request.userInitiated) {
            showTooltip(
                result.status === 'not-found'
                    ? '失败：未识别到二维码，可尝试框选(E)'
                    : '失败：本机解码 Worker 不可用',
                target
            );
        }
    }

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
            const clamp = (value, minimum, maximum) => Math.min(Math.max(value, minimum), maximum);

            cropOverlay.addEventListener('contextmenu', event => {
                event.preventDefault();
                event.stopPropagation();
                endCrop();
            });
            cropOverlay.addEventListener('mousedown', event => {
                if (event.button === 2 || !cropTarget) return;
                const rect = cropTarget.getBoundingClientRect();
                cropStart = {
                    x: clamp(event.clientX, rect.left, rect.right),
                    y: clamp(event.clientY, rect.top, rect.bottom),
                };
                cropBox.style.cssText = `left:${cropStart.x}px;top:${cropStart.y}px;width:0;height:0;display:block`;

                const move = moveEvent => {
                    const x = clamp(moveEvent.clientX, rect.left, rect.right);
                    const y = clamp(moveEvent.clientY, rect.top, rect.bottom);
                    cropBox.style.width = `${Math.abs(x - cropStart.x)}px`;
                    cropBox.style.height = `${Math.abs(y - cropStart.y)}px`;
                    cropBox.style.left = `${Math.min(x, cropStart.x)}px`;
                    cropBox.style.top = `${Math.min(y, cropStart.y)}px`;
                };
                const up = upEvent => {
                    window.removeEventListener('mousemove', move);
                    window.removeEventListener('mouseup', up);
                    if (upEvent.button !== 0 || !isCropping) return;
                    const box = cropBox.getBoundingClientRect();
                    const imageRect = cropTarget.getBoundingClientRect();
                    const targetToScan = cropTarget;
                    const noScaleSelection = isNoScaleCrop;
                    endCrop();
                    if (box.width < 5 || box.height < 5) return;
                    scan(targetToScan, 'crop', {
                        x: box.left - imageRect.left,
                        y: box.top - imageRect.top,
                        w: box.width,
                        h: box.height,
                        noScale: noScaleSelection,
                    });
                };
                window.addEventListener('mousemove', move);
                window.addEventListener('mouseup', up);
            });
        }
        cropOverlay.style.display = 'block';
        showTooltip('处理中：拖拽选择二维码区域', target);
    }

    function endCrop() {
        isCropping = false;
        if (cropOverlay) cropOverlay.style.display = 'none';
        if (cropBox) cropBox.style.display = 'none';
    }

    document.addEventListener('mousemove', event => {
        lastMouseScreenX = event.screenX;
        lastMouseScreenY = event.screenY;
        lastMouseClientX = event.clientX;
        lastMouseClientY = event.clientY;
        if (isTop) topWinOffset = { x: event.screenX - event.clientX, y: event.screenY - event.clientY };
    }, true);

    document.addEventListener('mouseover', event => {
        if (isCropping) return;
        const target = event.target;
        if (!target.tagName?.match(/^(IMG|CANVAS)$/)) return;
        if (target.tagName === 'IMG' && (!target.complete || !target.naturalWidth)) return;
        hoveredElement = target;
        const width = target.tagName === 'IMG' ? target.naturalWidth : (target.width || target.clientWidth);
        const height = target.tagName === 'IMG' ? target.naturalHeight : (target.height || target.clientHeight);
        const cached = getCache(target);
        if (cached) {
            if (cached.status === 'success') {
                target.dataset.hasQr = 'true';
                target.classList.add('qr-detected');
                showTooltip(cached.text, target, cached.method);
            }
            return;
        }
        const cacheKey = target.tagName === 'IMG' ? getTargetCacheKey(target) : target;
        if (width > CONFIG.AUTO_SCAN_MAX_SIZE || height > CONFIG.AUTO_SCAN_MAX_SIZE) {
            setCache(cacheKey, { status: 'skipped' }, target.tagName === 'CANVAS');
            return;
        }
        const ratio = Math.max(width, height) / Math.min(width, height);
        if (ratio > CONFIG.ASPECT_RATIO_LIMIT || Math.min(width, height) < CONFIG.MIN_QR_SIZE) {
            setCache(cacheKey, { status: 'skipped' }, target.tagName === 'CANVAS');
            return;
        }
        hoverTimer = setTimeout(() => {
            if (!isCropping && !getCache(target)) scan(target, 'quick');
        }, CONFIG.HOVER_DELAY);
    });

    document.addEventListener('mouseout', event => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
        const target = event.target;
        if (target.tagName?.match(/^(IMG|CANVAS)$/)) {
            clearTimeout(hoverTimer);
            hoveredElement = null;
            if (!isCropping) {
                activeScanToken++;
                DecodeWorker.cancelAll();
                if (currentTarget === target) reqHideTooltip();
            }
        }
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && isCropping) {
            endCrop();
            return;
        }
        if (!hoveredElement) return;
        const key = event.key.toLowerCase();
        if (key === CONFIG.HOTKEY_REGION) {
            event.preventDefault();
            scan(hoveredElement, 'region');
        } else if (key === CONFIG.HOTKEY_DEEP) {
            event.preventDefault();
            scan(hoveredElement, 'deep');
        } else if (key === CONFIG.HOTKEY_CROP) {
            event.preventDefault();
            startCrop(hoveredElement);
        }
    });

    document.addEventListener('mousedown', event => {
        if (isCropping) return;
        if (event.button === 2) {
            isRightClickHolding = true;
            leftClickCount = 0;
            interactionTarget = event.target;
            suppressContextMenu = false;
            return;
        }
        if (event.button !== 0) return;
        if (isRightClickHolding && interactionTarget?.tagName?.match(/^(IMG|CANVAS)$/)) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            leftClickCount++;
            suppressContextMenu = suppressClick = true;
            return;
        }
        const target = event.target;
        if (target.tagName?.match(/^(IMG|CANVAS)$/) && target.dataset.hasQr === 'true') {
            const cached = getCache(target);
            if (cached?.status === 'success' && isUrl(cached.text)) {
                longPressTimer = setTimeout(() => {
                    GM_setClipboard(cached.text);
                    reqFeedback();
                    suppressClick = true;
                    longPressTimer = null;
                }, CONFIG.LONG_PRESS_TIME);
            }
        }
    }, true);

    document.addEventListener('mouseup', event => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
        if (isCropping || event.button !== 2) return;
        isRightClickHolding = false;
        if (leftClickCount === 1) scan(interactionTarget, 'deep');
        else if (leftClickCount === 2) startCrop(interactionTarget, false);
        else if (leftClickCount === 3) startCrop(interactionTarget, true);
        interactionTarget = null;
        leftClickCount = 0;
    }, true);

    document.addEventListener('contextmenu', event => {
        if (!suppressContextMenu) return;
        event.preventDefault();
        event.stopPropagation();
        suppressContextMenu = false;
    }, true);

    document.addEventListener('click', event => {
        if (suppressClick) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            suppressClick = false;
            return;
        }
        const target = event.target;
        if (!target.tagName?.match(/^(IMG|CANVAS)$/) || target.dataset.hasQr !== 'true') return;
        const cached = getCache(target);
        if (cached?.status !== 'success') return;
        event.preventDefault();
        event.stopPropagation();
        if (isUrl(cached.text)) GM_openInTab(cached.text, { active: true, insert: true });
        else {
            GM_setClipboard(cached.text);
            reqFeedback();
        }
    }, true);

})();
