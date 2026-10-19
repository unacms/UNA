/**
 * Per-tier classes for a block's background (block config `designbox.bg` and
 * `designbox.solid`, see block-wrapper.js). No app imports, so
 * `node --test packages/app/lib/block-bg-classes.test.ts` runs it from the NEO root.
 */

export type BgTier = 'mobile' | 'tablet' | 'desktop';

const TIERS: readonly BgTier[] = ['mobile', 'tablet', 'desktop'];
const PREFIX: Record<BgTier, string> = { mobile: '', tablet: 'sm:', desktop: 'lg:' };

const tokens = (value: string) => String(value || '').trim().split(/\s+/).filter(Boolean);
const inTiers = (tiers: boolean | BgTier[], tier: BgTier) => tiers === true || (Array.isArray(tiers) && tiers.includes(tier));

/**
 * `bg`: tiers with the background; `solid`: tiers where it uses `solidFill` (the opaque
 * card colour) in place of `on`'s first bg- utility. `off` is used where `bg` is off.
 * A tier adds classes only where its value differs from the tier below.
 */
export function buildBlockBgClasses(
    bg: boolean | BgTier[],
    solid: boolean | BgTier[],
    { on, solidFill, off }: { on: string; solidFill: string; off: string },
): string {
    if (!bg) return '';

    let swapped = false;
    const onSolid = tokens(on).map((token) => {
        if (swapped || !token.startsWith('bg-')) return token;
        swapped = true;
        return solidFill;
    }).join(' ');

    const classes: string[] = [];
    let previous: string | null = null;
    for (const tier of TIERS) {
        let value = off;
        if (inTiers(bg, tier)) value = inTiers(solid, tier) ? onSolid : tokens(on).join(' ');
        if (value !== previous) {
            classes.push(...tokens(value).map((token) => PREFIX[tier] + token));
            previous = value;
        }
    }

    return classes.join(' ');
}
