import dynamic from 'next/dynamic'
import { appStatic } from 'app/lib/app-static'
import { DynamicFallback } from 'app/lib/dynamic-fallback'
import { BlockWrapper } from 'app/components/block-wrapper'

// Core's own components for elements UNA names, each its own chunk. They are not in the static
// registry, so a project's `components_<name>` (customization/static.js) replaces one.
const CORE = {
    // The Sign up page's picture, heading and text (UNA's `system:create_account_intro`).
    page_intro: dynamic(() => import('app/ui/molecules/content/page-intro'), { loading: DynamicFallback }),
}

/**
 * `static` element: a UNA block content item of type `static` with `data.element: '<name>'`
 * renders the frontend static component `components_<name>` in the regular block wrapper.
 * UNA decides where it goes on the page; the content lives in the static registry (see
 * appStatic in lib/app-static.tsx), or in core for the elements UNA itself sends (`CORE`).
 * The component gets the item's `data`, for an element UNA sends content with.
 *
 * A name neither has draws nothing, so UNA can send a new element to apps built before it.
 */
export default function ElementStatic({ data, blockWrapperProps }) {
    const element = data?.element
    if (!element) return null

    const Core = Object.hasOwn(CORE, element) ? CORE[element] : null

    return (
        <BlockWrapper {...blockWrapperProps}>
            {appStatic('components_' + element, { data }) ?? (Core ? <Core data={data} /> : null)}
        </BlockWrapper>
    )
}

ElementStatic.checkEmpty = (item) => Boolean(item?.data?.element)
