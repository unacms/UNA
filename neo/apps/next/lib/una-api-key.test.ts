// Run with `node --test apps/next/lib/una-api-key.test.ts` from the NEO root (Node 24 strips the types).
import assert from 'node:assert/strict';
import test from 'node:test';
import { sendsUnaApiKey } from './una-api-key.ts';

test('the API key goes to api.php', () => {
    assert.equal(sendsUnaApiKey('/api.php'), true);
    assert.equal(sendsUnaApiKey('api.php'), true);
    assert.equal(sendsUnaApiKey('/api.php?r=system/get_menu/TemplServices'), true);
    assert.equal(sendsUnaApiKey('/una/api.php'), true);
});

test('the API key goes nowhere else', () => {
    for (const path of ['/storage.php', '/grid.php', '/modules/index.php', '/studio/builder_page.php', '/sys-ai-chat/3', '/api.php.bak', '/api.phpx', '/notapi.php', '/api_v2.php', '/', '']) {
        assert.equal(sendsUnaApiKey(path), false, path);
    }
});
