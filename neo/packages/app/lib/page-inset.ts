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

/** The utility a token sets on `tier` (`sm:px-4` → `px-4` on tablet), or null for another tier or variant. */
function utilityForTier(token: string, tier: InsetTier): string | null {
    const prefix = PREFIX[tier];
    if (prefix && !token.startsWith(prefix)) return null;
    const rest = token.slice(prefix.length);
    return VARIANT.test(rest) ? null : rest;
}

/** Whether the tokens turn side padding on (true), off (false) or leave it (null) on `tier`. */
function sidePaddingOn(tokens: string[], tier: InsetTier): boolean | null {
    let padded: boolean | null = null;
    for (const token of tokens) {
        const utility = utilityForTier(token, tier);
        const match = utility === null ? null : SIDE_PADDING.exec(utility);
        if (match) padded = match[1] !== '0';
    }
    return padded;
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
        padded = sidePaddingOn(tokens, tier) ?? padded;
        if (padded) on.push(tier);
    }

    return asTiers(on);
}
