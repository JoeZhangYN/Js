import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));

export function readUserscript(name) {
    return readFile(join(root, name), 'utf8');
}

export function exposeFromIife(source, names, context) {
    const marker = /\n\}\)\(\);\s*$/;
    assert.match(source, marker);
    const instrumented = source.replace(
        marker,
        `\nglobalThis.__testExports = { ${names.join(', ')} };\n})();`
    );
    vm.runInNewContext(instrumented, context, { timeout: 2000 });
    return context.__testExports;
}
