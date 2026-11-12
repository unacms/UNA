import { describe, expect, it } from 'vitest';

import { type Accent, applyAccent, contrast, deriveAccent, fromOklch, MATERIAL_MARGIN, NEO, over, parseHex, type Rgb, SURFACES, toHex, toOklch } from './accent';

const rgb = (hex: string): Rgb => parseHex(hex)!;
const { white, neutral900, sidebarLight, sidebarDark, rowLight, rowDark, groupedDark, controlLight, controlDark, controlHoverLight, controlHoverDark } = SURFACES;

/** Every pair of spec 8.3, measured on what tokens.css draws: a null shade is NEO's. */
function pairs(a: Accent): Record<string, [number, number]> {
    const fill = a.fill ? rgb(a.fill) : NEO.fill;
    const hover = a.fillHover ? rgb(a.fillHover) : NEO.fillHover;
    const textLight = a.textLight ? rgb(a.textLight) : NEO.textLight;
    const textDark = a.textDark ? rgb(a.textDark) : NEO.textDark;
    const iconLight = a.iconLight ? rgb(a.iconLight) : NEO.iconLight;
    const iconDark = a.iconDark ? rgb(a.iconDark) : NEO.iconDark;
    const switchDark = a.switchDark ? rgb(a.switchDark) : NEO.switchDark;
    const selectedLight = over(fill, 0.12, white);
    const selectedDark = over(iconDark, 0.18, neutral900);
    return {
        'white on fill': [contrast(white, fill), 4.5],
        'white on fill hover': [contrast(white, hover), 4.5],
        'fill vs light raised': [contrast(fill, white), 3],
        'fill vs dark raised': [contrast(fill, neutral900), 3],
        'light bar vs its tint': [contrast(fill, selectedLight), 3],
        'light text on content': [contrast(textLight, white), 4.5],
        'light text on the selection': [contrast(textLight, selectedLight), 4.5],
        'light text on the control fill': [contrast(textLight, controlLight), 4.5],
        'light text on the hovered control fill': [contrast(textLight, controlHoverLight), 4.5],
        'dark text on content': [contrast(textDark, neutral900), 4.5],
        'dark text on the selection': [contrast(textDark, selectedDark), 4.5],
        'dark text on the control fill': [contrast(textDark, controlDark), 4.5],
        'dark text on the hovered control fill': [contrast(textDark, controlHoverDark), 4.5],
        'light icon on the sidebar': [contrast(iconLight, sidebarLight), 3],
        'light icon on the grey row': [contrast(iconLight, rowLight), 3],
        'dark icon on content': [contrast(iconDark, neutral900), 3],
        'dark icon on the sidebar': [contrast(iconDark, sidebarDark), 3],
        'dark icon on the grey row': [contrast(iconDark, rowDark), 3],
        'dark bar vs its tint': [contrast(iconDark, selectedDark), 3],
        'dark switch vs the grouped box': [contrast(switchDark, groupedDark), 3],
        'white thumb on the dark switch': [contrast(white, switchDark), 3],
    };
}

describe('contrast', () => {
    it('measures as the spec does', () => {
        // spec 1.3: white on accent-600 5.17, accent-700 on white 6.70
        expect(contrast(white, NEO.fill)).toBeCloseTo(5.17, 2);
        expect(contrast(NEO.textLight, white)).toBeCloseTo(6.7, 1);
        // spec 1.4: accent-400 on the dark grey row 3.41, accent-600 on the light one 3.13
        expect(contrast(NEO.iconDark, rowDark)).toBeCloseTo(3.41, 1);
        expect(contrast(NEO.iconLight, rowLight)).toBeCloseTo(3.13, 1);
        expect(contrast(NEO.switchDark, groupedDark)).toBeCloseTo(4.13, 1);
    });

    it('converts through OKLCH and back', () => {
        for (const hex of ['#2563eb', '#0f766e', '#eab308', '#e11d48']) expect(toHex(fromOklch(toOklch(rgb(hex))))).toBe(hex);
    });
});

describe('deriveAccent', () => {
    const COLOURS = ['#3B82F6', '#EAB308', '#22C55E', '#0F766E', '#E11D48', '#7C3AED', '#283C50', '#299ECC'];

    it.each(COLOURS)('%s: every pair passes', (hex) => {
        const accent = deriveAccent(hex);
        expect(accent).not.toBeNull();
        const failing = Object.entries(pairs(accent!)).filter(([, [ratio, needs]]) => ratio < needs);
        expect(failing).toEqual([]);
    });

    it('NEO\'s own blue is NEO\'s palette, whether the site sets it or not', () => {
        // null: tokens.css draws accent-600/700/300/400/500 exactly, as for a site with no colour
        expect(deriveAccent('#2563EB')).toBeNull();
        expect(deriveAccent('#2563eb')).toBeNull();
        expect(pairs({ fill: null, fillHover: null, textLight: null, textDark: null, iconLight: null, iconDark: null, switchDark: null })['dark text on content']![0]).toBeCloseTo(9.82, 1);
    });

    // the dark shades start from NEO's lightness for their role, not the site's: no pair sits on its threshold
    it.each(COLOURS)('%s: the dark pairs and the sidebar pairs keep a margin', (hex) => {
        const all = pairs(deriveAccent(hex)!);
        const tight = Object.entries(all).filter(([name, [ratio, needs]]) => (/^dark |sidebar|grey row/.test(name) ? ratio < needs + MATERIAL_MARGIN : false));
        expect(tight).toEqual([]);
    });

    it('a dark-theme shade is about as light as NEO\'s for the same role', () => {
        for (const hex of COLOURS) {
            const a = deriveAccent(hex)!;
            expect(Math.abs(toOklch(rgb(a.textDark!)).l - toOklch(NEO.textDark).l)).toBeLessThan(0.08);
            expect(Math.abs(toOklch(rgb(a.iconDark!)).l - toOklch(NEO.iconDark).l)).toBeLessThan(0.08);
        }
        // the teal seed: its dark text and links are light, not the darkest that passes (#4ca49b before)
        expect(contrast(rgb(deriveAccent('#0F766E')!.textDark!), neutral900)).toBeGreaterThan(9);
    });

    it('keeps the hue', () => {
        const base = toOklch(rgb('#0F766E'));
        const accent = deriveAccent('#0F766E')!;
        for (const shade of Object.values(accent)) {
            if (!shade) continue;
            const { h, c } = toOklch(rgb(shade));
            if (c > 0.03) expect(Math.abs(h - base.h)).toBeLessThan(0.12);
        }
    });

    it('keeps a colour that passes as it is', () => {
        expect(deriveAccent('#0F766E')!.fill).toBe('#0f766e');
        expect(deriveAccent('#E11D48')!.fill).toBe('#e11d48');
        expect(deriveAccent('#7C3AED')!.fill).toBe('#7c3aed');
    });

    it('moves a light colour until white text reads on it', () => {
        const yellow = deriveAccent('#EAB308')!;
        expect(contrast(white, rgb(yellow.fill!))).toBeGreaterThanOrEqual(4.5);
        // and a dark one up for the dark theme's icons
        const teal = deriveAccent('#0F766E')!;
        expect(toOklch(rgb(teal.iconDark!)).l).toBeGreaterThan(toOklch(rgb('#0F766E')).l);
    });

    it.each(['#A3A3A3', '#FFFFFF', '#000000', null, undefined, '', 'teal', '#abc'])('%s keeps NEO blue', (value) => {
        expect(deriveAccent(value)).toBeNull();
    });
});

describe('applyAccent', () => {
    it('writes the shades on <html> and takes them off again', () => {
        const root = document.createElement('div');
        applyAccent(deriveAccent('#0F766E'), root);
        expect(root.style.getPropertyValue('--site-fill')).toBe('#0f766e');
        expect(root.style.getPropertyValue('--site-icon-dark')).toMatch(/^#[0-9a-f]{6}$/);
        applyAccent(null, root);
        expect(root.style.getPropertyValue('--site-fill')).toBe('');
        expect(root.getAttribute('style') ?? '').toBe('');
    });
});
