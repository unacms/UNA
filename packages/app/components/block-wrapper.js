import { View } from 'app/design/view'
import Html from 'app/ui/atoms/html'
import { stripTags, appSetting, isUrl } from 'app/lib/util';
import { useState } from 'react';
import { Block as PageBlock, BlockContent, BlockName, BlockActions, BlockHeader, BlockTitle } from 'app/ui/molecules/page-block'
import Link from 'app/ui/atoms/link'
import { useTranslation } from 'react-i18next'
import { Button, Modal } from 'app/design/controls'

export function BlockWrapper({ config, block, wrapperClassses, showTitle, showBg, fullWidth, contentOnly, list, showPadding, extraProps, children }) {
    const { t } = useTranslation()
    const [showHelp, setShowHelp] = useState(false)
    if (block?.designbox_id == null)
        return children;

    block.designbox_id = Number(block.designbox_id);
    const aNoTitle = [0, 10, 13, 3];
    const aNoBg = [0, 10, 14, 4];
    const aNoPad = [0, 4, 1, 5, 3];
    let bIsShowTitle = true;
    if (aNoTitle.indexOf(block.designbox_id) != -1) {
        bIsShowTitle = false;
    }

    let bIsShowBg = true;
    if (aNoBg.indexOf(block.designbox_id) != -1) {
        bIsShowBg = false;
    }

    let bIsShowPadding = true;
    if (aNoPad.indexOf(block.designbox_id) != -1) {
        bIsShowPadding = false;
    }

    if (typeof showBg !== 'undefined') {
        bIsShowBg = showBg;
    }
    if (typeof showTitle !== 'undefined') {
        bIsShowTitle = showTitle;
    }

    if (typeof showPadding !== 'undefined') {
        bIsShowPadding = showPadding;
    }

    const cssClasses = extraProps?.cssClasses || "";
    // Streamlined logic: avoid unnecessary fragment, ensure BlockContent is not wrapping elements twice

    const content_type = config?.content_type || block?.content?.[0]?.type
    if ((content_type == 'browse' || content_type == 'browse_list'))
        contentOnly = true;

    if (contentOnly){
        return (<View className={wrapperClassses}>
            {children}
        </View>)
    }
    const pureHelp = stripTags(block.help);
    if (pureHelp){
        bIsShowTitle = true;
    }

    const isHelpLink = isUrl(pureHelp)
    

    return (
        <View className={wrapperClassses || 'w-full'}>
            {(block.help && !isHelpLink) && <Modal title="Help" onVisible={!!showHelp} onClose={() => { setShowHelp(false) }} transparent={false}>
                <Html data={pureHelp} />
            </Modal>}
            <View className="@container/block w-full">
                <PageBlock
                    key={block.id}
                    isBg={bIsShowBg}
                    isPad={bIsShowPadding}
                    className={[
                        "w-full mx-auto",
                        (!fullWidth && !cssClasses.includes("max-w-") ? appSetting('layout', 'max_width_block') : ""),
                        cssClasses,
                    ].filter(Boolean).join(" ")}

                >
                    {bIsShowTitle && (
                        <BlockHeader>
                            <BlockName>
                                <BlockTitle>{stripTags(block.title)}</BlockTitle>
                            </BlockName>
                            {config?.header_more_url && (<BlockActions>
                                <Link
                                    href={config?.header_more_url}
                                    variant="ghost"
                                    size="sm"

                                >
                                    {t(config?.header_more_text || 'See all')}
                                </Link>
                            </BlockActions>)}
                            {(block.help && isHelpLink) && <Link href={pureHelp} target="_blank" ><Button title="Help" startDecorator='LifeBuoy' variant="text"/></Link>}
                            {(block.help && !isHelpLink) && <Button onPress={() => setShowHelp(true)} title="Help" startDecorator='LifeBuoy' variant="text"/>}
                        </BlockHeader>
                    )}
                    <BlockContent>
                        {children}
                    </BlockContent>
                </PageBlock>
            </View>
        </View>
    );
}