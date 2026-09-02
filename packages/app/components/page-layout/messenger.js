import { Platform } from 'react-native'
import { BlockDataByName } from 'app/lib/util'
import Messenger from 'app/components/elements/messenger';
import { View } from 'app/design/view';
import Cell from 'app/components/cell';
import Page from 'app/ui/molecules/page/page'
import { useIsDesktop, useWindowHeight } from 'app/context/measure'
import { useHeaderHeight, useFooterHeight } from 'app/context/jotai/layout'

const isWeb = Platform.OS === 'web'

export default function PageLayout({ data, pageClasses }) {
    const { width, contentWidth, padding, gap } = pageClasses ?? {}
    const isDesktop = useIsDesktop()
    const headerHeight = useHeaderHeight()
    const footerHeight = useFooterHeight()
    const windowHeight = useWindowHeight()
    const pageHeight = windowHeight - headerHeight - footerHeight
    const block = BlockDataByName(data, 'bx_messenger:get_main_messenger_page')

    if (block?.content[0]?.data) {
        const messenger = (
            <Messenger
                pageData={data}
                block={block}
                data={block.content[0].data}
                url={data.url}
            />
        )

        // Native keeps the injected list ↔ chat headers and stays full-bleed
        // under the page header. Web always uses Page so resizing desktop ↔
        // mobile does not remount messenger (and drop inbox/direct state).
        if (!isWeb) {
            return messenger
        }

        return (
            <Page data={data} processKeyboard={false} resetHeaderOnFocus={false}>
                <View className={`${width} w-full min-h-0`} style={isDesktop ? { height: pageHeight } : undefined}>
                    <View className={`${contentWidth} ${isDesktop ? padding : ''} ${gap} mx-auto w-full ${isDesktop ? 'h-full min-h-0' : ''}`}>
                        {messenger}
                    </View>
                </View>
            </Page>
        )
    }

    const cells = Object.keys(data.elements).map((key) => (
        <Cell key={key} uri={data?.uri} url={data.url} blocks={data.elements[key]} />
    ))

    return (
        <Page data={data} processKeyboard={false}>
            <View className={`${width} ${contentWidth} ${padding} ${gap} mx-auto w-full`}>
                {cells}
            </View>
            <View className="flex-1" />
        </Page>
    )
}
