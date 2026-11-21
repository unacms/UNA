/** The site's own mark and logo, light and dark, as UNA sends them with every page (`logo`, BxBaseApiV2System::logos). */
export type SiteLogo = {
    mark?: string | null;
    mark_dark?: string | null;
    logo?: string | null;
    logo_dark?: string | null;
    /** The logo's width over its height, where UNA knows it (an uploaded file). */
    logo_aspect?: number | null;
};

export type SiteLogoPick = { light: string; dark: string; aspect: number } | null;

/** UNA's own full logo is 67:20. */
export const LOGO_DEFAULT_ASPECT = 67 / 20;

/**
 * The image to draw for a mode: the mark for 'mark', the logo for 'full'. A site with a logo but no mark of its own
 * shows its logo for the mark too, never UNA's mark next to its own logo. null: draw UNA's artwork.
 */
export function pickSiteLogo(sources: SiteLogo | null | undefined, mode: 'full' | 'mark'): SiteLogoPick {
    if (!sources) return null;

    const logo = sources.logo || '';
    const mark = sources.mark || '';
    const useMark = mode === 'mark' && !!mark;
    const light = useMark ? mark : logo;
    if (!light) return null;

    const dark = (useMark ? sources.mark_dark : sources.logo_dark) || light;
    const aspect = useMark ? 1 : Number(sources.logo_aspect) > 0 ? Number(sources.logo_aspect) : LOGO_DEFAULT_ASPECT;

    return { light, dark, aspect };
}
