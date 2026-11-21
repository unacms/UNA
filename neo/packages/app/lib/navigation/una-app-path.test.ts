import { test } from 'node:test'
import assert from 'node:assert/strict'
import { unaAppPath } from './una-app-path.ts'

const UNA = 'http://localhost:8088'

test('relative links are page paths', () => {
    assert.equal(unaAppPath('/view-persons-profile/admin', UNA), '/view-persons-profile/admin')
    assert.equal(unaAppPath('view-persons-profile', UNA), '/view-persons-profile')
    assert.equal(unaAppPath('page.php?i=view-persons-profile', UNA), '/page.php?i=view-persons-profile')
    assert.equal(unaAppPath('/dashboard#tab', UNA), '/dashboard#tab')
})

test('absolute URLs on UNA are page paths', () => {
    assert.equal(unaAppPath('http://localhost:8088/view-persons-profile/admin', UNA), '/view-persons-profile/admin')
    assert.equal(unaAppPath('http://localhost:8088/', UNA), '/')
    assert.equal(unaAppPath('http://localhost:8088/search?keyword=a%20b', UNA), '/search?keyword=a+b')
    assert.equal(unaAppPath('http://localhost:8088/x', UNA + '/'), '/x')
})

test("UNA's page request query is dropped, the page's own query stays", () => {
    assert.equal(
        unaAppPath('http://localhost:8088/dashboard?r=system%2Fget_page_by_request%2FTemplServicePages&params[]=dashboard%2F', UNA),
        '/dashboard',
    )
    assert.equal(
        unaAppPath('http://localhost:8088/view-post?id=5&r=system/get_page_by_request/TemplServicePages&lang=en&_q=x', UNA),
        '/view-post?id=5',
    )
})

test('a page request redirect from another host for UNA stays in the app', () => {
    // UNA's site URL is a LAN name, NEO calls it by localhost.
    assert.equal(
        unaAppPath('http://yasko.local:8088/view-persons-profile?r=system%2Fget_page_by_request%2FTemplServicePages&params[]=View-Persons-Profile', UNA),
        '/view-persons-profile',
    )
    assert.equal(
        unaAppPath('https://example.com/una/dashboard?r=system/get_page_by_request/TemplServicePages', 'http://una.internal/una'),
        '/dashboard',
    )
})

test('UNA under a path', () => {
    const base = 'https://example.com/una'
    assert.equal(unaAppPath('https://example.com/una/view-post?id=1', base), '/view-post?id=1')
    assert.equal(unaAppPath('https://example.com/una', base), '/')
    assert.equal(unaAppPath('https://example.com/other/page', base), null)
    assert.equal(unaAppPath('https://example.com/unafoo', base), null)
})

test('other sites are not app paths', () => {
    assert.equal(unaAppPath('https://checkout.stripe.com/c/pay/cs_test', UNA), null)
    assert.equal(unaAppPath('http://yasko.local:8088/view-persons-profile/admin', UNA), null)
    assert.equal(unaAppPath('https://localhost:8088/x', UNA), null, 'another scheme is another origin')
    assert.equal(unaAppPath('//evil.example/x', UNA), null)
    assert.equal(unaAppPath('https://evil.example/x?r=system/perform', UNA), null)
})

test('never a protocol-relative path', () => {
    assert.equal(unaAppPath('http://localhost:8088//evil.example/x', UNA), '/evil.example/x')
    assert.equal(unaAppPath('///evil.example', UNA), null)
    assert.equal(unaAppPath('/\\evil.example', UNA), null)
})

test('nothing to open', () => {
    assert.equal(unaAppPath('', UNA), null)
    assert.equal(unaAppPath('javascript:alert(1)', UNA), null)
    assert.equal(unaAppPath('mailto:a@b.c', UNA), null)
    assert.equal(unaAppPath(undefined as unknown as string, UNA), null)
})

test('without a known UNA, only relative links and page requests', () => {
    assert.equal(unaAppPath('/x', ''), '/x')
    assert.equal(unaAppPath('http://localhost:8088/x', ''), null)
    assert.equal(unaAppPath('http://localhost:8088/x?r=system/get_page_by_request/TemplServicePages', ''), '/x')
})
