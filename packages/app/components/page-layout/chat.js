import { Platform } from 'react-native'
import { BlockDataByName, BlockDataByType } from 'app/lib/util'
import Messenger from 'app/components/elements/messenger';
import AgentsSplit from 'app/ui/molecules/ai-agent/agents-split';
import { View } from 'app/design/view';
import Cell from 'app/components/cell';
import Page from 'app/ui/molecules/page/page'
import { useIsDesktop } from 'app/context/measure'
import { usePageContentHeight } from 'app/components/elements/chat/parts/chat-panels'

const isWeb = Platform.OS === 'web'

/**
 * `chat` layout (`messenger` is an alias): full-height list | conversation split
 * for the messenger and the agents page.
 */
export default function PageLayout({ data, pageClasses }) {
    const { width, contentWidth, padding, gap } = pageClasses ?? {}
    const isDesktop = useIsDesktop()
    const pageHeight = usePageContentHeight()
    const block = BlockDataByName(data, 'bx_messenger:get_main_messenger_page')
    const agentsBlock = block ? null : BlockDataByType(data, 'ai_agents_admin')
    const agentsData = agentsBlock?.content?.find((item) => item?.type === 'ai_agents_admin')?.data

    const chat = block?.content[0]?.data ? (
        <Messenger
            pageData={data}
            block={block}
            data={block.content[0].data}
            url={data.url}
        />
    ) : agentsData ? (
        <AgentsSplit data={agentsData} />
    ) : null

    if (chat) {
        // Native keeps the injected list ↔ chat headers and stays full-bleed under
        // the page header. Web always uses Page so resizing desktop ↔ mobile does
        // not remount the chat (and drop its state); desktop fills the window
        // under the header.
        if (!isWeb) {
            return chat
        }

        return (
            <Page data={data} processKeyboard={false}>
                <View className={`${width} w-full min-h-0`} style={isDesktop ? { height: pageHeight } : undefined}>
                    <View className={`${contentWidth} ${isDesktop ? padding : ''} ${gap} mx-auto w-full ${isDesktop ? 'h-full min-h-0' : ''}`}>
                        {chat}
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
