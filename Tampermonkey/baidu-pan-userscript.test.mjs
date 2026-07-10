import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { exposeFromIife, readUserscript } from './userscript-test-helpers.mjs';

function baseBaiduContext(url = 'https://example.com/article') {
    return {
        URL,
        URLSearchParams,
        location: new URL(url),
        console,
        document: {
            readyState: 'loading',
            addEventListener() {},
        },
        setTimeout() {},
        clearTimeout,
        performance,
    };
}

test('Baidu share decision preserves query and fragment ordering', async () => {
    const source = await readUserscript('百度网盘提取码自动拼接.js');
    const context = baseBaiduContext();
    const { decideBaiduShareLink } = exposeFromIife(
        source,
        ['decideBaiduShareLink'],
        context
    );

    const decision = decideBaiduShareLink(
        'https://pan.baidu.com/s/share_1?from=forum#preview',
        'aB12'
    );

    assert.equal(decision.status, 'applied');
    const result = new URL(decision.href);
    assert.equal(result.searchParams.get('from'), 'forum');
    assert.equal(result.searchParams.get('pwd'), 'aB12');
    assert.equal(result.hash, '#preview');
});

test('Baidu share decision replaces invalid pwd but preserves a valid one', async () => {
    const source = await readUserscript('百度网盘提取码自动拼接.js');
    const context = baseBaiduContext();
    const { decideBaiduShareLink } = exposeFromIife(
        source,
        ['decideBaiduShareLink'],
        context
    );

    const replaced = decideBaiduShareLink(
        'https://pan.baidu.com/s/share_2?pwd=abcde',
        'z9Y8'
    );
    assert.equal(replaced.status, 'applied');
    assert.equal(replaced.replacedInvalidCode, true);
    assert.equal(new URL(replaced.href).searchParams.get('pwd'), 'z9Y8');

    const preserved = decideBaiduShareLink(
        'https://pan.baidu.com/s/share_2?pwd=A1b2',
        'z9Y8'
    );
    assert.equal(preserved.status, 'already-ready');
    assert.equal(preserved.code, 'A1b2');
});

test('Baidu share page submits as soon as the input and action exist', async () => {
    const source = await readUserscript('百度网盘提取码自动拼接.js');
    let clickCount = 0;

    class FakeInput {
        constructor() {
            this.isConnected = true;
            this.disabled = false;
            this._value = '';
            this.form = null;
        }

        get value() { return this._value; }
        set value(value) { this._value = value; }
        focus() {}
        dispatchEvent() {}
        closest() { return null; }
    }

    const input = new FakeInput();
    const button = {
        isConnected: true,
        disabled: false,
        click() { clickCount++; },
    };
    const context = {
        URL,
        URLSearchParams,
        location: new URL('https://pan.baidu.com/s/share_3?pwd=aB12'),
        console,
        HTMLInputElement: FakeInput,
        Event: class {},
        document: {
            readyState: 'loading',
            querySelector(selector) {
                if (selector.startsWith('input')) return input;
                if (selector === 'a.g-button-right') return button;
                return null;
            },
            querySelectorAll() { return []; },
            addEventListener() {},
            documentElement: {},
        },
        setTimeout() {},
        clearTimeout,
    };

    vm.runInNewContext(source, context, { timeout: 2000 });

    assert.equal(input.value, 'aB12');
    assert.equal(clickCount, 1);
});
