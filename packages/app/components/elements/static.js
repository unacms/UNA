import { appStatic } from 'app/lib/app-static'
import { BlockWrapper } from 'app/components/block-wrapper'

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
