import { test } from 'node:test'
import assert from 'node:assert/strict'
import { opensInThisTab } from './same-tab-click.ts'

test('a plain click opens the link in this tab', () => {
    assert.equal(opensInThisTab({ button: 0 }), true)
    assert.equal(opensInThisTab(undefined), true)
    assert.equal(opensInThisTab({ button: 0 }, '_self'), true)
})

test('modifier clicks and new-tab links leave this tab where it is', () => {
    for (const key of ['metaKey', 'ctrlKey', 'shiftKey', 'altKey'] as const)
        assert.equal(opensInThisTab({ button: 0, [key]: true }), false, key)
    assert.equal(opensInThisTab({ button: 1 }), false)
    assert.equal(opensInThisTab({ button: 0 }, '_blank'), false)
    assert.equal(opensInThisTab(undefined, '_blank'), false)
})
