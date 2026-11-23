import { Platform } from 'react-native';
import { View } from 'app/design/view';
import Image from 'app/ui/atoms/image';
import { isPageCoverHiddenOn } from 'app/lib/page-cover';
import { CoverArt } from './home-cover';

/**
 * A page's cover band as UNA sends it with the page (`cover_band`, BxBasePage::getPageCoverBandAPI) while the page's
 * cover is on for the viewer: the cover picture, else the template's art. UNA sends none for the home page (its own
 * cover, `cover_home`) or an entry's or a profile's page (their cover is `cover_block`).
 */
export type PageCoverBandData = {
    /** The page's cover picture, else the site's common cover from Studio > Designer > Cover; empty for none. */
    image?: string;
    /** The template's art the site shows when there is no picture, light and dark. */
    image_default?: { light?: string; dark?: string };
};

type PageCoverBandProps = {
    data?: { cover_band?: PageCoverBandData | null; cover_hidden_on?: unknown; page_status?: unknown } | null;
};

/**
 * The page's cover band at the top of the page, above its title and tabs, as on the site (cover.html): the picture or
 * the art, with nothing written on it. 176px high, full width, on desktop only: below it the page header holds the
 * title and the tabs, pinned at the top of the screen, and the native apps follow the phone. Its height is set before
 * the picture loads, and the breakpoint is CSS, so neither loading nor hydration moves the page.
 */
export function PageCoverBand({ data }: Readonly<PageCoverBandProps>) {
    const band = data?.cover_band;
    if (Platform.OS !== 'web' || !band || data?.page_status) return null;
    // Studio's "Cover hidden on: desktop" (the only size the band shows on).
    if (isPageCoverHiddenOn(data?.cover_hidden_on, 'desktop', false)) return null;

    const art = band.image ? null : band.image_default;
    return (
        <View aria-hidden className="page-cover-band hidden lg:flex relative h-44 w-full shrink-0 overflow-hidden bg-muted">
            {band.image ? (
                <Image src={band.image} alt="" view="cover" sizes="100vw" priority className="absolute inset-0 h-full w-full" />
            ) : (
                <CoverArt light={art?.light} dark={art?.dark} />
            )}
        </View>
    );
}
