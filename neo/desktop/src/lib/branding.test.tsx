import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { SiteMark } from '../components/site-mark';
import { dueForRecheck, noteAsked, readKept, resetAsked, siteInfoOf } from './branding';

const SITE = 'https://makers.example';
const branding = {
    name: 'UNA Makers',
    short_name: 'Makers',
    description: 'People who make things',
    mark: 'https://makers.example/s/mark.png',
    mark_dark: 'https://makers.example/s/mark-dark.png',
    logo: null,
    logo_dark: null,
    logo_aspect: null,
    icon: 'https://makers.example/icon.png',
    accent: '#0F766E',
};

afterEach(() => localStorage.clear());

describe('siteInfoOf', () => {
    it('names the network: the sign-in, then the branding, then ApiInfo, then the host', () => {
        expect(siteInfoOf(SITE, 'Stored', { name: 'Old', branding }).name).toBe('Stored');
        expect(siteInfoOf(SITE, '', { name: 'Old', branding }).name).toBe('UNA Makers');
        expect(siteInfoOf(SITE, undefined, { name: 'Old' }).name).toBe('Old');
        const unknown = siteInfoOf(SITE, undefined, undefined);
        expect(unknown).toMatchObject({ name: 'makers.example', named: false, mark: null, accent: null });
    });

    it('carries the mark, icon and accent of the branding block', () => {
        expect(siteInfoOf(SITE, undefined, { name: 'x', branding })).toMatchObject({
            mark: branding.mark,
            markDark: branding.mark_dark,
            icon: branding.icon,
            accent: '#0F766E',
        });
    });
});

describe('dueForRecheck', () => {
    afterEach(() => resetAsked());

    it('asks a site never asked, and then not again on focus for a day, whatever the answer was', () => {
        expect(dueForRecheck(SITE)).toBe(true);
        // asked at 0 (a failed ask leaves no dataUpdatedAt, but it is noted all the same)
        noteAsked(SITE, 0);
        expect(dueForRecheck(SITE, 1000)).toBe(false);
        expect(dueForRecheck(SITE, 24 * 60 * 60 * 1000)).toBe(false);
        expect(dueForRecheck(SITE, 24 * 60 * 60 * 1000 + 1)).toBe(true);
        expect(dueForRecheck('https://other.example', 1000)).toBe(true);
    });
});

describe('readKept', () => {
    it('reads the last answer for the site, and nothing from a broken one', () => {
        localStorage.setItem('una.siteInfo:https://makers.example', JSON.stringify({ name: 'UNA Makers', branding }));
        expect(readKept(`${SITE}/`)?.branding?.accent).toBe('#0F766E');
        localStorage.setItem('una.siteInfo:https://makers.example', '{not json');
        expect(readKept(SITE)).toBeUndefined();
        expect(readKept('https://other.example')).toBeUndefined();
    });
});

describe('SiteMark', () => {
    it('draws the mark with its dark variant, which the theme picks', () => {
        const { container } = render(<SiteMark site={{ name: 'UNA Makers', mark: branding.mark, markDark: branding.mark_dark, icon: null }} siteUrl={SITE} size={24} />);
        const imgs = container.querySelectorAll('img.site-mark');
        expect([...imgs].map((i) => i.getAttribute('data-variant'))).toEqual(['light', 'dark']);
        expect([...imgs].every((i) => i.getAttribute('alt') === '')).toBe(true);
    });

    it('falls back to the icon, then a monogram', () => {
        const { container, rerender } = render(<SiteMark site={{ name: 'UNA Makers', mark: null, markDark: null, icon: branding.icon }} siteUrl={SITE} size={40} />);
        expect(container.querySelector('img')?.getAttribute('src')).toBe(branding.icon);
        // a plain http picture of another site is refused
        rerender(<SiteMark site={{ name: 'UNA Makers', mark: 'http://elsewhere.example/m.png', markDark: null, icon: null }} siteUrl={SITE} size={40} />);
        expect(container.querySelector('img')).toBeNull();
        expect(container.querySelector('.site-mark-mono')?.textContent).toBe('U');
        expect(container.querySelector('.site-mark-mono')?.getAttribute('aria-hidden')).toBe('true');
    });
});
