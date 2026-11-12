/**
 * Per-tier classes for a block's background (block config `designbox.bg`, see
 * block-wrapper.js). No app imports, so
 * `node --test packages/app/lib/block-bg-classes.test.ts` runs it from the NEO root.
 */

export type BgTier = 'mobile' | 'tablet' | 'desktop';

const TIERS: readonly BgTier[] = ['mobile', 'tablet', 'desktop'];
const PREFIX: Record<BgTier, string> = { mobile: '', tablet: 'sm:', desktop: 'lg:' };

const tokens = (value: string) => String(value || '').trim().split(/\s+/).filter(Boolean);
const inTiers = (tiers: boolean | BgTier[], tier: BgTier) => tiers === true || (Array.isArray(tiers) && tiers.includes(tier));

const isShadow = (token: string) => /^(?:dark:)?shadow-/.test(token);

/** `on` without its outline: the fill alone, and no shadow (light or dark). */
function flatOn(on: string): string {
    const fill = tokens(on).filter((token) => !isShadow(token));
    return [...fill, 'shadow-none', 'dark:shadow-none'].join(' ');
}

/**
 * The tiers a corner class rounds, read from its prefixes the way the breakpoints cascade:
 * an unprefixed class sets every tier, `sm:` tablet and up, `lg:` desktop, and `rounded-none`
 * makes its tiers square (`rounded-2xl sm:rounded-none` rounds only phones).
 */
export function roundedTiersFromClasses(value: string): BgTier[] {
    const set: Partial<Record<BgTier, boolean>> = {};
    for (const token of tokens(value)) {
        const match = /^(sm:|lg:)?rounded(?:-|$)/.exec(token);
        if (!match) continue;
        const tier = TIERS.find((t) => PREFIX[t] === (match[1] ?? '')) ?? 'mobile';
        set[tier] = !token.endsWith('rounded-none');
    }

    const tiers: BgTier[] = [];
    let rounded = false;
    for (const tier of TIERS) {
        rounded = set[tier] ?? rounded;
        if (rounded) tiers.push(tier);
    }
    return tiers;
}

/** The classes for one tier: off, the fill and outline, or (square corners) the fill alone. */
function tierValue(hasBg: boolean, square: boolean, { on, off }: { on: string; off: string }): string {
    if (!hasBg) return off;
    return square ? flatOn(on) : tokens(on).join(' ');
}

/**
 * `bg`: tiers with the background (`on`); `off` is used where it is off. A tier adds
 * classes only where its value differs from the tier below.
 *
 * `rounded`: the tiers where the block has rounded corners. Where it has a background
 * but square corners it meets the screen edge, so it gets the fill without the outline
 * shadow (an edge line in light mode, and a shadow over the header above it). Leave it
 * out to keep the outline wherever the background is.
 */
export function buildBlockBgClasses(
    bg: boolean | BgTier[],
    { on, off }: { on: string; off: string },
    rounded?: boolean | BgTier[],
): string {
    if (!bg) return '';

    const classes: string[] = [];
    let previous: string | null = null;
    for (const tier of TIERS) {
        const square = rounded !== undefined && !inTiers(rounded, tier);
        const value = tierValue(inTiers(bg, tier), square, { on, off });
        if (value !== previous) {
            classes.push(...tokens(value).map((token) => PREFIX[tier] + token));
            previous = value;
        }
    }

    return classes.join(' ');
}
