import { useTranslation } from 'react-i18next'
import { View, Pressable } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'
import Link from 'app/ui/atoms/link'
import { useCurrentUser } from 'app/context/user'
import { useScreenTier } from 'app/context/measure'
import { appSetting, cn, strToObj } from 'app/lib/util'

type SettingsMenuItem = {
    id?: string | number
    name?: string
    title?: string
    link?: string
    url?: string
    icon?: string
    config?: string
    hidden_on?: string[] | false
    subitems?: SettingsMenuItem[]
}

/** Groups in the order the list shows them; an item without one goes to `other`. */
const GROUPS = ['account', 'profile', 'other', 'danger'] as const
type SettingsGroup = (typeof GROUPS)[number]

const CARD = cn(appSetting('theme', 'cards')['u-card-base'], 'w-full overflow-hidden')

/** An item's group from its UNA `config_api` (`{"group":"account"}`); `null` when it has none. */
export function getSettingsItemGroup(item: SettingsMenuItem): SettingsGroup | null {
    const config = item?.config ? strToObj(item.config) : null
    const group = config && typeof config === 'object' ? config.group : null
    return GROUPS.includes(group) ? group : null
}

/** True when the menu's items say which group they belong to, so the list is drawn grouped. */
export function hasSettingsGroups(items: SettingsMenuItem[]): boolean {
    return items.some((item) => getSettingsItemGroup(item) !== null)
}

/**
 * Every row the list shows: items nested under a parent in Studio (`subitems`) come right after it,
 * in its group unless they name their own; a parent that only groups them (no link) has no row.
 */
function flattenSettingsItems(items: SettingsMenuItem[], skip: (item: SettingsMenuItem) => boolean, parentGroup: SettingsGroup | null = null): { item: SettingsMenuItem; group: SettingsGroup }[] {
    return items.flatMap((item) => {
        if (skip(item)) return []
        const group = getSettingsItemGroup(item) ?? parentGroup
        const row = itemHref(item) ? [{ item, group: group ?? 'other' }] : []
        return [...row, ...flattenSettingsItems(item.subitems || [], skip, group)]
    })
}

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

/**
 * The settings list (UNA's `sys_account_settings` menu on the `settings` page): one card per group,
 * the account's first, then the current profile's under its name, then the rest, and deleting the
 * account last on its own. One list for both, so switching profiles visibly changes the second card.
 */
export default function SettingsMenu({ items, hub = '' }: Readonly<{ items: SettingsMenuItem[]; hub?: string }>) {
    const { t } = useTranslation()
    const { currentUser } = useCurrentUser()
    const tier = useScreenTier()

    // Not the list's own page (the menu's `hub`, its Overview item), nor what UNA hides at this size.
    const skip = (item: SettingsMenuItem) =>
        (!!hub && itemHref(item).replace(/^\/+/, '') === hub)
        || (Array.isArray(item.hidden_on) && item.hidden_on.includes(tier))

    const byGroup = new Map<SettingsGroup, SettingsMenuItem[]>()
    for (const { item, group } of flattenSettingsItems(items, skip)) {
        byGroup.set(group, [...(byGroup.get(group) || []), item])
    }

    const headings: Partial<Record<SettingsGroup, string>> = {
        account: t('Account'),
        profile: currentUser ? currentUser.display_name : '',
    }

    return (
        // Rows read as a list, not a table: a phone-like width on wide screens too. Below desktop the
        // section's tab pane has no inset of its own, so the list keeps the page's 16px on every side.
        <View className="w-full max-w-2xl gap-6 p-4 lg:p-0">
            {GROUPS.filter((group) => byGroup.has(group)).map((group) => (
                <View key={group} className="w-full gap-2">
                    {headings[group] ? (
                        <Text className="px-4 text-sm font-semibold text-muted-foreground" numberOfLines={1}>
                            {headings[group]}
                        </Text>
                    ) : null}
                    <View className={CARD}>
                        {(byGroup.get(group) || []).map((item, index) => (
                            <SettingsRow
                                key={String(item.id || item.name || index)}
                                item={item}
                                first={index === 0}
                                danger={group === 'danger'}
                            />
                        ))}
                    </View>
                </View>
            ))}
        </View>
    )
}
