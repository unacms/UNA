import { LUCIDE_ASSET_ALIASES } from 'app/lib/platform/lucide-assets';

const pascal = (kebab: string) => kebab.replace(/(^|-)([a-z0-9])/g, (_, _dash: string, c: string) => c.toUpperCase());

/**
 * The registry key an icon name draws under: the name itself, else the icon a Lucide alias stands for (UNA sends
 * `Home` for the site menu's home item; the registry knows it as `House`). Renamed icons are already current here
 * (`Icon` applies `currentLucideName` first).
 */
export function animatedIconKey(registry: Record<string, unknown> | undefined, name: string): string | null {
    if (!registry) return null;
    if (registry[name]) return name;
    const kebab = LUCIDE_ASSET_ALIASES[name];
    const target = kebab ? pascal(kebab) : null;
    return target && registry[target] ? target : null;
}
