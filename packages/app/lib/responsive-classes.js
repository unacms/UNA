import { appSetting } from 'app/lib/util';

/**
 * Build responsive class strings from theme utilities + breakpoint tiers.
 *
 * Prefixed class literals must stay listed in `@source inline(...)` in
 * `packages/app/design/styles/utilities.css` (Tailwind/Uniwind scanner).
 */

const TIER_PREFIX = { mobile: '', tablet: 'sm', desktop: 'lg' };
const TIER_ORDER = /** @type {const} */ (['mobile', 'tablet', 'desktop']);

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
        on: () => appSetting('theme', 'blocks', 'u-block-rounded'),
        default: () => appSetting('theme', 'blocks', 'u-block-rounded-default'),
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

/** Strip breakpoint prefixes; keep the base utility token. */
function baseUtil(token) {
    if (!token) return '';
    const part = String(token).trim().split(/\s+/).filter(Boolean)[0] ?? '';
    return part.replace(/^(?:sm:|md:|lg:|xl:|2xl:)+/, '');
}

function withPrefix(prefix, utility) {
    if (!utility) return '';
    return prefix ? `${prefix}:${utility}` : utility;
}

function parseTiers(value) {
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
}

function isContiguous(selected) {
    if (selected.length <= 1) return true;
    const idx = selected.map((bp) => TIER_ORDER.indexOf(bp));
    return idx.every((v, i) => i === 0 || v === idx[i - 1] + 1);
}

function buildResponsiveClasses(tiers, on, { off = 'rounded-none', default: defaultClass = '' } = {}) {
    const parsedTiers = parseTiers(tiers);

    if (parsedTiers === null) {
        return typeof defaultClass === 'string' ? defaultClass.trim() : '';
    }

    if (parsedTiers.length === 0) {
        return '';
    }

    const onUtil = baseUtil(on);
    const offUtil = baseUtil(off);

    if (!onUtil || !offUtil) {
        return typeof defaultClass === 'string' ? defaultClass.trim() : '';
    }

    const normalizedTiers = parsedTiers.map((tier) => tier.toLowerCase().trim());
    const selected = TIER_ORDER.filter((bp) => normalizedTiers.includes(bp));

    if (!selected.length) {
        return '';
    }

    const pick = (tier) =>
        withPrefix(TIER_PREFIX[tier], normalizedTiers.includes(tier) ? onUtil : offUtil);

    if (!isContiguous(selected)) {
        return TIER_ORDER.map(pick).filter(Boolean).join(' ');
    }

    const start = selected[0];
    const end = selected[selected.length - 1];

    // All tiers on → bare utility (no breakpoint prefixes).
    if (start === 'mobile' && end === 'desktop') {
        return onUtil;
    }

    const classes = [withPrefix('', start === 'mobile' ? onUtil : offUtil)];

    if (start === 'tablet' || (start === 'mobile' && end !== 'mobile')) {
        classes.push(withPrefix('sm', onUtil));
    } else {
        classes.push(withPrefix('sm', offUtil));
    }

    classes.push(withPrefix('lg', end === 'desktop' ? onUtil : offUtil));

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
