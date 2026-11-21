import { Platform } from 'react-native'
import { useTranslation } from 'react-i18next'
import { View } from 'app/design/view'
import { NeoButton, NeoButtonLink, legacyToNeoButtonProps } from 'app/design/controls'
import { useCurrentUser } from 'app/context/user'
import { useIsDesktop } from 'app/context/measure'
import { useRouter } from 'app/lib/hooks/router'
import { appSetting, getHeaderToolbarNeoButtonDefaults } from 'app/lib/util'

/** An item of the header's toolbar (`header_toolbar.hor`, settings/header-toolbar.js). */
export type ToolbarItem = {
    component: string;
    /** On the slot around the button: also says which side of `lg` the item shows on (`getItemTier`). */
    className?: string;
    href?: string;
    target?: string;
    title?: string;
    alt?: string;
    /** The item of UNA's member toolbar a visitor's link follows (`login`, `create-account`). */
    una?: string;
    web?: boolean;
    native?: boolean;
    props?: Record<string, any>;
};

type ToolbarTier = 'mobile' | 'desktop' | 'both';

// Web: the side of the desktop breakpoint a toolbar item shows on, read from its classes, so its
// buttons take that tier's style in the server HTML (rendered for desktop) and keep it after
// hydration. 'mobile': hidden from `lg` (or from `sm`); 'desktop': shown only from `lg`; else 'both'.
// Only when the desktop tier starts at `lg` (`layout.tablet_mode_from`), as the classes assume.
const cssTiers = Platform.OS === 'web' && (appSetting('layout', 'tablet_mode_from') || 'lg') === 'lg'

export function getItemTier(className?: string): ToolbarTier {
    if (!cssTiers) return 'both'
    const tokens = String(className || '').split(/\s+/)
    if (tokens.some((c) => /(^|:)(sm|lg):hidden$/.test(c))) return 'mobile'
    if (tokens.includes('hidden') && tokens.some((c) => /(^|:)lg:(block|flex)$/.test(c))
        && !tokens.some((c) => /(^|:)(sm|md):(block|flex)$/.test(c))) return 'desktop'
    return 'both'
}

/** Style and size for an item that shows on one side of `lg` only; the item's own props win. */
export function tierButtonProps(item: ToolbarItem): Record<string, any> | undefined {
    const tier = getItemTier(item.className)
    return tier === 'both' ? item.props : { ...getHeaderToolbarNeoButtonDefaults(tier === 'desktop'), ...item.props }
}

type ToolbarLinkProps = Readonly<{
    item: ToolbarItem;
    /** The page's uri: Messages is the current one on the messenger's page. */
    uri?: string | null;
}>;

/** The messenger's page, and whether `uri` is it. */
function useMessenger(uri?: string | null) {
    const { currentUser } = useCurrentUser()
    const href: string = appSetting('messenger', 'url')
    return {
        href,
        isCurrent: href === '/' + uri,
        // The count of unread messages on the button.
        addon: {
            variant: 'primary',
            text: currentUser ? currentUser.counters?.bx_messenger_new_messages : undefined,
            hideZero: true,
        },
    }
}

/**
 * A link whose item says how it looks (`props.neoButton`): Log In and Sign Up, and Messages where a project sets it
 * up so. An item on both sides of `lg` gets one copy per tier, picked with classes, so the server's HTML has both
 * looks.
 */
function ToolbarNeoLink({ item, uri }: ToolbarLinkProps) {
    const { t } = useTranslation()
    const isDesktop = useIsDesktop()
    const messenger = useMessenger(uri)
    const { neoButton: _neoButton, primary, ...neoButtonProps } = item.props ?? {}
    const isMessenger = item.href === '{messenger}'
    // Visual label only from props.title. Item title is a11y metadata: using it as label turns icon-only circles
    // (mobile Log In) into padded labelled buttons.
    const label: string | undefined = neoButtonProps.title ? t(neoButtonProps.title) : undefined
    const a11yKey: string | undefined = neoButtonProps.accessibilityLabel || item.title
    const a11yLabel = a11yKey ? t(a11yKey) : undefined
    const messengerProps = isMessenger
        ? { image: neoButtonProps.image ?? 'MessageSquare', addon: messenger.addon, selected: messenger.isCurrent }
        : null

    const renderLink = (desktop: boolean) => (
        <NeoButtonLink
            {...getHeaderToolbarNeoButtonDefaults(desktop, { primary })}
            borderShape="circle"
            {...neoButtonProps}
            {...(label ? { title: label, label } : null)}
            {...(a11yLabel ? { accessibilityLabel: a11yLabel } : null)}
            {...(item.target ? { target: item.target } : null)}
            href={isMessenger ? messenger.href : item.href}
            {...messengerProps}
        />
    )

    const tier = getItemTier(item.className)
    if (tier !== 'both') return renderLink(tier === 'desktop')
    if (!cssTiers) return renderLink(isDesktop)
    return (
        <>
            <View className="lg:hidden">{renderLink(false)}</View>
            <View className="hidden lg:flex">{renderLink(true)}</View>
        </>
    )
}

/** Messages as the toolbar draws it by default: a round button with the count of unread messages. */
function ToolbarMessengerButton({ item, uri }: ToolbarLinkProps) {
    const { t } = useTranslation()
    const router = useRouter()
    const isDesktop = useIsDesktop()
    const messenger = useMessenger(uri)
    const labelKey: string | undefined = item.alt || item.title || item.props?.title
    const label = labelKey ? t(labelKey) : undefined
    return (
        <NeoButton
            {...getHeaderToolbarNeoButtonDefaults(isDesktop)}
            addon={messenger.addon}
            borderShape="circle"
            image="MessageSquare"
            selected={messenger.isCurrent}
            role="link"
            alt={label}
            accessibilityLabel={label}
            onPress={(event: unknown) => {
                item.props?.onPress?.(event)
                if (messenger.href) router?.push?.(messenger.href)
            }}
        />
    )
}

/** Any other link: the item's legacy button props, secondary on desktop and text below it unless it says. */
function ToolbarLegacyLink({ item }: ToolbarLinkProps) {
    const { t } = useTranslation()
    const isDesktop = useIsDesktop()
    const titleKey: string | undefined = item.props?.title || item.title
    return (
        <NeoButtonLink
            {...legacyToNeoButtonProps({
                ...item.props,
                ...(titleKey ? { title: t(titleKey) } : null),
                variant: item.props?.variant || (isDesktop ? 'secondary' : 'text'),
            })}
            {...(item.target ? { target: item.target } : null)}
            href={item.href}
        />
    )
}

/** A toolbar item that is a link (`component: 'link'`): Messages (`href: '{messenger}'`), Log In, Sign Up, or a project's own. */
export default function ToolbarLink({ item, uri }: ToolbarLinkProps) {
    if (item.props?.neoButton) return <ToolbarNeoLink item={item} uri={uri} />
    if (item.href === '{messenger}') return <ToolbarMessengerButton item={item} uri={uri} />
    return <ToolbarLegacyLink item={item} />
}
