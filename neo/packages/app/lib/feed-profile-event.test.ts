// node --test packages/app/lib/feed-profile-event.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isProfileFeedEntry } from './feed-profile-event.ts'

const person = { module: 'bx_persons', url: '/view-persons-profile/muha' }

test('an entry about its author\'s own profile is a profile entry', () => {
    assert.equal(isProfileFeedEntry({ type: 'bx_persons', url: '/view-persons-profile/muha', author_data: person }), true)
    assert.equal(isProfileFeedEntry({ type: 'bx_persons', url: 'view-persons-profile/muha', author_data: person }), true)
    assert.equal(isProfileFeedEntry({
        type: 'bx_organizations',
        url: 'https://example.com/view-organization-profile/acme/#cmts',
        author_data: { module: 'bx_organizations', url: '/view-organization-profile/acme' },
    }), true)
})

test('content by a profile is not a profile entry', () => {
    assert.equal(isProfileFeedEntry({ type: 'bx_posts', url: '/view-post/hello', author_data: person }), false)
    // A group made by a person: a profile module's page, but not the author's own.
    assert.equal(isProfileFeedEntry({ type: 'bx_groups', url: '/view-group-profile/club', author_data: person }), false)
    // Another person's profile.
    assert.equal(isProfileFeedEntry({ type: 'bx_persons', url: '/view-persons-profile/lily', author_data: person }), false)
})

test('missing data is not a profile entry', () => {
    assert.equal(isProfileFeedEntry(null), false)
    assert.equal(isProfileFeedEntry({}), false)
    assert.equal(isProfileFeedEntry({ type: 'bx_persons', url: '', author_data: { module: 'bx_persons', url: '' } }), false)
    assert.equal(isProfileFeedEntry({ type: 'bx_persons', url: '/view-persons-profile/muha', author_data: null }), false)
})
