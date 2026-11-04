// Run with `node --test apps/next/lib/tenant.test.ts` from the NEO root (Node 24 strips the types).
import assert from 'node:assert/strict';
import test from 'node:test';
import { dropTenantHeaders, resolvePreviewBackend } from './tenant.ts';

test('every x-tenant-* header a client sends is dropped', () => {
    const headers = new Headers({
        'X-Tenant-Id': '7',
        'x-tenant-una-url': 'https://una.example.com',
        'x-tenant-una-key': 'sent-by-client',
        'x-tenant-revision': '3',
        'x-tenant-anything': '1',
        'x-tenants': 'kept',
        'accept-language': 'en',
        host: 'neo.example.com',
    });

    assert.equal(dropTenantHeaders(headers), headers);
    assert.deepEqual([...headers.keys()].sort(), ['accept-language', 'host', 'x-tenants']);
});

test('a preview host names its PR backend', () => {
    assert.deepEqual(resolvePreviewBackend('pr-42.preview.example.com', 'preview.example.com', 'preview-key'), {
        id: 'preview-42',
        unaUrl: 'https://api-pr-42.preview.example.com',
        unaApiKey: 'preview-key',
        revision: 0,
    });
    assert.equal(resolvePreviewBackend('PR-42.Preview.Example.com:443', 'preview.example.com', 'preview-key')?.id, 'preview-42');
});

test('other hosts, and unset previews, keep the configured UNA', () => {
    assert.equal(resolvePreviewBackend('neo.example.com', 'preview.example.com', 'preview-key'), null);
    assert.equal(resolvePreviewBackend('pr-42.preview.example.com.other.net', 'preview.example.com', 'preview-key'), null);
    assert.equal(resolvePreviewBackend('pr-x.preview.example.com', 'preview.example.com', 'preview-key'), null);
    assert.equal(resolvePreviewBackend('', 'preview.example.com', 'preview-key'), null);
    assert.equal(resolvePreviewBackend(null, 'preview.example.com', 'preview-key'), null);
    assert.equal(resolvePreviewBackend('pr-42.preview.example.com', '', 'preview-key'), null);
    assert.equal(resolvePreviewBackend('pr-42.preview.example.com', 'preview.example.com', ''), null);
});
