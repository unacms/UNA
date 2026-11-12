import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Schema } from 'una-api';

import { badgeColors, BADGE_MIN_CONTRAST, BADGE_MORE_CONTRAST, contrast, parseHex } from '../lib/badge-colors';
import { BADGES_SHOWN, badgeNames, drawnBadges, ProfileBadges } from './profile-badges';
import { TOOLTIP_DELAY } from './tooltip';

type Badge = Schema<'ProfileBadge'>;

const founder: Badge = { id: '7', name: 'Founder', icon: 'crown', color: '#d97706' };
const moderator: Badge = { id: '8', name: 'Moderator', icon: 'shield-check', color: '#2563eb' };
const top: Badge = { id: '9', name: 'Top contributor', icon: 'star', color: '#059669' };
const plain: Badge = { id: '10', name: 'Helper', icon: 'not-in-the-set', color: null };

afterEach(cleanup);

/** The colours Studio offers a badge (Tailwind's 600 shades), as the API sends them. */
const STUDIO = [
    '#475569', '#4b5563', '#52525b', '#525252', '#57534e', '#dc2626', '#ea580c', '#d97706', '#ca8a04', '#65a30d', '#16a34a',
    '#059669', '#0d9488', '#0891b2', '#0284c7', '#2563eb', '#4f46e5', '#7c3aed', '#9333ea', '#c026d3', '#db2777', '#e11d48',
];

describe('badge colours', () => {
    it('keep the text at 4.5:1 or more on the tint, in light and dark, for every colour', () => {
        for (const hex of [...STUDIO, '#ffff00', '#00ffff', '#ffffff', '#000000', '#fde68a', '#1e1b4b', null]) {
            const c = badgeColors(hex);
            expect(contrast(c.light.fg, c.light.bg), `${hex} light`).toBeGreaterThanOrEqual(BADGE_MIN_CONTRAST);
            expect(contrast(c.dark.fg, c.dark.bg), `${hex} dark`).toBeGreaterThanOrEqual(BADGE_MIN_CONTRAST);
            // Increase Contrast: 7:1, as the app's other secondary text gets
            expect(contrast(c.light.more, c.light.bg), `${hex} light, more contrast`).toBeGreaterThanOrEqual(BADGE_MORE_CONTRAST);
            expect(contrast(c.dark.more, c.dark.bg), `${hex} dark, more contrast`).toBeGreaterThanOrEqual(BADGE_MORE_CONTRAST);
        }
    });

    it('tint toward the badge colour: a light tint in light, a dark one in dark', () => {
        const c = badgeColors('#2563eb');
        const [r, g, b] = parseHex(c.light.bg) ?? [0, 0, 0];
        expect(b).toBeGreaterThan(r);
        expect(Math.min(r, g, b)).toBeGreaterThan(200);
        expect(Math.max(...(parseHex(c.dark.bg) ?? [255, 255, 255]))).toBeLessThan(90);
    });

    it('read #rgb and #rrggbb, and nothing else', () => {
        expect(parseHex('#abc')).toEqual([170, 187, 204]);
        expect(parseHex('#2563EB')).toEqual([37, 99, 235]);
        expect(parseHex('blue')).toBeNull();
        expect(parseHex(null)).toBeNull();
    });
});

describe('ProfileBadges', () => {
    it('draws nothing for a profile with no badges', () => {
        const { container } = render(<ProfileBadges badges={undefined} />);
        expect(container.innerHTML).toBe('');
        render(<ProfileBadges badges={[]} />);
        expect(document.querySelector('.badges')).toBeNull();
    });

    it(`shows ${BADGES_SHOWN} pills and +N for the rest, and says every badge as text`, () => {
        const { container } = render(<ProfileBadges badges={[founder, moderator, top]} />);
        const pills = Array.from(container.querySelectorAll<HTMLElement>('.badges-pills .badge'));
        expect(pills.map((p) => p.textContent?.trim())).toEqual(['Founder', 'Moderator', '+1']);
        // the pills are for the eye; the list is said once, after the name
        expect(container.querySelector('.badges-pills')?.getAttribute('aria-hidden')).toBe('true');
        expect(container.querySelector('.sr-only')?.textContent).toBe(', Founder, Moderator, Top contributor');
        // the badge's colours, per theme, and its icon
        expect(pills[0]?.style.getPropertyValue('--badge-fg')).toBe(badgeColors('#d97706').light.fg);
        expect(pills[0]?.style.getPropertyValue('--badge-bg-dark')).toBe(badgeColors('#d97706').dark.bg);
        expect(pills[0]?.style.getPropertyValue('--badge-fg-dark-more')).toBe(badgeColors('#d97706').dark.more);
        expect(pills[0]?.querySelector('[data-icon="crown"]')).not.toBeNull();
    });

    it('draws "+N" as an opaque neutral pill, so a selected row behind it keeps the contrast', () => {
        const { container } = render(<ProfileBadges badges={[founder, moderator, top]} />);
        const more = container.querySelector<HTMLElement>('.badge-more');
        const neutral = badgeColors(null);
        // the colours of a badge with no colour, whose tint is opaque and keeps 4.5:1 (above)
        expect(more?.style.getPropertyValue('--badge-bg')).toBe(neutral.light.bg);
        expect(more?.style.getPropertyValue('--badge-fg')).toBe(neutral.light.fg);
        expect(more?.style.getPropertyValue('--badge-bg-dark')).toBe(neutral.dark.bg);
        expect(more?.style.getPropertyValue('--badge-fg-dark')).toBe(neutral.dark.fg);
        expect(parseHex(neutral.light.bg)).not.toBeNull();
        expect(parseHex(neutral.dark.bg)).not.toBeNull();
    });

    it('leaves out a badge that would draw an empty pill: no name and no icon the app has', () => {
        const blank: Badge = { id: '11', name: ' ', icon: 'not-in-the-set', color: '#dc2626' };
        const noIcon: Badge = { id: '12', name: '', icon: null, color: null };
        const iconOnly: Badge = { ...founder, id: '13', name: '' };
        expect(drawnBadges([blank, moderator, noIcon, iconOnly]).map((b) => b.id)).toEqual(['8', '13']);

        // not drawn and not counted in "+N"
        const { container } = render(<ProfileBadges badges={[blank, moderator, noIcon, iconOnly]} max={1} />);
        expect(Array.from(container.querySelectorAll('.badges-pills .badge')).map((p) => p.textContent?.trim())).toEqual(['Moderator', '+1']);
        cleanup();
        expect(render(<ProfileBadges badges={[blank, noIcon]} />).container.innerHTML).toBe('');
    });

    it('shows a pill without an icon for an icon the app does not draw, and a neutral one for no colour', () => {
        const { container } = render(<ProfileBadges badges={[plain]} />);
        const pill = container.querySelector<HTMLElement>('.badge');
        expect(pill?.textContent).toBe('Helper');
        expect(pill?.querySelector('.icon')).toBeNull();
        expect(pill?.style.getPropertyValue('--badge-bg')).toBe(badgeColors(null).light.bg);
    });

    it('shows them all where asked, with its own lead', () => {
        const { container } = render(<ProfileBadges badges={[founder, moderator, top]} max={Infinity} lead="Badges: " />);
        expect(container.querySelectorAll('.badges-pills .badge')).toHaveLength(3);
        expect(container.querySelector('.badge-more')).toBeNull();
        expect(container.querySelector('.sr-only')?.textContent).toBe('Badges: Founder, Moderator, Top contributor');
    });

    it('keeps the name the accessible name of its button, and adds the badges to the row\'s', () => {
        render(
            <article aria-labelledby="by">
                <span id="by">
                    <button type="button">Lily</button>
                    <ProfileBadges badges={[moderator, founder, top]} />
                </span>
            </article>,
        );
        expect(screen.getByRole('button', { name: 'Lily' })).toBeTruthy();
        // a row named by the name's line says the badges after it, without the pills' text
        // (the button is a box of its own, so a space may come before the comma)
        expect(screen.getByRole('article', { name: /^Lily ?, Moderator, Founder, Top contributor$/ })).toBeTruthy();
    });

    it('draws a badge\'s picture in place of its icon: 16px, round, with no alt of its own', () => {
        const pictured: Badge = { ...moderator, image: 'https://example.com/s/sys_images_resized/badge.png' };
        const { container } = render(<ProfileBadges badges={[pictured]} />);
        const pill = container.querySelector<HTMLElement>('.badge');
        const img = pill?.querySelector('img');
        expect(img?.getAttribute('src')).toBe('https://example.com/s/sys_images_resized/badge.png');
        expect(img?.getAttribute('alt')).toBe('');
        expect([img?.getAttribute('width'), img?.getAttribute('height')]).toEqual(['16', '16']);
        expect(img?.className).toBe('badge-image');
        // the picture replaces the icon; the name stays
        expect(pill?.querySelector('.icon')).toBeNull();
        expect(pill?.textContent).toBe('Moderator');
        expect(pill?.classList.contains('badge-pictured')).toBe(true);
        expect(container.querySelector('.sr-only')?.textContent).toBe(', Moderator');
    });

    it('falls back to the icon when the picture fails twice, or may not be loaded', () => {
        vi.useFakeTimers();
        try {
            const pictured: Badge = { ...moderator, image: 'https://example.com/fails.png' };
            const { container } = render(<ProfileBadges badges={[pictured]} />);
            fireEvent.error(container.querySelector('img') as HTMLImageElement);
            act(() => {
                vi.advanceTimersByTime(2000);
            });
            fireEvent.error(container.querySelector('img') as HTMLImageElement);
            expect(container.querySelector('img')).toBeNull();
            expect(container.querySelector('[data-icon="shield-check"]')).not.toBeNull();
        } finally {
            vi.useRealTimers();
        }
        cleanup();
        // a plain-http picture of another site is refused (lib/media.ts): the icon then
        const { container } = render(<ProfileBadges badges={[{ ...moderator, image: 'http://elsewhere.example/b.png' }]} />);
        expect(container.querySelector('img')).toBeNull();
        expect(container.querySelector('[data-icon="shield-check"]')).not.toBeNull();
    });

    it('counts a picture as something to draw, when the app may load it', () => {
        const pictureOnly: Badge = { id: '14', name: '', icon: null, color: null, image: 'https://example.com/p.png' };
        const refused: Badge = { ...pictureOnly, id: '15', image: 'http://elsewhere.example/p.png' };
        const src = (u: string | null | undefined) => (u?.startsWith('https:') ? u : null);
        expect(drawnBadges([pictureOnly, refused], src).map((b) => b.id)).toEqual(['14']);
        expect(drawnBadges([pictureOnly, refused]).map((b) => b.id)).toEqual([]);
        const { container } = render(<ProfileBadges badges={[pictureOnly, refused]} />);
        expect(container.querySelectorAll('.badges-pills .badge')).toHaveLength(1);
    });

    it('draws an icon-only badge as a round chip with no text, its name in a tooltip and in the said list', () => {
        vi.useFakeTimers();
        try {
            const compact: Badge = { ...founder, icon_only: true };
            const { container } = render(<ProfileBadges badges={[compact, moderator]} />);
            const chip = container.querySelector<HTMLElement>('.badge-chip');
            expect(chip?.textContent?.trim()).toBe('');
            expect(chip?.querySelector('[data-icon="crown"]')).not.toBeNull();
            expect(chip?.style.getPropertyValue('--badge-bg')).toBe(badgeColors('#d97706').light.bg);
            // the screen reader hears it like any other
            expect(container.querySelector('.sr-only')?.textContent).toBe(', Founder, Moderator');
            // it still counts toward the cap
            expect(Array.from(container.querySelectorAll('.badges-pills .badge')).map((p) => p.textContent?.trim())).toEqual(['', 'Moderator']);
            // the name as the app's tooltip, on hover
            fireEvent.pointerEnter(chip?.closest('.tooltip-anchor') as HTMLElement);
            act(() => {
                vi.advanceTimersByTime(TOOLTIP_DELAY + 50);
            });
            expect(screen.getByText('Founder', { selector: '.tooltip span' })).toBeTruthy();
        } finally {
            vi.useRealTimers();
        }
    });

    it('draws an icon-only badge\'s picture as the chip, and the name as a pill when it has nothing to draw', () => {
        const picture: Badge = { ...moderator, icon: null, icon_only: true, image: 'https://example.com/m.png' };
        const nothing: Badge = { ...top, icon: 'not-in-the-set', icon_only: true };
        const { container } = render(<ProfileBadges badges={[picture, nothing]} />);
        const [chip, pill] = Array.from(container.querySelectorAll<HTMLElement>('.badges-pills .badge'));
        expect(chip?.classList.contains('badge-chip')).toBe(true);
        expect(chip?.querySelector('img.badge-image')?.getAttribute('alt')).toBe('');
        expect(chip?.textContent?.trim()).toBe('');
        expect(pill?.classList.contains('badge-chip')).toBe(false);
        expect(pill?.textContent).toBe('Top contributor');
        expect(container.querySelector('.sr-only')?.textContent).toBe(', Moderator, Top contributor');
    });

    it('keeps a picture\'s place while it waits to be tried again: an icon-only chip stays a chip', () => {
        vi.useFakeTimers();
        try {
            const compact: Badge = { ...moderator, icon: null, icon_only: true, image: 'https://example.com/retry-chip.png' };
            const { container } = render(<ProfileBadges badges={[compact, founder]} />);
            fireEvent.error(container.querySelector('img') as HTMLImageElement);
            const [chip, pill] = Array.from(container.querySelectorAll<HTMLElement>('.badges-pills .badge'));
            expect(chip?.classList.contains('badge-chip')).toBe(true);
            expect(chip?.classList.contains('badge-pictured')).toBe(true);
            expect(chip?.querySelector('.badge-image-pending')).not.toBeNull();
            expect(chip?.textContent?.trim()).toBe('');
            expect(pill?.textContent?.trim()).toBe('Founder');
            act(() => {
                vi.advanceTimersByTime(2000);
            });
            expect(container.querySelector('.badge-chip img.badge-image')?.getAttribute('src')).toBe('https://example.com/retry-chip.png');
            expect(container.querySelector('.badge-image-pending')).toBeNull();
        } finally {
            vi.useRealTimers();
        }
    });

    it('gives a picture-only badge\'s place under the cap to the next one once its picture failed for good', () => {
        vi.useFakeTimers();
        try {
            const pictureOnly: Badge = { id: '16', name: '', icon: null, color: null, image: 'https://example.com/gone-for-good.png' };
            const { container } = render(<ProfileBadges badges={[pictureOnly, moderator, founder]} max={2} />);
            const pills = () => Array.from(container.querySelectorAll<HTMLElement>('.badges-pills .badge')).map((p) => p.textContent?.trim());
            expect(pills()).toEqual(['', 'Moderator', '+1']);
            fireEvent.error(container.querySelector('img') as HTMLImageElement);
            act(() => {
                vi.advanceTimersByTime(2000);
            });
            fireEvent.error(container.querySelector('img') as HTMLImageElement);
            expect(container.querySelector('img')).toBeNull();
            expect(pills()).toEqual(['Moderator', 'Founder']);
        } finally {
            vi.useRealTimers();
        }
    });

    it('names icon-only badges by nothing, and leaves them out of the said list', () => {
        expect(badgeNames([{ ...founder, name: ' ' }, moderator])).toEqual(['Moderator']);
    });
});
