import { appSetting } from 'app/lib/util';
import { buildBlockBgClasses } from 'app/lib/block-bg-classes';

/**
 * Build responsive class strings from theme utilities + breakpoint tiers.
 *
 * Prefixed class literals must stay listed in `@source inline(...)` in
 * `packages/app/design/styles/utilities.css` (Tailwind/Uniwind scanner).
 */

type Tier = 'mobile' | 'tablet' | 'desktop';

const TIER_PREFIX: Record<Tier, string> = { mobile: '', tablet: 'sm', desktop: 'lg' };
const TIER_ORDER = ['mobile', 'tablet', 'desktop'] as const;

/**
 * Responsive class preset: `on`/`off` utilities per tier, and a default for unset tiers.
 * `multi` presets keep every utility of `on`/`off` (e.g. fill + shadow + its dark variant);
 * the others use the first one, or its breakpoint steps (`onUtilByTier`).
 */
type ResponsivePreset = { on: any; default?: any; off?: any; multi?: boolean };

const PRESETS: Record<string, ResponsivePreset> = {
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
    // Block chrome per tier (block config `designbox`, see page-block.js / block-wrapper.js).
    bg: {
        on: () => appSetting('theme', 'blocks', 'u-block-bg'),
        default: () => '',
        off: 'bg-transparent shadow-none dark:shadow-none',
        multi: true,
    },
    'block-pad-y': {
        on: () => appSetting('theme', 'blocks', 'u-block-pad-y'),
        default: () => '',
        off: 'py-0',
    },
    'block-pad-x': {
        on: () => appSetting('theme', 'blocks', 'u-block-pad-x'),
        default: () => '',
        off: 'px-0',
    },
    title: {
        on: () => 'flex',
        default: () => '',
        off: 'hidden',
    },
    // Space around a list card (default/functions.js `paddingForList`), where it shows.
    'card-my': {
        on: () => 'my-4',
        default: () => '',
        off: 'my-0',
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
function baseUtil(token: string) {
    if (!token) return '';
    const part = String(token).trim().split(/\s+/).filter(Boolean)[0] ?? '';
    return part.replace(/^(?:sm:|md:|lg:|xl:|2xl:)+/, '');
}

function withPrefix(prefix: string, utility: string) {
    if (!utility) return '';
    return prefix ? `${prefix}:${utility}` : utility;
}

function parseTiers(value: any) {
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

/**
 * The `on` utility for each tier. A setting may carry its own breakpoint steps
 * (`py-4 sm:py-5`): a tier takes the step at or below it, so `py-4 sm:py-5`
 * is `py-4` on mobile and `py-5` on tablet and desktop.
 */
function onUtilByTier(on: string): Record<Tier, string> {
    const tokens = String(on || '').trim().split(/\s+/).filter(Boolean);
    const step = (prefix: string) => tokens.find((token) => token.startsWith(prefix + ':'))?.slice(prefix.length + 1);
    const mobile = tokens.find((token) => !/^(?:sm|md|lg|xl|2xl):/.test(token)) ?? baseUtil(on);
    const tablet = step(TIER_PREFIX.tablet) ?? mobile;
    const desktop = step(TIER_PREFIX.desktop) ?? tablet;
    return { mobile, tablet, desktop };
}

function buildResponsiveClasses(tiers: any, on: string, { off = 'rounded-none', default: defaultClass = '' }: { off?: string; default?: string } = {}) {
    const parsedTiers = parseTiers(tiers);

    if (parsedTiers === null) {
        return typeof defaultClass === 'string' ? defaultClass.trim() : '';
    }

    if (parsedTiers.length === 0) {
        return '';
    }

    const onUtil = onUtilByTier(on);
    const offUtil = baseUtil(off);

    if (!onUtil.mobile || !offUtil) {
        return typeof defaultClass === 'string' ? defaultClass.trim() : '';
    }

    const normalizedTiers = parsedTiers.map((tier) => tier.toLowerCase().trim());
    if (!TIER_ORDER.some((bp) => normalizedTiers.includes(bp))) {
        return '';
    }

    // One utility per tier, written only where it differs from the tier below
    // (mobile is always written, unprefixed).
    const classes: string[] = [];
    let previous = '';
    for (const tier of TIER_ORDER) {
        const util = normalizedTiers.includes(tier) ? onUtil[tier] : offUtil;
        if (util !== previous) classes.push(withPrefix(TIER_PREFIX[tier], util));
        previous = util;
    }

    return classes.join(' ');
}

/** All utilities of `on` / `off` per tier; a tier only adds classes where it flips the tier below. */
function buildResponsiveTokenSets(tiers: any, on: string, off: string, defaultClass = '') {
    const parsedTiers = parseTiers(tiers);

    if (parsedTiers === null) {
        return typeof defaultClass === 'string' ? defaultClass.trim() : '';
    }

    const listed = parsedTiers.map((tier) => tier.toLowerCase().trim());
    const tokens = (value: string) => String(value || '').trim().split(/\s+/).filter(Boolean);
    const classes: string[] = [];
    let previous: boolean | null = null;

    for (const tier of TIER_ORDER) {
        const isOn = listed.includes(tier);
        if (isOn !== previous) {
            classes.push(...tokens(isOn ? on : off).map((token) => withPrefix(TIER_PREFIX[tier], token)));
            previous = isOn;
        }
    }

    return classes.join(' ');
}

/**
 * @param {ResponsivePresetKey} presetKey
 * @param {ResponsiveTiers} [tiers]
 * @returns {string}
 */
export function responsiveClasses(presetKey: string, tiers: any) {
    const preset = PRESETS[presetKey];
    if (!preset) return '';

    const defaultClass = preset.default ? preset.default() : '';
    if (preset.multi) {
        return buildResponsiveTokenSets(tiers, preset.on(), preset.off, defaultClass);
    }

    return buildResponsiveClasses(tiers, preset.on(), {
        off: preset.off,
        default: defaultClass,
    });
}

/**
 * A tiers value as `true` (every tier), `false` (none) or the tiers it lists, in
 * tier order. Booleans pass through, so a prop can take either (e.g. UNA's
 * designbox on/off, or per-breakpoint tiers from block config).
 */
export function normalizeTiers(value: any): boolean | Tier[] {
    if (typeof value === 'boolean') return value;

    const parsedTiers = parseTiers(value);
    if (!parsedTiers) return false;

    const listed = parsedTiers.map((tier) => tier.toLowerCase().trim());
    const tiers = TIER_ORDER.filter((tier) => listed.includes(tier));
    if (tiers.length === TIER_ORDER.length) return true;

    return tiers.length ? tiers : false;
}

/**
 * A block's background (theme `u-block-bg`) on the tiers in `bg`, with the opaque card fill
 * (`u-block-bg-solid`) instead of the translucent one on the tiers in `solid`: block config
 * `designbox.solid`, for a block that sits among solid cards, like the feed's on phones.
 */
export function blockBgClasses(bg: any, solid?: any) {
    return buildBlockBgClasses(normalizeTiers(bg), normalizeTiers(solid), {
        on: appSetting('theme', 'blocks', 'u-block-bg') || '',
        solidFill: appSetting('theme', 'blocks', 'u-block-bg-solid') || 'bg-card',
        off: PRESETS.bg?.off || '',
    });
}

/**
 * Register a responsive preset. Add matching literals to `@source inline(...)` in utilities.css.
 */
/** Add a preset usable as `responsiveClasses(key, tiers)` (forks can register their own). */
export function registerResponsivePreset(key: string, { on, default: defaultFn, off, multi }: ResponsivePreset) {
    PRESETS[key] = { on, default: defaultFn, off, multi };
}
