import { describe, expect, it } from 'vitest';

import { isIconName } from '../components/icon';
import { SECTION_ICONS, sectionIcon } from './section-icons';
import { currentRowIcon, type NavGroupModel } from './site-navigation';

describe('section icons', () => {
    it('are one table, drawn by the app, and the ones UNA and NEO use', () => {
        for (const [section, icon] of Object.entries(SECTION_ICONS)) expect(isIconName(icon), section).toBe(true);
        expect(sectionIcon('connections')).toBe('users-round');
        expect(sectionIcon('no-such-section')).toBe('file-text');
    });

    it("take the site's icon of the sidebar's current row, for the tab and the pane's title", () => {
        const groups: NavGroupModel[] = [
            {
                kind: 'items',
                key: 'main',
                title: '',
                rows: [
                    { key: 'home', label: 'Home', icon: 'house', fallbackIcon: 'house', list: { section: 'home' }, counter: null },
                    { key: 'friends', label: 'Connections', icon: 'handshake', fallbackIcon: 'users-round', list: { section: 'connections' }, counter: null },
                    { key: 'odd', label: 'Odd', icon: null, fallbackIcon: 'file-text', list: { section: 'page', page: 'odd' }, counter: null },
                ],
            },
        ];
        expect(currentRowIcon(groups, { section: 'connections', connections: 'requests' })).toEqual({ name: 'handshake', fallback: 'users-round' });
        expect(currentRowIcon(groups, { section: 'page', page: 'odd' })).toEqual({ name: null, fallback: 'file-text' });
        expect(currentRowIcon(groups, { section: 'search' })).toBeNull();
    });
});
