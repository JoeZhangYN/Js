// ==UserScript==
// @name         Riddle Master Assistant Reborn
// @version      0.5.2
// @description  ML based riddle master bot | 成功保存结果 + 智能失败保底随机提交
// @homepage     https://rdma.ooguy.com
// @include      http://hentaiverse.org/*
// @include      http://alt.hentaiverse.org/*
// @include      https://hentaiverse.org/*
// @include      https://alt.hentaiverse.org/*
// @compatible   Chrome/Chromium + Tampermonkey
// @connect      rdma.ooguy.com
// @grant        GM.xmlHttpRequest
// @grant        GM_notification
// @grant        GM.notification
// @grant        GM.getValue
// @grant        GM.setValue
// @run-at       document-end
// @namespace    https://greasyfork.org/users/756324
// @downloadURL  https://update.sleazyfork.org/scripts/424684/Riddle%20Master%20Assistant%20Reborn.user.js
// @updateURL    https://update.sleazyfork.org/scripts/424684/Riddle%20Master%20Assistant%20Reborn.meta.js
// ==/UserScript==

/* eslint-disable no-undef */
// GM_notification 可能由 Tampermonkey 注入为全局，也可能需要从 GM.notification 取
const _notify = (typeof GM_notification !== 'undefined') ? GM_notification : GM.notification;

let extend_submit_interval = 3;
const api_key = '';

// ====================== 配置 ======================
const config = {
    enable_fail_random_submit: true,      // 失败时是否尝试随机提交
    fail_random_items: 1,                 // 固定随机选1个
    fail_submit_before_end_sec: 3,        // 倒计时剩余多少秒时提交
    save_failed_cases: true,              // 失败也保存图片+json（标记 _failed）
    save_prefix: 'riddle_'
};

// 答案代码 → riddler1 子元素索引的映射
const ANSWER_MAP = { ts: 0, ra: 1, fs: 2, rd: 3, pp: 4, aj: 5 };
const ANSWER_COUNT = Object.keys(ANSWER_MAP).length;

// ====================== 工具函数 ======================
function getTimestamp() {
    const now = new Date();
    return now.getFullYear() +
           String(now.getMonth() + 1).padStart(2, '0') +
           String(now.getDate()).padStart(2, '0') + '_' +
           String(now.getHours()).padStart(2, '0') +
           String(now.getMinutes()).padStart(2, '0') +
           String(now.getSeconds()).padStart(2, '0');
}

/**
 * 获取 riddler1 中指定索引的 checkbox 元素
 */
function getCheckbox(container, idx) {
    return container?.children?.[idx]?.children?.[0]?.children?.[0] || null;
}

function parseResponseHeaders(headerStr) {
    const headers = {};
    if (!headerStr) return headers;
    const lines = headerStr.trim().split(/[\r\n]+/);
    lines.forEach((line) => {
        const parts = line.split(': ');
        const key = parts.shift().toLowerCase();
        headers[key] = parts.join(': ');
    });
    return headers;
}

// ====================== 图片获取 ======================

/**
 * 方式1：从已渲染的 <img> 元素通过 canvas 导出 blob
 * 页面 load 后图片已显示，一定存在于内存中，最可靠
 */
function getImageBlobFromCanvas() {
    return new Promise((resolve, reject) => {
        const imgEl = document.getElementById('riddleimage')?.childNodes?.[0];
        if (!imgEl || !imgEl.naturalWidth) {
            reject(new Error('Image element not ready'));
            return;
        }
        const canvas = document.createElement('canvas');
        canvas.width = imgEl.naturalWidth;
        canvas.height = imgEl.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(imgEl, 0, 0);
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error('canvas.toBlob returned null'));
            }
        }, 'image/jpeg', 0.95);
    });
}

/**
 * 方式2：通过 fetch 获取图片，多级 fallback
 * 注意：cache:'only-if-cached' 未命中时会抛 TypeError（非返回非200），需 try/catch
 */
async function getImageBlobFromFetch(url) {
    // 尝试1：仅缓存
    try {
        const res = await fetch(url, {
            method: 'GET',
            credentials: 'same-origin',
            cache: 'only-if-cached',
            mode: 'same-origin'
        });
        if (res.status === 200) {
            console.log('[RMA] 图片来源: only-if-cached');
            return await res.blob();
        }
    } catch (e) {
        // only-if-cached 未命中抛 TypeError，正常流程
        console.log('[RMA] only-if-cached miss:', e.message);
    }

    // 尝试2：优先缓存，允许网络
    try {
        const res = await fetch(url, {
            method: 'GET',
            credentials: 'same-origin',
            cache: 'force-cache',
            mode: 'same-origin'
        });
        if (res.status === 200) {
            console.log('[RMA] 图片来源: force-cache');
            return await res.blob();
        }
    } catch (e) {
        console.warn('[RMA] force-cache failed:', e.message);
    }

    // 尝试3：正常网络请求
    const res = await fetch(url, {
        method: 'GET',
        credentials: 'same-origin'
    });
    if (res.status === 200) {
        console.log('[RMA] 图片来源: network');
        return await res.blob();
    }

    throw new Error(`All fetch attempts failed, last status: ${res.status}`);
}

/**
 * 获取图片 blob，canvas 优先，fetch 兜底
 */
async function getImageBlob(url) {
    try {
        const blob = await getImageBlobFromCanvas();
        console.log('[RMA] 图片获取成功 (canvas)', blob.size, 'bytes');
        return blob;
    } catch (canvasErr) {
        console.warn('[RMA] Canvas 方式失败，尝试 fetch:', canvasErr.message);
    }
    const blob = await getImageBlobFromFetch(url);
    console.log('[RMA] 图片获取成功 (fetch)', blob.size, 'bytes');
    return blob;
}

// ====================== 保存结果 ======================

function saveRiddle(imgBlob, resultObj, isFailed = false) {
    const ts = getTimestamp();
    const suffix = isFailed ? '_failed' : '';
    const baseName = `${config.save_prefix}${ts}${suffix}`;

    const enhanced = {
        saved_at: new Date().toISOString(),
        is_failed: isFailed,
        image_src: document.getElementById('riddleimage')?.childNodes[0]?.src || 'unknown',
        ...resultObj
    };
    const jsonStr = JSON.stringify(enhanced, null, 2);

    // 方式1：<a>.click() 触发浏览器下载（仅前台标签页有效）
    try {
        const imgUrl = URL.createObjectURL(imgBlob);
        const aImg = document.createElement('a');
        aImg.style.display = 'none';
        aImg.href = imgUrl;
        aImg.download = `${baseName}.jpg`;
        document.body.appendChild(aImg);
        aImg.click();
        setTimeout(() => {
            document.body.removeChild(aImg);
            URL.revokeObjectURL(imgUrl);
        }, 200);

        const jsonBlob = new Blob([jsonStr], { type: 'application/json' });
        const jsonUrl = URL.createObjectURL(jsonBlob);
        const aJson = document.createElement('a');
        aJson.style.display = 'none';
        aJson.href = jsonUrl;
        aJson.download = `${baseName}.json`;
        document.body.appendChild(aJson);
        aJson.click();
        setTimeout(() => {
            document.body.removeChild(aJson);
            URL.revokeObjectURL(jsonUrl);
        }, 200);
    } catch (e) {
        console.warn('[RMA] <a>.click() 下载失败（可能在后台标签页）', e);
    }

    // 方式2：存入 GM storage 作为备份（不受后台标签页限制）
    const reader = new FileReader();
    reader.onloadend = async function() {
        const key = `saved_${baseName}`;
        await GM.setValue(key, {
            json: enhanced,
            imageBase64: reader.result,
            timestamp: Date.now()
        });
        console.log(`[RMA] GM storage 备份: ${key}`);
    };
    reader.readAsDataURL(imgBlob);

    console.log(`[RMA] 保存: ${baseName}.jpg + .json`);
    _notify(`已保存 ${baseName}${isFailed ? ' (失败)' : ''}`, 'Riddle Master Assistant');
}

// ====================== 倒计时读取 ======================

/**
 * 获取 riddlecounter 的剩余秒数
 * 支持 "M:SS" 或纯秒数格式
 */
function getRemainingSeconds() {
    const counter = document.getElementById('riddlecounter');
    if (!counter) return -1;
    const text = counter.textContent.trim();
    const matchMS = text.match(/(\d+):(\d+)/);
    if (matchMS) {
        return parseInt(matchMS[1], 10) * 60 + parseInt(matchMS[2], 10);
    }
    const matchSec = text.match(/(\d+)/);
    if (matchSec) {
        return parseInt(matchSec[1], 10);
    }
    return -1;
}

/**
 * 等待倒计时接近结束后执行回调
 */
function waitUntilNearEnd(beforeEndSec, callback) {
    const remaining = getRemainingSeconds();
    if (remaining < 0) {
        console.warn('[RMA] 无法读取倒计时，5秒后执行');
        setTimeout(callback, 5000);
        return;
    }
    if (remaining <= beforeEndSec) {
        console.log(`[RMA] 剩余 ${remaining}s <= ${beforeEndSec}s，立即执行`);
        callback();
        return;
    }
    const waitMs = (remaining - beforeEndSec) * 1000;
    console.log(`[RMA] 倒计时剩余 ${remaining}s，等待 ${Math.round(waitMs / 1000)}s 后提交`);
    setTimeout(callback, waitMs);
}

// ====================== 失败处理 ======================

function handleFailure(imgData, errorInfo = {}, isNoMoreAttempts = false) {
    console.log('[RMA] 失败处理', { isNoMoreAttempts, hasImage: !!imgData });

    if (isNoMoreAttempts || !config.enable_fail_random_submit) {
        _notify('失败（次数用完/已禁用随机提交）', 'Riddle Master Assistant Reborn');
        if (config.save_failed_cases && imgData) {
            saveRiddle(imgData, { ...errorInfo, _reason: 'no_more_attempts_or_disabled' }, true);
        }
        return;
    }

    const submitBtn = document.getElementById('riddlesubmit');
    const container = document.getElementById('riddler1');
    if (!container || container.children.length < ANSWER_COUNT) {
        console.error('[RMA] 找不到选项容器');
        return;
    }

    _notify('失败 → 等待倒计时快结束后随机提交1项', 'Riddle Master Assistant Reborn');

    // 随机选 1 个选项
    const idx = Math.floor(Math.random() * ANSWER_COUNT);

    // 等倒计时快结束再勾选+提交
    waitUntilNearEnd(config.fail_submit_before_end_sec, () => {
        const cb = getCheckbox(container, idx);
        if (cb && cb.type === 'checkbox') {
            cb.checked = true;
        }
        if (submitBtn) {
            submitBtn.disabled = false;
            console.log(`[RMA] 随机勾选第 ${idx} 项，提交`);
            submitBtn.click();
        }
    });

    if (config.save_failed_cases && imgData) {
        saveRiddle(imgData, { ...errorInfo, _reason: 'random_submit_triggered', random_index: idx }, true);
    }
}

// ====================== stay_awake ======================

function send_head() {
    console.log('[RMA] Send awake request');
    GM.xmlHttpRequest({
        method: 'HEAD',
        timeout: 30000,
        url: 'https://rdma.ooguy.com/status',
        onload: async function(response) {
            const wasMaintenance = await GM.getValue('is_maintenance', false);
            if (response.status !== 200) {
                if (!wasMaintenance) {
                    _notify('WARNING: Server in maintenance', 'Riddle Master Assistant');
                }
                await GM.setValue('is_maintenance', true);
                await GM.setValue('check_interval', 60);
            } else {
                if (wasMaintenance) {
                    _notify('INFO: Server is up', 'Riddle Master Assistant');
                }
                await GM.setValue('is_maintenance', false);
                await GM.setValue('is_down', false);
                await GM.setValue('check_interval', 3600);
            }
        },
        onerror: async function() {
            const wasDown = await GM.getValue('is_down', false);
            if (!wasDown) {
                _notify('ERROR: Server not respond', 'Riddle Master Assistant');
            }
            await GM.setValue('is_down', true);
            await GM.setValue('check_interval', 60);
        },
        ontimeout: async function() {
            const wasDown = await GM.getValue('is_down', false);
            if (!wasDown) {
                _notify('TIMEOUT: Server not respond', 'Riddle Master Assistant');
            }
            await GM.setValue('is_down', true);
            await GM.setValue('check_interval', 60);
        }
    });
}

async function stay_awake() {
    const d = new Date();
    const today = `${d.getUTCFullYear()}/${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
    const lastDay = await GM.getValue('last_date', '0/0/0');
    if (today !== lastDay) {
        await GM.setValue('last_date', today);
        await GM.setValue('is_maintenance', false);
        await GM.setValue('is_down', false);
        await GM.setValue('check_interval', 3600);
    }

    const now = Date.now() / 1000 | 0;
    const lastTs = await GM.getValue('last_awake_ts', 0);
    const interval = await GM.getValue('check_interval', 3600);
    if (now - lastTs >= interval) {
        send_head();
        await GM.setValue('last_awake_ts', now);
    }
}

stay_awake();
setInterval(stay_awake, 30000);

// ====================== 主逻辑 ======================
if (document.getElementById('riddlecounter')) {
    const imageUrl = document.getElementById('riddleimage')?.childNodes?.[0]?.src;

    window.addEventListener('load', async function() {
        if (!imageUrl) {
            _notify('ERROR: Cannot find riddle image', 'Riddle Master Assistant');
            handleFailure(null, { _error: 'no_image_url' });
            return;
        }

        try {
            const imgData = await getImageBlob(imageUrl);

            if (!imgData || imgData.size === 0) {
                throw new Error('Image blob is empty');
            }

            GM.xmlHttpRequest({
                method: 'POST',
                timeout: 12000,
                url: 'https://rdma.ooguy.com/help2',
                binary: true,
                data: imgData,
                headers: {
                    'Content-Type': 'image/jpeg',
                    'apikey': api_key
                },

                onload: async function(res) {
                    if (res.status === 429) {
                        _notify('ERROR: Rate limit exceeded (429)', 'Riddle Master Assistant');
                        handleFailure(imgData, { _status: 429 }, true);
                        return;
                    }

                    let returnDict;
                    try {
                        returnDict = JSON.parse(res.responseText);
                    } catch (e) {
                        _notify('ERROR: Invalid JSON from server', 'Riddle Master Assistant');
                        handleFailure(imgData, { _parse_error: e.message });
                        return;
                    }

                    if (returnDict.return === 'good') {
                        saveRiddle(imgData, returnDict);

                        extend_submit_interval = await GM.getValue('extend_submit_interval', extend_submit_interval);
                        const headers = parseResponseHeaders(res.responseHeaders);

                        // 勾选答案
                        const answers = returnDict.answer || '';
                        const riddler = document.getElementById('riddler1');
                        for (const [code, idx] of Object.entries(ANSWER_MAP)) {
                            if (answers.includes(code)) {
                                const cb = getCheckbox(riddler, idx);
                                if (cb) cb.checked = true;
                            }
                        }

                        if (parseInt(headers['x-ratelimit-remaining'] || '999', 10) < 3) {
                            _notify(`WARNING: Remaining ${headers['x-ratelimit-remaining']}`, 'Riddle Master Assistant Reborn');
                        }

                        const btn = document.getElementById('riddlesubmit');
                        if (btn) btn.disabled = false;

                        const delay = document.hasFocus()
                            ? extend_submit_interval * 1000
                            : 3000 + Math.random() * 5000;

                        setTimeout(() => {
                            if (btn) {
                                console.log('[RMA] Auto submit');
                                btn.click();
                            }
                        }, delay);

                        if (returnDict.expire === true) {
                            _notify('WARNING: License expired', 'Riddle Master Assistant Reborn');
                        }
                    }
                    else if (returnDict.return === 'finish') {
                        _notify('No more solves today', 'Riddle Master Assistant Reborn');
                        handleFailure(imgData, returnDict, true);
                    }
                    else if (returnDict.return === 'error' || returnDict.expire === true) {
                        _notify(returnDict.expire ? 'License invalid/expired' : 'Server error', 'Riddle Master Assistant');
                        handleFailure(imgData, returnDict, true);
                    }
                    else {
                        _notify('Unknown server response', 'Riddle Master Assistant');
                        handleFailure(imgData, returnDict);
                    }
                },

                onerror: function() {
                    _notify('Request error', 'Riddle Master Assistant');
                    handleFailure(imgData, { _onerror: true });
                },

                ontimeout: function() {
                    _notify('Request timeout', 'Riddle Master Assistant');
                    handleFailure(imgData, { _timeout: true });
                }
            });
        } catch (err) {
            console.error('[RMA] Image load failed', err);
            _notify('Cannot load riddle image', 'Riddle Master Assistant');
            handleFailure(null, { _image_error: err.message });
        }
    });
}