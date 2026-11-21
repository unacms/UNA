import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LOGO_DEFAULT_ASPECT, pickSiteLogo } from './site-logo.ts';

test('no sources: UNA artwork', () => {
    assert.equal(pickSiteLogo(null, 'full'), null);
    assert.equal(pickSiteLogo({ logo: null, mark: null }, 'mark'), null);
});

test('the logo, its dark version falling back to it', () => {
    assert.deepEqual(pickSiteLogo({ logo: 'l.png', logo_aspect: 4 }, 'full'), { light: 'l.png', dark: 'l.png', aspect: 4 });
    assert.deepEqual(pickSiteLogo({ logo: 'l.png', logo_dark: 'd.png' }, 'full'), { light: 'l.png', dark: 'd.png', aspect: LOGO_DEFAULT_ASPECT });
});

test('the mark is square; without one the logo stands in', () => {
    assert.deepEqual(pickSiteLogo({ logo: 'l.png', mark: 'm.png', mark_dark: 'md.png' }, 'mark'), { light: 'm.png', dark: 'md.png', aspect: 1 });
    assert.deepEqual(pickSiteLogo({ logo: 'l.png', logo_aspect: 3 }, 'mark'), { light: 'l.png', dark: 'l.png', aspect: 3 });
});
