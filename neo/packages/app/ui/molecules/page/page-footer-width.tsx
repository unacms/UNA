import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { appSetting } from 'app/lib/util';
import { resolveFooterWidth, type FooterWidth } from 'app/lib/header-layout';

// The width the previous page's footer had: a page whose data has none yet keeps it. In the browser only: on the
// server it would carry one visitor's footer into another's page.
const isBrowser = typeof window !== 'undefined';
let __lastFooterWidth: FooterWidth | null = null;

const FooterWidthContext = createContext<FooterWidth | null>(null);

/**
 * The site footer's width for the pages inside: UNA's for the page's layout and audience (`footer` of the page JSON,
 * Studio > Designer > Settings), unless `layout.footer.width` sets one (lib/header-layout.ts). The page layout
 * (components/layouts.js) wraps the page in it, and PageFooter reads it.
 */
export function PageFooterWidth({ data, children }: Readonly<{ data?: { footer?: unknown } | null; children?: ReactNode }>) {
    const fromUna = data?.footer;
    const width = resolveFooterWidth(fromUna, appSetting('layout', 'footer', 'width'), isBrowser ? __lastFooterWidth : null);
    useEffect(() => {
        if (fromUna) __lastFooterWidth = width;
    }, [fromUna, width]);

    return <FooterWidthContext.Provider value={width}>{children}</FooterWidthContext.Provider>;
}

/** The footer's width where a page footer is drawn; outside a page, the last page's, else the default. */
export function usePageFooterWidth(): FooterWidth {
    const width = useContext(FooterWidthContext);
    return width ?? resolveFooterWidth(undefined, appSetting('layout', 'footer', 'width'), isBrowser ? __lastFooterWidth : null);
}
