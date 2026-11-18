import { useEffect } from 'react';
import { appSetting } from 'app/lib/util';
import { resolvePageWidth } from 'app/lib/header-layout';

// The width the previous page had: a page whose data has none yet keeps it instead of jumping to the theme's. In the
// browser only: on the server it would carry one visitor's width into another's page.
const isBrowser = typeof window !== 'undefined';
let __lastPageWidth = null;

/**
 * The page's width on :root as --neo-page-width, which `max-w-8xl` reads (design/styles/global.css): UNA's for the
 * page's layout and audience (`page_width`), unless `layout.page_width` sets one. A <style> so the server's HTML has
 * it and the first paint is at the right width. resolvePageWidth lets only pixels, `none` and plain lengths through.
 *
 * @param {{ data?: any }} props
 */
export default function PageWidthStyle({ data }) {
    const width = resolvePageWidth(data?.page_width, appSetting('layout', 'page_width'), isBrowser ? __lastPageWidth : null);
    const hasOwn = data?.page_width !== undefined;
    useEffect(() => {
        if (hasOwn && width) __lastPageWidth = width;
    }, [hasOwn, width]);
    if (!width) return null;

    return <style dangerouslySetInnerHTML={{ __html: `:root{--neo-page-width:${width}}` }} />;
}
