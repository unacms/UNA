import { View } from 'app/design/view'
import Html from 'app/ui/atoms/html'
import { stripTags, appSetting, isUrl } from 'app/lib/util';
import { useState } from 'react';
import { Block as PageBlock, BlockContent, BlockName, BlockActions, BlockHeader, BlockTitle, BlockDescription, BlockIcon } from 'app/ui/molecules/page/page-block'
import { useTranslation } from 'react-i18next'
import { Button, ButtonLink, Modal, NeoButtonLink } from 'app/design/controls'
import { Icon } from 'app/ui/atoms/icon'
import { components } from 'app/components/registry'
import { usePathname } from 'app/lib/hooks/router'
import { normalizeTiers, responsiveClasses } from 'app/lib/responsive-classes'

function pathComparable(path) {
    return String(path || '').replace(/^\/+/, '').split(/[?#]/)[0]
}

function BlockHeaderMenu({ menu, pathname }) {
    const MenuItemBlockmenu = components['menu-item']['blockmenu']
    const current = pathComparable(pathname)
    const items = menu?.items

    if (!items?.length || !MenuItemBlockmenu) return null

    return (
        <View className="flex-row items-center gap-2">
            {items.map((item) => {
                const href = item.link || item.url || ''
                const onPress = typeof item.onPress === 'function' ? item.onPress : undefined
                const pressed = typeof item.pressed === 'boolean'
                    ? item.pressed
                    : Boolean(pathComparable(href) && pathComparable(href) === current)

                return (
                    <MenuItemBlockmenu
                        key={item.id || item.name}
                        title={item.title}
                        href={onPress ? undefined : href}
                        pressed={pressed}
                        disabled={item.disabled}
                        onPress={onPress}
                    />
                )
            })}
        </View>
    )
}

// `clip` is opt-in: tile/card shadows paint outside the content box, so blocks
// never hide overflow by default. Inner scrollers own their own overflow.
export function BlockWrapper({ config, block, wrapperClassses, showTitle, showBg, fullWidth, contentOnly, list, showPadding, extraProps, fill, clip = false, children }) {
    const { t } = useTranslation()
    const [showHelp, setShowHelp] = useState(false)
    const pathname = usePathname()

    const blockMenu = block?.menu?.items?.length ? block.menu : null

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

    // The block's App config (Studio: "Config (for App in JSON format)") can set
    // the design box per breakpoint, e.g. {"designbox": {"bg": ["tablet", "desktop"]}}.
    // Each key (bg, padding, title, rounded) lists the tiers where that part shows;
    // a missing key keeps designbox_id. Props from code still win below.
    const designbox = config?.designbox || {};
    if (designbox.bg != null) bIsShowBg = normalizeTiers(designbox.bg);
    if (designbox.padding != null) bIsShowPadding = normalizeTiers(designbox.padding);
    if (designbox.title != null) bIsShowTitle = normalizeTiers(designbox.title);
    const rounded = designbox.rounded ?? config?.rounded;

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

    if (contentOnly) {
        return (<View className={wrapperClassses}>
            {children}
        </View>)
    }
    const pureHelp = stripTags(block.help);
    if (pureHelp) {
        bIsShowTitle = true;
    }

    if (blockMenu) {
        bIsShowTitle = true;
    }

    const isHelpLink = isUrl(pureHelp)
    const isHelp = !!block.help
    const hasHeaderActions = !!(config?.header_more_url || blockMenu)
    const fillClass = fill ? 'flex h-full min-h-0 flex-1 flex-col' : ''

    return (
        <View className={`${wrapperClassses || 'w-full'} ${fillClass}`}>
            {(isHelp && !isHelpLink) && <Modal title={t('Help')} onVisible={!!showHelp} onClose={() => { setShowHelp(false) }} transparent={false}>
                <Html data={pureHelp} />
            </Modal>}
            <View className={`@container/block w-full ${fillClass}`}>
                <PageBlock
                    key={block.id}
                    isBg={bIsShowBg}
                    isPad={bIsShowPadding}
                    rounded={rounded}
                    className={[
                        "w-full mx-auto",
                        fill ? "flex h-full min-h-0 flex-1 flex-col" : "",
                        (!fullWidth && !cssClasses.includes("max-w-") ? appSetting('layout', 'max_width_block') : ""),
                        cssClasses,
                    ].filter(Boolean).join(" ")}

                >
                    {bIsShowTitle && (
                        <BlockHeader
                            isPad={bIsShowPadding}
                            className={[
                                fill ? 'shrink-0' : '',
                                fill && !bIsShowPadding ? 'px-4 pt-4' : '',
                                // Title on some tiers only: hidden where it's off.
                                Array.isArray(bIsShowTitle) ? responsiveClasses('title', bIsShowTitle) : '',
                            ].filter(Boolean).join(' ') || undefined}
                        >
                             
                            <BlockName>
                                <View className="flex-row items-center gap-2">
                            {!!block.icon && <BlockIcon>
                                <Icon icon={block.icon} size={appSetting('theme', 'blocks')['u-block-icon-size']}/>
                            </BlockIcon>}
                                <BlockTitle>{stripTags(block.title)}</BlockTitle></View>
                                {!!block.description && <BlockDescription>{block.description}</BlockDescription>}
                            </BlockName>

                            {hasHeaderActions && (<BlockActions>
                                {blockMenu ? (
                                    <BlockHeaderMenu menu={blockMenu} pathname={pathname} />
                                ) : null}
                                {config?.header_more_url ? (
                                    <NeoButtonLink
                                        href={config?.header_more_url}
                                        label={t(config?.header_more_text || 'See all')}
                                        style="link"
                                        borderShape="roundedRectangle"
                                        controlSize="small"
                                    />
                                ) : null}
                            </BlockActions>)}
                            {(isHelp && isHelpLink) && <ButtonLink href={pureHelp} target="_blank" title={t('Help')} startDecorator='LifeBuoy' variant="text" />}
                            {(isHelp && !isHelpLink) && <Button onPress={() => setShowHelp(true)} title={t('Help')} startDecorator='LifeBuoy' variant="text" />}
                        </BlockHeader>
                    )}
                    <BlockContent
                        isPad={bIsShowPadding}
                        className={
                            fill
                                ? `flex min-h-0 flex-1 flex-col ${clip ? 'overflow-hidden' : ''}`
                                : undefined
                        }
                    >
                        {children}
                    </BlockContent>
                </PageBlock>
            </View>
        </View>
    );
}
