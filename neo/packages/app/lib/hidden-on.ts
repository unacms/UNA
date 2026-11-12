/**
 * Studio's per-screen-size switches as the apps get them: a block's or a menu item's "Hidden on"
 * (`hidden_on`) and a block's "Title / Background / Padding hidden on" (`title_hidden_on`, ...) list
 * phone, tablet, desktop and mobile-app. No app imports, so `node --test packages/app/lib/hidden-on.test.ts` runs it
 * from the NEO root.
 */

type Tier = 'mobile' | 'tablet' | 'desktop';

const TIERS: Tier[] = ['mobile', 'tablet', 'desktop'];
const TIER_OF: Record<string, Tier> = { phone: 'mobile', tablet: 'tablet', desktop: 'desktop' };

/**
 * Whether a `hidden_on` list hides its item on screen size `tier` (`phone`, `tablet`, `desktop`). The apps
 * (`isApp`) also hide what is hidden on the mobile app (`mobile-app`), whatever the screen size.
 */
export function isHiddenOn(hiddenOn: unknown, tier: string, isApp: boolean): boolean {
    if (!Array.isArray(hiddenOn)) return false;
    return hiddenOn.includes(tier) || (isApp && hiddenOn.includes('mobile-app'));
}

/**
 * `shown` (true, false or the tiers it shows on, as normalizeTiers gives) without the screen sizes
 * in `hiddenOn`. The apps (`isApp`) drop it altogether where it is hidden on the mobile app.
 */
export function withoutHiddenOn(shown: boolean | Tier[], hiddenOn: unknown, isApp: boolean): boolean | Tier[] {
    if (!Array.isArray(hiddenOn) || !hiddenOn.length || shown === false) return shown;
    if (isApp && hiddenOn.includes('mobile-app')) return false;

    const tiers: Tier[] = shown === true ? [...TIERS] : shown;
    const left = tiers.filter((tier) => !hiddenOn.some((name) => TIER_OF[name] === tier));
    if (left.length === TIERS.length) return true;
    return left.length ? left : false;
}
