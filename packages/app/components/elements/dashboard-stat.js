import { Icon } from 'app/ui/atoms/icon'
import Badge from 'app/ui/molecules/profile/badge'
import {
    Block,
    BlockHeader,
    BlockContent,
    BlockFooter,
    BlockTitle,
    BlockDescription,
    BlockName,
    BlockActions,
} from 'app/ui/molecules/page/page-block'
import { useTranslation } from 'react-i18next'
import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { NeoButton, NeoButtonLink } from 'app/design/controls'
import { useCurrentUser } from 'app/context/user'
import Profile from 'app/ui/molecules/profile/profile'
import ProfileSwitcher from 'app/components/elements/profile-switcher'
import { appSetting, cn } from 'app/lib/util'
import DropdownMenu from 'app/ui/atoms/dropdown-menu'
import Link from 'app/ui/atoms/link'
import { useFetch } from 'app/lib/hooks/use-fetch'
import DasbordStatOld from 'app/components/elements/dashboard-stat-old'
import { useLayoutSettings } from 'app/context/layout-settings'
import { BlockWrapper } from 'app/components/block-wrapper'

const DASHBOARD_GRID =
    'grid w-full grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
const DASHBOARD_FALLBACK_ICONS = {
    friends: 'UsersRound',
    followers: 'UserPlus',
}
const dropdownTheme = appSetting('theme', 'dropdown')
const menuSettings = appSetting('theme', 'dropdown_menu')
const STAT_ICON_SIZE = menuSettings.icon_size || 20

function GrowthChip({ value, icon }) {
    const n = Number(value) || 0
    if (!n) return null

    const positive = n > 0
    const surface = positive ? 'bg-emerald-600/20' : 'bg-rose-600/20'
    const fg = positive
        ? 'text-emerald-700 dark:text-emerald-300'
        : 'text-rose-700 dark:text-rose-300'
    const glyph = icon || (positive ? 'ArrowBigUp' : 'ArrowBigDown')

    return (
        <Row className={cn('shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5', surface)}>
            {glyph ? <Icon icon={glyph} size={12} className={fg} /> : null}
            <Text className={cn('text-xs font-medium leading-none', fg)}>
                {positive ? '+' : ''}
                {n}
            </Text>
        </Row>
    )
}

function DashboardStatTile({ href, icon, title, count, trailing }) {
    const hasCount = count != null && count !== ''

    return (
        <View className={cn(dropdownTheme.cnt, 'relative z-0 w-full min-w-0')}>
            <Link href={href} mode="plain" className="block w-full min-w-0" alt={title}>
                <Row className={cn(menuSettings.item_ver, 'min-h-0 items-center py-2')}>
                    <View className="min-w-0 flex-auto gap-1">
                        {icon ? (
                            <View className={menuSettings.item_icon}>
                                <Icon
                                    icon={icon}
                                    size={STAT_ICON_SIZE}
                                    className="text-secondary-foreground web:group-hover:text-foreground"
                                />
                            </View>
                        ) : null}
                        <Text
                            numberOfLines={1}
                            className="text-sm font-semibold text-secondary-foreground web:group-hover:text-foreground"
                        >
                            {title}
                        </Text>
                    </View>
                    <View className="shrink-0 items-end justify-center gap-1 px-2">
                        {hasCount ? (
                            <Text className="text-3xl font-bold tabular-nums leading-none text-card-foreground web:group-hover:text-foreground">
                                {count}
                            </Text>
                        ) : null}
                        {trailing}
                    </View>
                </Row>
            </Link>
        </View>
    )
}

function DashboardAction({ href, icon, title }) {
    return (
        <View className="w-full min-w-0">
            <NeoButtonLink
                href={href}
                label={title}
                image={icon || undefined}
                style="bordered"
                controlSize="large"
                width="fill"
                align="start"
            />
        </View>
    )
}

export default function DashboardStat(props) {
    const useRemoteConfig = appSetting('layout', 'user_remote_config')
    return useRemoteConfig ? <DashboardStatRemote {...props} /> : <DasbordStatOld {...props} />
}

function DashboardStatRemote(props) {
    const {
        layoutSettings,
        updateLayoutSettings,
        themeName,
        setThemeName,
        setLayoutName,
        layoutName,
        lang,
        setLang,
        langCode,
    } = useLayoutSettings()
    const { t } = useTranslation()
    const { currentUser } = useCurrentUser()
    const langs = appSetting('layout', 'avaliable_langs')
    const showWiki = !!appSetting('wiki', 'enable')
    const showLangs = langs.length > 1
    const showTheme = !!appSetting('dashboard', 'switch_theme')
    const showLayouts = appSetting('layout', 'avaliable_layouts').length > 1
    const showFeedUnits = appSetting('layout', 'avaliable_feed_units').length > 1
    const showSecondaryActions = showWiki || showLangs || showTheme || showLayouts || showFeedUnits
    let profile = null
    if (currentUser) {
        let dUser = Object.assign({}, currentUser)
        dUser.url_avatar = dUser.avatar
        profile = <Profile {...dUser} displayType="unit_wo_info" size="lg" />
    }
    if (!currentUser) return null

    return (
        <BlockWrapper {...props.blockWrapperProps}>
            <Block className="u-max-width-block">
                <BlockHeader className="items-center">
                    <View className="flex-none">
                        <Profile
                            {...currentUser}
                            url_avatar={currentUser.avatar}
                            displayType="unit_wo_info"
                            displaySize="xl"
                        />
                    </View>
                    <BlockName className="gap-1">
                        <BlockTitle>
                            <Text className="text-card-foreground text-xl font-semibold">{currentUser.display_name}</Text>
                        </BlockTitle>
                        <BlockDescription>

                            <Badge
                                variant="secondary"
                                size="xs"
                                data={{
                                    text: currentUser.membership_name,
                                    icon: currentUser.membership_icon,
                                    icon_url: currentUser.membership_icon_url
                                }}
                            />

                        </BlockDescription>
                    </BlockName>
                    <BlockActions>

                        <ProfileSwitcher hideTitle={true}>
                            <NeoButton
                                style="bordered"
                                borderShape="circle"
                                image="RefreshCw"
                                accessibilityLabel={t('Switch profile')}
                            />
                        </ProfileSwitcher>

                    </BlockActions>
                </BlockHeader>
                <BlockContent className="!gap-3">
                    <ElementDashboardStat {...props} />
                    {showSecondaryActions ? (
                    <View className={DASHBOARD_GRID}>
                        {showWiki ? (
                            <View className="w-full min-w-0">
                                <NeoButtonLink
                                    href="/wiki/overview"
                                    label="Documentation"
                                    style="bordered"
                                    controlSize="large"
                                    image="BookOpenText"
                                    width="fill"
                                    align="start"
                                />
                            </View>
                        ) : null}
                        {showLangs ? (
                            <View className="w-full min-w-0">
                                <DropdownMenu
                                    triggerClassName="w-full"
                                    items={langs.map((lang) => ({
                                        id: lang,
                                        key: lang,
                                        name: lang,
                                        title: t('lang_' + lang),
                                    }))}
                                    onSelect={(oItem) => {
                                        setLang(oItem.id)
                                    }}
                                >
                                    <NeoButton
                                        label={t('lang_' + lang)}
                                        style="bordered"
                                        controlSize="large"
                                        image="Languages"
                                        width="fill"
                                        align="start"
                                        interactive
                                    />
                                </DropdownMenu>
                            </View>
                        ) : null}
                        {showTheme ? (
                            <View className="w-full min-w-0">
                                <DropdownMenu
                                    triggerClassName="w-full"
                                    items={['dark', 'light', 'auto'].map(
                                        (theme) => ({
                                            key: theme,
                                            id: theme,
                                            name: theme,
                                            title: t('theme_' + theme),
                                        })
                                    )}
                                    onSelect={(oItem) => {
                                        setThemeName(oItem.id)
                                    }}
                                >
                                    <NeoButton
                                        label={t('theme_' + themeName)}
                                        style="bordered"
                                        controlSize="large"
                                        image="Moon"
                                        width="fill"
                                        align="start"
                                        interactive
                                    />
                                </DropdownMenu>
                            </View>
                        ) : null}


                        {showLayouts ? (
                                <View className="w-full min-w-0">
                                    <DropdownMenu
                                        triggerClassName="w-full"
                                        items={appSetting(
                                            'layout',
                                            'avaliable_layouts'
                                        ).map((lang) => ({
                                            id: lang,
                                            key: lang,
                                            name: lang,
                                            title: t('format_' + lang),
                                        }))}
                                        onSelect={(oItem) => {
                                            setLayoutName(oItem.id)
                                        }}
                                    >
                                        <NeoButton
                                            label={t('format_' + layoutName)}
                                            style="bordered"
                                            controlSize="large"
                                            image="Layout"
                                            width="fill"
                                            align="start"
                                            interactive
                                        />
                                    </DropdownMenu>
                                </View>
                            ) : null}

                        {showFeedUnits ? (
                            <View className="w-full min-w-0">
                                <DropdownMenu
                                    triggerClassName="w-full"
                                    items={appSetting(
                                        'layout',
                                        'avaliable_feed_units'
                                    ).map((feed_unit) => ({
                                        id: feed_unit,
                                        key: feed_unit,
                                        name: feed_unit,
                                        title: t(feed_unit),
                                    }))}
                                    onSelect={(oItem) => {
                                        updateLayoutSettings({ feed_unit: oItem.id })
                                    }}
                                >
                                    <NeoButton
                                        label={t(layoutSettings.feed_unit)}
                                        style="bordered"
                                        controlSize="large"
                                        image="Rows2"
                                        width="fill"
                                        align="start"
                                        interactive
                                    />
                                </DropdownMenu>
                            </View>
                        ) : null}
                    </View>
                    ) : null}
                </BlockContent>
                <BlockFooter>
                    <NeoButtonLink
                        href="/logout"
                        label={t('Sign out')}
                        style="bordered"
                        controlSize="large"
                        image="LogOut"
                        width="fill"
                    />
                </BlockFooter>
            </Block>
        </BlockWrapper>
    )
}

function ElementDashboardStat(props) {
    const { t } = useTranslation()
    const { currentUser } = useCurrentUser()
    // Page JSON carries a snapshot; refresh it (cached, so returning to the dashboard is instant).
    const { data: sResponse } = useFetch('/api.php?r=system/get_stat_block/TemplDashboardServices')
    const data = sResponse?.data?.[0]?.data ?? props.data

    const menu = appSetting('dashboard', 'menu')
    const list = appSetting('dashboard', 'modules_list')
    const modules = menu || (data?.modules || []).filter((item) => list.includes(item.key))
    const manageItems = data?.manage?.items || []

    return (
        <>
            {modules.length > 0 ? (
                <View className={DASHBOARD_GRID}>
                    {modules.map((item, index) => {
                        if (!item) return null

                        const isGrowth = item.type === 'growth'
                        let href = isGrowth
                            ? item.url
                            : (item.url || '').replace(
                                '{profile_url_postfix}',
                                currentUser?.url?.replace('/view-persons-profile/', '') || '',
                            )
                        if (href && !href.startsWith('/')) href = '/' + href

                        const count = isGrowth ? item.current : item.count
                        const actionValue = item.action ? item[item.action] : null
                        const unreadMessages = currentUser?.counters?.bx_messenger_new_messages
                        const unreadNotifs = currentUser?.notifications
                        const icon = item.icon || DASHBOARD_FALLBACK_ICONS[item.key]

                        const trailing = []
                        if (Number(actionValue)) {
                            trailing.push(
                                <GrowthChip
                                    key="growth"
                                    value={actionValue}
                                    icon={item.action_icon}
                                />,
                            )
                        }
                        if (item.type === 'messenger' && unreadMessages > 0) {
                            trailing.push(
                                <View
                                    key="messages"
                                    className="min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 py-0.5"
                                >
                                    <Text className="text-xs font-medium text-destructive-foreground">
                                        {unreadMessages}
                                    </Text>
                                </View>,
                            )
                        }
                        if (item.type === 'notifications' && unreadNotifs > 0) {
                            trailing.push(
                                <View
                                    key="notifs"
                                    className="min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 py-0.5"
                                >
                                    <Text className="text-xs font-medium text-destructive-foreground">
                                        {unreadNotifs}
                                    </Text>
                                </View>,
                            )
                        }

                        return (
                            <DashboardStatTile
                                key={item.key || index}
                                href={href}
                                icon={icon}
                                title={item.title}
                                count={count}
                                trailing={trailing.length ? trailing : null}
                            />
                        )
                    })}
                </View>
            ) : null}
            {manageItems.length > 0 ? (
                <View className={DASHBOARD_GRID}>
                    {manageItems.map((item, index) => (
                        <DashboardAction
                            key={item.link || index}
                            href={item.link}
                            icon={item.icon}
                            title={t(item.title)}
                        />
                    ))}
                </View>
            ) : null}
        </>
    )
}
