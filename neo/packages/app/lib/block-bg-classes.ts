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

/**
 * `bg`: tiers with the background (`on`); `off` is used where it is off. A tier adds
 * classes only where its value differs from the tier below.
 */
export function buildBlockBgClasses(
    bg: boolean | BgTier[],
    { on, off }: { on: string; off: string },
): string {
    if (!bg) return '';

    const classes: string[] = [];
    let previous: string | null = null;
    for (const tier of TIERS) {
        const value = inTiers(bg, tier) ? tokens(on).join(' ') : off;
        if (value !== previous) {
            classes.push(...tokens(value).map((token) => PREFIX[tier] + token));
            previous = value;
        }
    }

    return classes.join(' ');
}
