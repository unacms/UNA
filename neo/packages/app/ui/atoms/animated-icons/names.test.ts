import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Run: node --test packages/app/ui/atoms/animated-icons/names.test.ts (from neo/)
const dir = new URL('.', import.meta.url);
const keys = (file: string, pattern: RegExp) => [...readFileSync(new URL(file, dir), 'utf8').matchAll(pattern)].map((m) => m[1]);

test('the web registry lists every default spec', () => {
    const specs = keys('specs.ts', /^ {4}([A-Z][A-Za-z0-9]*): \{/gm);
    const names = keys('names.ts', /^ {4}'([A-Z][A-Za-z0-9]*)',/gm);
    assert.deepEqual(names, specs);
});
