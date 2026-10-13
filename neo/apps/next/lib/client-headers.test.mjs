// Run with `node --test apps/next/lib/client-headers.test.mjs` from the NEO root.
import assert from 'node:assert/strict';
import test from 'node:test';
import { dropForeignClientHeaders, resolveEdge } from './client-headers.ts';

const sent = () =>
    new Headers({
        'x-forwarded-for': '203.0.113.77',
        'x-real-ip': '203.0.113.78',
        'cf-connecting-ip': '203.0.113.79',
        'true-client-ip': '203.0.113.80',
        'cf-ipcountry': 'KP',
        'cf-ipcity': 'Pyongyang',
        'x-vercel-ip-country': 'DE',
        'x-vercel-ip-city': 'Berlin',
        'cloudfront-viewer-country': 'FR',
        'x-country-code': 'US',
        'accept-language': 'en',
    });

const names = (headers) => [...headers.keys()].sort();

test('the edge comes from NEO_EDGE, then Vercel, then a proxy', () => {
    assert.equal(resolveEdge({ NEO_EDGE: 'Cloudflare' }), 'cloudflare');
    assert.equal(resolveEdge({ NEO_EDGE: 'none', VERCEL: '1' }), 'none');
    assert.equal(resolveEdge({ VERCEL: '1' }), 'vercel');
    assert.equal(resolveEdge({ NEO_EDGE: 'fastly' }), 'proxy');
    assert.equal(resolveEdge({}), 'proxy');
});

test('only the edge headers reach UNA', () => {
    assert.deepEqual(names(dropForeignClientHeaders(sent(), 'vercel')), ['accept-language', 'x-forwarded-for', 'x-real-ip', 'x-vercel-ip-city', 'x-vercel-ip-country']);
    assert.deepEqual(names(dropForeignClientHeaders(sent(), 'cloudflare')), ['accept-language', 'cf-connecting-ip', 'cf-ipcity', 'cf-ipcountry', 'x-forwarded-for']);
    assert.deepEqual(names(dropForeignClientHeaders(sent(), 'cloudfront')), ['accept-language', 'cloudfront-viewer-country', 'x-forwarded-for']);
    assert.deepEqual(names(dropForeignClientHeaders(sent(), 'proxy')), ['accept-language', 'x-forwarded-for', 'x-real-ip']);
    assert.deepEqual(names(dropForeignClientHeaders(sent(), 'none')), ['accept-language']);
    assert.deepEqual(names(dropForeignClientHeaders(sent(), 'unknown')), ['accept-language']);
});
