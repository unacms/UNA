import { useCallback, useState } from 'react'
import { BlockWrapper } from 'app/components/block-wrapper'
import { BlockByDataInt as BlockByData } from 'app/components/block'
import { Modal, NeoButton } from 'app/design/controls'
import { View } from 'app/design/view'
import { Text } from 'app/design/typography'
import { fetcher } from 'app/lib/fetcher'
import emitter from 'app/context/emitter'

function reloadWikiPage() {
    emitter.emit('wiki', { action: 'reload' })
}

async function openWikiActionForm(requestUrl, title, setFormBlock) {
    if (!requestUrl) return

    const response = await fetcher('/api.php?r=' + requestUrl)
    setFormBlock({
        content: response?.data,
        designbox_id: 0,
        title: title || ' ',
    })
}

/** Add Block: UNA creates the block immediately — just call + reload, no form modal. */
async function runWikiAddBlock(requestUrl) {
    if (!requestUrl) return
    await fetcher('/api.php?r=' + requestUrl)
    reloadWikiPage()
}

/**
 * UNA wiki CTA: Add Block (callback + reload) / Add Page (form modal).
 */
export default function ElementWikiAction({ data, type, blockWrapperProps, onFormEmpty }) {
    const [formBlock, setFormBlock] = useState(null)
    const title = data?.title || (type === 'wiki_add_page' ? 'Add Page' : 'Add Block')
    const text = data?.text
    const requestUrl = data?.request_url
    const isPage = type === 'wiki_add_page'

    const handleClose = useCallback(() => {
        setFormBlock(null)
    }, [])

    const handleFormEmpty = useCallback(() => {
        setFormBlock(null)
        onFormEmpty?.()
        reloadWikiPage()
    }, [onFormEmpty])

    const handlePress = useCallback(() => {
        if (isPage) {
            void openWikiActionForm(requestUrl, title, setFormBlock)
            return
        }
        void runWikiAddBlock(requestUrl)
    }, [isPage, requestUrl, title])

    if (!requestUrl) return null

    return (
        <BlockWrapper {...blockWrapperProps}>
            {formBlock ? (
                <Modal
                    title={formBlock.title || title}
                    onVisible={!!formBlock}
                    onClose={handleClose}
                    scrollable
                    transparent
                >
                    <View className="px-3 sm:px-4">
                        <BlockByData
                            block={formBlock}
                            onFormEmpty={handleFormEmpty}
                            exProps={{
                                onClose: handleClose,
                                resetOnSubmit: true,
                                formOnly: true,
                            }}
                        />
                    </View>
                </Modal>
            ) : null}

            <View className={isPage ? 'items-center gap-4 py-8 sm:py-12' : 'w-full py-2'}>
                {text ? (
                    <Text className="text-center text-base leading-6 text-muted-foreground max-w-md">
                        {text}
                    </Text>
                ) : null}
                <NeoButton
                    label={title}
                    image={isPage ? 'FilePlus' : 'Plus'}
                    style={isPage ? 'borderedProminent' : 'borderless'}
                    borderShape="roundedRectangle"
                    controlSize="regular"
                    width={isPage ? 'auto' : 'fill'}
                    className={isPage ? undefined : 'border border-dashed border-border'}
                    onPress={handlePress}
                />
            </View>
        </BlockWrapper>
    )
}
