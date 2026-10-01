import { staticComponents } from 'app/customization/static';

/**
 * Renders the static component registered as `section` (a component, or a ready element
 * returned as is); undefined when the registry has no such name.
 *
 * Registry: customization/static.js. Upstream it re-exports `staticDefault` from
 * default/static.js and must stay unedited (forks replace the whole file). Besides direct
 * calls (`components_footer`, `page_not_found`, ...), three page-override paths end here,
 * so frontend code can supply page content the UNA page doesn't define:
 * - `components_<uri>`: rendered above the UNA blocks of the page with that URI
 *   (components/page-layout/default.js). Frontend-only, UNA shows nothing about it.
 *   The neo-unacms fork builds its landing pages this way.
 * - `static:<name>` in a block list, e.g. a page's `blocks` setting (see getPageSettings)
 *   → `components_<name>` (staticBlockFor in components/block.tsx).
 * - A UNA block content item of type `static` with `data.element: '<name>'`
 *   → `components_<name>` (components/elements/static.js).
 */
export function appStatic(section: any, props: any) {
    const Component = (staticComponents as Record<string, any>)[section];
    if (Component && Component.$$typeof === Symbol.for('react.element'))
        return Component;
    if (Component)
        return <Component {...props}/>
}