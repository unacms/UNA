import { appSetting } from 'app/lib/util';

/**
 * Static prefixed utilities for Tailwind/Uniwind `@source` scanning.
 * Do not build these with string concatenation — the scanner needs full literals.
 */
const PREFIXED_UTIL = {
    'rounded-2xl': {
        '': 'rounded-2xl',
        sm: 'sm:rounded-2xl',
        lg: 'lg:rounded-2xl',
    },
    'rounded-none': {
        '': 'rounded-none',
        sm: 'sm:rounded-none',
        lg: 'lg:rounded-none',
    },
    'p-4': {
        '': 'p-4',
        sm: 'sm:p-4',
        lg: 'lg:p-4',
    },
    'p-0': {
        '': 'p-0',
        sm: 'sm:p-0',
        lg: 'lg:p-0',
    },
    'gap-4': {
        '': 'gap-4',
        sm: 'sm:gap-4',
        lg: 'lg:gap-4',
    },
    'gap-0': {
        '': 'gap-0',
        sm: 'sm:gap-0',
        lg: 'lg:gap-0',
    },
    'gap-y-4': {
        '': 'gap-y-4',
        sm: 'sm:gap-y-4',
        lg: 'lg:gap-y-4',
    },
    'gap-y-0': {
        '': 'gap-y-0',
        sm: 'sm:gap-y-0',
        lg: 'lg:gap-y-0',
    },
};

const TIER_PREFIX_KEY = { mobile: '', tablet: 'sm', desktop: 'lg' };

/** Contiguous tier-range presets (full class strings for scanner + runtime). */
const TIER_RANGE_PRESETS = {
    'mobile': 'rounded-2xl sm:rounded-none lg:rounded-none',
    'tablet': 'rounded-none sm:rounded-2xl lg:rounded-none',
    'desktop': 'rounded-none sm:rounded-none lg:rounded-2xl',
    'mobile,tablet': 'rounded-2xl sm:rounded-2xl lg:rounded-none',
    'mobile,tablet,desktop': 'rounded-2xl',
    'tablet,desktop': 'rounded-none sm:rounded-2xl lg:rounded-2xl',
};

const PRESETS = {
    padding: {
        on: () => appSetting('layout', 'page_content_padding'),
        default: () => appSetting('layout', 'page_content_padding_default'),
        off: 'p-0',
    },
    gap: {
        on: () => appSetting('layout', 'page_content_gap'),
        default: () => appSetting('layout', 'page_content_gap_default'),
        off: 'gap-0',
    },
    rounded: {
        on: () => appSetting('theme', 'blocks')?.['u-block-rounded'] ?? '',
        default: () => appSetting('theme', 'blocks')?.['u-block-rounded-default'] ?? '',
        off: 'rounded-none',
    },
};

/** @typedef {keyof typeof PRESETS} ResponsivePresetKey */
/** @typedef {'mobile' | 'tablet' | 'desktop'} ResponsiveTier */
/** @typedef {ResponsiveTier[] | ResponsiveTier | string | null | undefined | false | true} ResponsiveTiers */

/** @type {readonly ResponsivePresetKey[]} */
export const RESPONSIVE_PRESET_KEYS = Object.freeze(
    /** @type {ResponsivePresetKey[]} */ (Object.keys(PRESETS))
);

function prefixedUtil(prefixKey, utility) {
    return PREFIXED_UTIL[utility]?.[prefixKey] ?? '';
}

function tierRangeKey(selected) {
    return selected.join(',');
}

function buildResponsiveClasses(tiers, on, { off = 'rounded-none', default: defaultClass = '' } = {}) {
    const TIER_ORDER = ['mobile', 'tablet', 'desktop'];

    const normalizeOn = (token) => {
        if (!token) return '';
        return token
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .map((part) => part.replace(/^(?:sm:|md:|lg:|xl:|2xl:)+/, ''))
            .join(' ');
    };

    const isContiguous = (selected) => {
        if (selected.length <= 1) return true;
        const idx = selected.map((bp) => TIER_ORDER.indexOf(bp));
        return idx.every((v, i) => i === 0 || v === idx[i - 1] + 1);
    };

    const parseTiers = (value) => {
        if (value == null || value === false || value === '') {
            return null;
        }

        if (value === true) {
            return [...TIER_ORDER];
        }

        if (Array.isArray(value)) {
            return value.map(String);
        }

        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (!trimmed) return null;

            if (trimmed.startsWith('[')) {
                try {
                    const parsed = JSON.parse(trimmed);
                    if (Array.isArray(parsed)) {
                        return parsed.map(String);
                    }
                } catch {
                    // fall through
                }
            }

            return [trimmed];
        }

        return null;
    };

    const parsedTiers = parseTiers(tiers);

    if (parsedTiers === null) {
        return typeof defaultClass === 'string' ? defaultClass.trim() : '';
    }

    if (parsedTiers.length === 0) {
        return '';
    }

    const onUtil = normalizeOn(on);
    const offUtil = normalizeOn(off);

    if (!onUtil || !offUtil) {
        return typeof defaultClass === 'string' ? defaultClass.trim() : '';
    }

    const normalizedTiers = parsedTiers.map((tier) => tier.toLowerCase().trim());
    const selected = TIER_ORDER.filter((bp) => normalizedTiers.includes(bp));

    if (!selected.length) {
        return '';
    }

    if (onUtil === 'rounded-2xl' && offUtil === 'rounded-none') {
        if (!isContiguous(selected)) {
            return TIER_ORDER.map((bp) =>
                prefixedUtil(
                    TIER_PREFIX_KEY[bp],
                    normalizedTiers.includes(bp) ? onUtil : offUtil
                )
            )
                .filter(Boolean)
                .join(' ');
        }

        return TIER_RANGE_PRESETS[tierRangeKey(selected)] ?? '';
    }

    if (!isContiguous(selected)) {
        return TIER_ORDER.map((bp) =>
            prefixedUtil(
                TIER_PREFIX_KEY[bp],
                normalizedTiers.includes(bp) ? onUtil : offUtil
            )
        )
            .filter(Boolean)
            .join(' ');
    }

    const start = selected[0];
    const end = selected[selected.length - 1];

    if (start === 'mobile' && end === 'desktop') {
        return prefixedUtil('', onUtil);
    }

    const classes = [];

    classes.push(prefixedUtil('', start === 'mobile' ? onUtil : offUtil));

    if (start === 'tablet' || (start === 'mobile' && end !== 'mobile')) {
        classes.push(prefixedUtil('sm', onUtil));
    } else {
        classes.push(prefixedUtil('sm', offUtil));
    }

    classes.push(
        prefixedUtil('lg', end === 'desktop' ? onUtil : offUtil)
    );

    return classes.filter(Boolean).join(' ');
}

/**
 * @param {ResponsivePresetKey} presetKey
 * @param {ResponsiveTiers} [tiers]
 * @returns {string}
 */
export function responsiveClasses(presetKey, tiers) {
    const preset = PRESETS[presetKey];
    if (!preset) return '';

    return buildResponsiveClasses(tiers, preset.on(), {
        off: preset.off,
        default: preset.default(),
    });
}

/**
 * Register a responsive preset. Add matching literals to `@source inline(...)` in utilities.css.
 */
export function registerResponsivePreset(key, { on, default: defaultFn, off }) {
    PRESETS[key] = { on, default: defaultFn, off };
}

export function registerResponsiveUtilities(onUtil, offUtil, prefixedMap) {
    PREFIXED_UTIL[onUtil] = { ...PREFIXED_UTIL[onUtil], ...prefixedMap.on };
    PREFIXED_UTIL[offUtil] = { ...PREFIXED_UTIL[offUtil], ...prefixedMap.off };
}
