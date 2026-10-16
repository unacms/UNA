/**
 * Smooth shadows for Tailwind CSS 3.
 *
 * A port of the `shadow-plugin` package by Florian Kiem (MIT, https://shadow.floriankiem.com),
 * whose published build targets Tailwind 4 only (`@theme` / `@utility`). Class names and shadow
 * values are identical, so switching to the npm package once UNA moves to Tailwind 4 needs no
 * template changes.
 *
 *  - `smooth-shadow-{xs|sm|md|lg|xl|2xl}` — stacked, eased shadow layers (`smooth-shadow` = md).
 *  - `smooth-shadow-ring-{size}` — the same stack with a 1px hairline ring baked in as the last
 *    layer, for elevated surfaces (blocks, cards, popups, menus). Never pair it with `border`/`ring`.
 *  - `shadow-{color}` tints the shadow, `smooth-ring-{color}` tints the ring; both compose.
 *  - The ring is black 5% in light mode and white 18% under `.dark` / `[data-theme="dark"]`.
 *  - `smooth-shadow-border` — a shadow in place of a border for surfaces that only need an edge (the
 *    header bar, page blocks): a 1px ring, a 1px lift and a 2px ambient layer in light mode, and a single
 *    white ring under `.dark`, where depth shadows don't show. Never pair it with `border`/`ring`.
 *  - `smooth-shadow-popover` — the same edge for floating surfaces (popups, dropdown menus), plus a
 *    soft drop shadow that lifts them off the page in both modes.
 */
const plugin = require('tailwindcss/plugin');
const flattenColorPalette = require('tailwindcss/lib/util/flattenColorPalette').default;

// [offset-y, blur, spread, alpha %]
const LAYERS = {
    xs: [[0, 4, 0, 4]],
    sm: [[18, 47, 0, 3], [7.5, 19, 0, 2], [4, 10.5, 0, 2], [2.3, 5.8, 0, 1], [1.2, 3.1, 0, 1], [0.5, 1.3, 0, 1]],
    md: [[17.54, 23.39, 0, 4], [9.4, 12.5, 0, 3], [5.25, 7, 0, 2], [2.79, 3.72, -2, 1], [1.16, 1.5, 0, 1]],
    lg: [[25, 50, 0, 5], [12, 24, 0, 4], [6, 12, 0, 3], [3, 6, 0, 2], [1.5, 3, 0, 2]],
    xl: [[40, 80, 0, 6], [20, 40, 0, 5], [10, 20, 0, 4], [5, 10, 0, 3], [2, 4, 0, 2]],
    '2xl': [[60, 120, 0, 7], [30, 60, 0, 6], [15, 30, 0, 5], [7.5, 15, 0, 4], [3, 6, 0, 3]],
};

const RING = '0 0 0 var(--smooth-ring-width, 1px) var(--smooth-ring-color)';

const BORDER_LIGHT = '0 0 0 1px oklch(0 0 0 / 0.06), 0 1px 2px -1px oklch(0 0 0 / 0.06), 0 2px 4px 0 oklch(0 0 0 / 0.04)';
const BORDER_DARK = '0 0 0 1px oklch(1 0 0 / 0.08)';
const POPOVER_LIGHT = '0 0 0 1px oklch(0 0 0 / 0.06), 0 4px 6px -2px oklch(0 0 0 / 0.05), 0 12px 24px -4px oklch(0 0 0 / 0.10)';
const POPOVER_DARK = '0 0 0 1px oklch(1 0 0 / 0.10), 0 12px 24px -4px oklch(0 0 0 / 0.50)';

function stack(size, withRing) {
    const layers = LAYERS[size].map(([y, blur, spread, alpha]) =>
        `0 ${y}px ${blur}px ${spread}px color-mix(in srgb, var(--smooth-shadow-color) ${alpha}%, transparent)`
    );

    if (withRing)
        layers.push(RING);

    return layers.join(', ');
}

module.exports = plugin(function ({ addBase, addUtilities, matchUtilities, theme }) {
    addBase({
        ':root': {
            '--smooth-ring-color': 'rgba(0, 0, 0, 0.05)',
            '--smooth-ring-width': '1px',
            '--smooth-shadow-border': BORDER_LIGHT,
            '--smooth-shadow-popover': POPOVER_LIGHT,
        },
        '.light, [data-theme="light"]': {
            '--smooth-ring-color': 'rgba(0, 0, 0, 0.05)',
            '--smooth-shadow-border': BORDER_LIGHT,
            '--smooth-shadow-popover': POPOVER_LIGHT,
        },
        '.dark, [data-theme="dark"]': {
            '--smooth-ring-color': 'rgba(255, 255, 255, 0.18)',
            '--smooth-shadow-border': BORDER_DARK,
            '--smooth-shadow-popover': POPOVER_DARK,
        },
    });

    const utilities = {
        '.smooth-shadow-none': { boxShadow: 'none' },
    };
    /**
     * Like Tailwind's own `shadow-*`, the stack is written to `--tw-shadow` and box-shadow is composed from
     * the ring variables, so `ring-*` utilities on the same element add to the shadow instead of replacing it.
     */
    const BOX_SHADOW = 'var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)';
    for (const size of Object.keys(LAYERS)) {
        for (const [name, withRing] of [[`smooth-shadow-${size}`, false], [`smooth-shadow-ring-${size}`, true]]) {
            const value = stack(size, withRing);
            utilities[`.${name}`] = {
                '--smooth-shadow-color': 'var(--tw-shadow-color, black)',
                '--tw-shadow': value,
                '--tw-shadow-colored': value,
                boxShadow: BOX_SHADOW,
            };
        }
    }
    utilities['.smooth-shadow'] = utilities['.smooth-shadow-md'];
    utilities['.smooth-shadow-ring'] = utilities['.smooth-shadow-ring-md'];
    utilities['.smooth-shadow-border'] = {
        '--tw-shadow': 'var(--smooth-shadow-border)',
        '--tw-shadow-colored': 'var(--smooth-shadow-border)',
        boxShadow: BOX_SHADOW,
    };
    utilities['.smooth-shadow-popover'] = {
        '--tw-shadow': 'var(--smooth-shadow-popover)',
        '--tw-shadow-colored': 'var(--smooth-shadow-popover)',
        boxShadow: BOX_SHADOW,
    };

    addUtilities(utilities);

    matchUtilities(
        { 'smooth-ring': (value) => ({ '--smooth-ring-color': value }) },
        { values: flattenColorPalette(theme('colors')), type: 'color' }
    );
});
