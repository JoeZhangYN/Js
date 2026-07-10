import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { exposeFromIife, readUserscript } from './userscript-test-helpers.mjs';

function qrContext() {
    let gmRequests = 0;
    let nativeImageLoads = 0;
    const browserSetTimeout = (callback, delay) => {
        const timer = setTimeout(callback, delay);
        timer.unref?.();
        return timer;
    };
    class FakeImage {
        set src(value) {
            this.currentSrc = value;
            if (value) nativeImageLoads++;
            queueMicrotask(() => this.onerror?.());
        }
    }
    const canvasContext = {
        drawImage(image) {
            if (image.tainted) throw new Error('tainted');
        },
        getImageData() {
            return { data: new Uint8ClampedArray(4), width: 1, height: 1 };
        },
    };
    const pageWindow = {
        addEventListener() {},
        screenX: 0,
        screenY: 0,
        outerWidth: 0,
        outerHeight: 0,
        innerWidth: 0,
        innerHeight: 0,
    };
    pageWindow.self = pageWindow;
    pageWindow.top = pageWindow;
    const context = {
        URL,
        Blob,
        Image: FakeImage,
        ImageData: class {
            constructor(data, width, height) {
                this.data = data;
                this.width = width;
                this.height = height;
            }
        },
        Uint8ClampedArray,
        Map,
        location: new URL('https://page.example/article'),
        window: pageWindow,
        console,
        document: {
            addEventListener() {},
            createElement(tag) {
                if (tag === 'canvas') {
                    return { width: 0, height: 0, getContext: () => canvasContext };
                }
                return { style: {}, appendChild() {} };
            },
            body: { appendChild() {} },
        },
        GM_addStyle() {},
        GM_getResourceText() { return ''; },
        GM_xmlhttpRequest(options) {
            gmRequests++;
            queueMicrotask(() => options.onerror?.());
        },
        GM_openInTab() {},
        GM_setClipboard() {},
        requestIdleCallback() { return 1; },
        setTimeout: browserSetTimeout,
        clearTimeout,
        queueMicrotask,
    };
    context.getGmRequests = () => gmRequests;
    context.getNativeImageLoads = () => nativeImageLoads;
    return context;
}

test('QR automatic scan cannot enter privileged image fetch', async () => {
    const source = await readUserscript('二维码自动解析 (增强版).js');
    const context = qrContext();
    const { classifyScanRequest, acquireImage } = exposeFromIife(
        source,
        ['classifyScanRequest', 'acquireImage'],
        context
    );
    const target = {
        tagName: 'IMG',
        currentSrc: 'https://images.example/qr.png',
        src: 'https://images.example/qr.png',
        complete: true,
        naturalWidth: 200,
        tainted: true,
    };

    const decision = await acquireImage(target, classifyScanRequest('quick', null));

    assert.equal(decision.status, 'blocked');
    assert.equal(decision.reason, 'cross-origin-permission-required');
    assert.equal(context.getNativeImageLoads(), 0);
    assert.equal(context.getGmRequests(), 0);
});

test('QR automatic scan consumes already rendered origin-clean pixels without refetching', async () => {
    const source = await readUserscript('二维码自动解析 (增强版).js');
    const context = qrContext();
    const { classifyScanRequest, acquireImage } = exposeFromIife(
        source,
        ['classifyScanRequest', 'acquireImage'],
        context
    );
    const target = {
        tagName: 'IMG',
        currentSrc: 'https://page.example/qr.png',
        src: 'https://page.example/qr.png',
        complete: true,
        naturalWidth: 200,
        tainted: false,
    };

    const decision = await acquireImage(target, classifyScanRequest('quick', null));

    assert.equal(decision.status, 'ready');
    assert.equal(decision.source, 'rendered-image');
    assert.equal(decision.image, target);
    assert.equal(context.getNativeImageLoads(), 0);
    assert.equal(context.getGmRequests(), 0);
});

test('QR explicit scan may enter privileged image fetch after CORS fails', async () => {
    const source = await readUserscript('二维码自动解析 (增强版).js');
    const context = qrContext();
    const { classifyScanRequest, acquireImage } = exposeFromIife(
        source,
        ['classifyScanRequest', 'acquireImage'],
        context
    );
    const target = {
        tagName: 'IMG',
        currentSrc: 'https://images.example/qr.png',
        src: 'https://images.example/qr.png',
        complete: true,
        naturalWidth: 200,
        tainted: true,
    };

    const decision = await acquireImage(target, classifyScanRequest('deep', null));

    assert.equal(decision.status, 'failed');
    assert.equal(context.getNativeImageLoads(), 1);
    assert.equal(context.getGmRequests(), 1);
});

test('QR pixels are decoded through the worker decision boundary', async () => {
    const source = await readUserscript('二维码自动解析 (增强版).js');
    let workerSource = '';
    class FakeBlob {
        constructor(parts) {
            this.source = parts.join('');
        }
    }
    class FakeURL extends URL {}
    FakeURL.createObjectURL = blob => {
        workerSource = blob.source;
        return 'blob:test-worker';
    };
    FakeURL.revokeObjectURL = () => {};

    class FakeWorker {
        constructor() {
            const workerGlobal = {
                Map,
                Uint8Array,
                Uint8ClampedArray,
                Uint32Array,
                console,
                queueMicrotask,
            };
            workerGlobal.self = workerGlobal;
            workerGlobal.globalThis = workerGlobal;
            workerGlobal.postMessage = data => queueMicrotask(() => this.onmessage?.({ data }));
            vm.runInNewContext(workerSource, workerGlobal, { timeout: 2000 });
            this.workerGlobal = workerGlobal;
        }

        postMessage(data) {
            queueMicrotask(() => this.workerGlobal.onmessage({ data }));
        }

        terminate() {}
    }

    const context = qrContext();
    context.URL = FakeURL;
    context.Blob = FakeBlob;
    context.Worker = FakeWorker;
    context.GM_getResourceText = name => name === 'jsqrWorker'
        ? "self.jsQR = pixels => pixels[0] === 7 ? { data: 'worker-result' } : null;"
        : `self.ZXing = {
            BarcodeFormat: { QR_CODE: 1, DATA_MATRIX: 2 },
            DecodeHintType: { TRY_HARDER: 1, POSSIBLE_FORMATS: 2 }
        };`;
    const { DecodeWorker } = exposeFromIife(source, ['DecodeWorker'], context);
    const imageData = {
        data: new Uint8ClampedArray([7, 0, 0, 255]),
        width: 1,
        height: 1,
    };

    const decision = await DecodeWorker.decode(imageData, 'quick');

    assert.equal(decision.status, 'decoded');
    assert.equal(decision.text, 'worker-result');
    assert.equal(decision.method, 'jsQR 全图');
});

test('QR worker prefers the native detector without invoking JS fallbacks', async () => {
    const source = await readUserscript('二维码自动解析 (增强版).js');
    let workerSource = '';
    class FakeBlob {
        constructor(parts) {
            this.source = parts.join('');
        }
    }
    class FakeURL extends URL {}
    FakeURL.createObjectURL = blob => {
        workerSource = blob.source;
        return 'blob:test-native-worker';
    };
    FakeURL.revokeObjectURL = () => {};
    class FakeImageData {
        constructor(data, width, height) {
            this.data = data;
            this.width = width;
            this.height = height;
        }
    }
    class FakeBarcodeDetector {
        static async getSupportedFormats() {
            return ['qr_code'];
        }

        async detect() {
            return [{ rawValue: 'native-result', format: 'qr_code' }];
        }
    }
    class FakeWorker {
        constructor() {
            const workerGlobal = {
                BarcodeDetector: FakeBarcodeDetector,
                ImageData: FakeImageData,
                Map,
                Uint8Array,
                Uint8ClampedArray,
                Uint32Array,
                console,
                queueMicrotask,
            };
            workerGlobal.self = workerGlobal;
            workerGlobal.globalThis = workerGlobal;
            workerGlobal.postMessage = data => queueMicrotask(() => this.onmessage?.({ data }));
            vm.runInNewContext(workerSource, workerGlobal, { timeout: 2000 });
            this.workerGlobal = workerGlobal;
        }

        postMessage(data) {
            queueMicrotask(() => this.workerGlobal.onmessage({ data }));
        }

        terminate() {}
    }

    const context = qrContext();
    context.URL = FakeURL;
    context.Blob = FakeBlob;
    context.Worker = FakeWorker;
    context.GM_getResourceText = name => name === 'jsqrWorker'
        ? 'self.jsQR = () => { throw new Error("JS fallback must not run"); };'
        : `self.ZXing = {
            BarcodeFormat: { QR_CODE: 1, DATA_MATRIX: 2 },
            DecodeHintType: { TRY_HARDER: 1, POSSIBLE_FORMATS: 2 }
        };`;
    const { DecodeWorker } = exposeFromIife(source, ['DecodeWorker'], context);

    const decision = await DecodeWorker.decode({
        data: new Uint8ClampedArray([7, 0, 0, 255]),
        width: 1,
        height: 1,
    }, 'quick');

    assert.equal(decision.status, 'decoded');
    assert.equal(decision.text, 'native-result');
    assert.equal(decision.method, 'BarcodeDetector 全图');
});
