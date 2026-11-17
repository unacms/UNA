import { describe, expect, it } from 'vitest';

import { SECTIONS } from './router';
import { SECTION_ICONS } from './section-icons';
import { SECTION_INFO, sectionItem, sectionName } from './sections';

describe('sections', () => {
    it('names and draws every section', () => {
        for (const section of SECTIONS) {
            expect(sectionName(section)).not.toBe('');
            expect(SECTION_ICONS[section]).toBe(SECTION_INFO[section].icon);
        }
        expect(Object.keys(SECTION_INFO).sort()).toEqual([...SECTIONS].sort());
    });

    it('makes a sidebar row of a section', () => {
        expect(sectionItem('spaces')).toEqual({ section: 'spaces', label: 'Spaces', icon: 'orbit' });
    });

    it('keeps the icons of the places a site names that are no section', () => {
        expect(SECTION_ICONS.persons).toBe('user-round');
        expect(SECTION_ICONS.albums).toBe('images');
    });
});
