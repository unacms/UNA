/**
 * Screen sizes where a page's content padding keeps blocks off the screen edge. No app
 * imports, so `node --test packages/app/lib/page-inset.test.ts` runs it from the NEO root.
 */

export type InsetTier = 'mobile' | 'tablet' | 'desktop';

const TIERS: readonly InsetTier[] = ['mobile', 'tablet', 'desktop'];
const PREFIX: Record<InsetTier, string> = { mobile: '', tablet: 'sm:', desktop: 'lg:' };
const SIDE_PADDING = /^-?(?:p|px|ps|pe|pl|pr)-(.+)$/;
const VARIANT = /^[\w-]+:/;

/** `true` (every tier), `false` (none) or the tiers listed, in tier order. */
function asTiers(on: InsetTier[]): boolean | InsetTier[] {
    if (on.length === TIERS.length) return true;
    return on.length ? on : false;
}

/**
 * Tiers where `classes` pads the sides, e.g. `p-4` → true, `sm:px-4` → ['tablet', 'desktop'],
 * `px-4 lg:px-0` → ['mobile', 'tablet']. A tier keeps the value of the tier below it until a
 * class for that tier changes it; `p-0` / `px-0` turn it off. Other variants (`md:`, `dark:`)
 * are ignored.
 */
export function sidePaddingTiers(classes: string): boolean | InsetTier[] {
    const tokens = String(classes || '').trim().split(/\s+/).filter(Boolean);
    const on: InsetTier[] = [];
    let padded = false;

    for (const tier of TIERS) {
        const prefix = PREFIX[tier];
        for (const token of tokens) {
            const rest = prefix ? (token.startsWith(prefix) ? token.slice(prefix.length) : null) : token;
            if (rest === null || VARIANT.test(rest)) continue;
            const match = rest.match(SIDE_PADDING);
            if (match) padded = match[1] !== '0';
        }
        if (padded) on.push(tier);
    }

    return asTiers(on);
}
