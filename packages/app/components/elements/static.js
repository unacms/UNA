import { appStatic } from 'app/lib/app-static'
import { BlockWrapper } from 'app/components/block-wrapper'

/**
 * `static` element: a UNA block content item of type `static` with `data.element: '<name>'`
 * renders the frontend static component `components_<name>` in the regular block wrapper.
 * UNA decides where it goes on the page; the content lives in the static registry (see
 * appStatic in lib/app-static.tsx).
 */
export default function ElementStatic({ data, blockWrapperProps }) {
    const element = data?.element
    if (!element) return null

    return (
        <BlockWrapper {...blockWrapperProps}>
            {appStatic('components_' + element)}
        </BlockWrapper>
    )
}

ElementStatic.checkEmpty = (item) => Boolean(item?.data?.element)
