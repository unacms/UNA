import { useTranslation } from 'react-i18next'
import { View, Pressable } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'
import Link from 'app/ui/atoms/link'
import { useCurrentUser } from 'app/context/user'
import { useScreenTier } from 'app/context/measure'
import { appSetting, cn } from 'app/lib/util'
import { buildMenuSections, type MenuSection, type MenuSectionItem } from 'app/lib/menu-sections'
import { DashboardSettingsMenu } from 'app/components/elements/dashboard-stat'

type SettingsMenuItem = MenuSectionItem & {
    id?: string | number
    icon?: string
    hidden_on?: string[] | false
}

const CARD = cn(appSetting('theme', 'cards')['u-card-base'], 'w-full overflow-hidden')

function itemHref(item: SettingsMenuItem): string {
    const path = String(item?.url || item?.link || '')
    // A parent that only opens its children has no link (UNA sends `javascript:void(0)`).
    if (path.startsWith('javascript:')) return ''
    if (!path || /^https?:/.test(path) || path.startsWith('/')) return path
    return `/${path}`
}

function SettingsRow({ item, first, danger }: Readonly<{ item: SettingsMenuItem; first: boolean; danger: boolean }>) {
    const title = item?.title || item?.name || ''
    const tone = danger ? 'text-destructive' : 'text-card-foreground'
    return (
        <Link href={itemHref(item)} mode="plain" haptics="Light" alt={title} className="w-full">
            {/* A Pressable, not a Row: on native the link hands its press to its child. */}
            <Pressable className={cn('min-h-14 w-full flex-row items-center gap-3 px-4 web:hover:bg-muted/60 web:transition-colors', !first && 'border-t border-border/60')}>
                <Icon icon={item?.icon || 'Circle'} size={20} className={danger ? 'text-destructive' : 'text-muted-foreground'} />
                <Text className={cn('min-w-0 flex-1 text-base', tone)} numberOfLines={1}>{title}</Text>
                {danger ? null : <Icon icon="ChevronRight" size={18} className="shrink-0 text-muted-foreground" />}
            </Pressable>
        </Link>
    )
}

type SettingsSectionData = MenuSection<SettingsMenuItem>

function SettingsSection({ section }: Readonly<{ section: SettingsSectionData }>) {
    return (
        <View className="w-full gap-2">
            {section.title ? (
                <Text className="px-4 text-sm font-semibold text-muted-foreground" numberOfLines={1}>
                    {section.title}
                </Text>
            ) : null}
            <View className={CARD}>
                {section.entries.map((item, index) => (
                    <SettingsRow
                        key={String(item.id || item.name || index)}
                        item={item}
                        first={index === 0}
                        danger={section.danger}
                    />
                ))}
            </View>
        </View>
    )
}

/**
 * The settings list (UNA's `sys_account_settings` menu on the `settings` page): one card per section
 * (`lib/menu-sections.ts`). UNA makes the sections with items without a link: "Account", then the current
 * profile's, titled with its name, so switching profiles visibly changes the second card. The items outside them
 * follow, and deleting the account last on its own. `items` come with their section parents lifted out
 * (`getMenuSectionListItems`). The desktop sidebar shows the same sections (`SidebarNavSections` in the conductor's
 * web-ui.js).
 */
export default function SettingsMenu({ items, hub = '' }: Readonly<{ items: SettingsMenuItem[]; hub?: string }>) {
    const { t } = useTranslation()
    const { currentUser } = useCurrentUser()
    const tier = useScreenTier()

    // Not the list's own page (the menu's `hub`, an item of the menu in an older UNA), nor what UNA hides at this
    // size, nor a parent that only holds its subitems.
    const shown = (items || []).filter((item) =>
        !!itemHref(item)
        && !(!!hub && itemHref(item).replace(/^\/+/, '') === hub)
        && !(Array.isArray(item.hidden_on) && item.hidden_on.includes(tier)))

    // An older UNA's groups have no titles of their own.
    const sections = buildMenuSections(shown, (item) => item, {
        account: t('Account'),
        profile: currentUser ? currentUser.display_name : '',
    })

    return (
        // Rows read as a list, not a table: a phone-like width on wide screens too. Below desktop the
        // section's tab pane has no inset of its own, so the list keeps the page's 16px on every side,
        // and it is the page itself there (the section's list), centred on a tablet.
        <View className="mx-auto w-full max-w-2xl gap-6 p-4 lg:mx-0 lg:p-0">
            {sections.filter((section) => !section.danger).map((section) => <SettingsSection key={section.key} section={section} />)}
            {/* The app's own preferences (language, theme, feed, sounds), which the dashboard had as tiles; deleting the account stays last. */}
            <DashboardSettingsMenu settingsLink={false} layouts={false} title={t('Preferences')} />
            {sections.filter((section) => section.danger).map((section) => <SettingsSection key={section.key} section={section} />)}
        </View>
    )
}
