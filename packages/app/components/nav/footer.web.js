import Link from 'app/ui/atoms/link';
import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography'
import { appSetting } from 'app/lib/util'
import { useCurrentUser } from 'app/context/user';
import Profile from 'app/ui/molecules/profile/profile';
import { useLocalSearchParams, usePathname } from 'app/lib/hooks/router';
import { getFriendsCounter } from 'app/customization/functions';
import { Icon } from 'app/ui/atoms/icon'
import { useTranslation } from 'react-i18next';
import { useFooter, useFooterHeight, useSetFooterHeight } from 'app/context/jotai/layout';
import { useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSound } from 'app/lib/hooks/use-sound';
import { isTabBarLabelsEnabled } from 'app/lib/util';
import DropdownMenu, { DropdownMenuOpenContext } from 'app/ui/atoms/dropdown-menu';
import { NeoButton } from 'app/design/controls';
import { cn } from 'app/lib/util';
import { OperatorAgentPanel, useOperatorAgentData } from 'app/ui/molecules/system/operator-agent';
import {
    splitTabBarItems,
    buildTabBarMoreMenuItems,
    inferTabIndexFromUrl,
    isTabBarUrlActive,
    resolveTabUrl,
    splitProfileMoreMenu,
} from 'app/components/nav/tabs/tab-menu';
import {
    consumeSkipTabInfer,
    getSelectedTab,
    peekTabLastUrl,
    rememberSelectedTab,
    rememberTabLastUrl,
    resetAllTabHistory,
    shouldSkipTabInfer,
} from 'app/lib/navigation/tab-history';

function isInStandaloneMode() {
    if (window.navigator.standalone) {
        return true;
    } else if (window.matchMedia('(display-mode: standalone)').matches) {
        return true;
    }
    return false;
}

function tabIndexFromKey(tabKey) {
    return tabKey ? Number(String(tabKey).replace('/tab', '')) : -1;
}

/** Pure: selected tab for this pathname. Does not write tab history. */
function deriveSelectedTabKey(pathname, currentUser, tabList, sessionChanged) {
    const skipInfer = !sessionChanged && shouldSkipTabInfer(pathname);
    const inferredIndex = inferTabIndexFromUrl(pathname, tabList, currentUser);
    const stored = sessionChanged ? null : getSelectedTab();
    if (!skipInfer && inferredIndex >= 0) {
        return `/tab${inferredIndex}`;
    }
    return stored;
}

function tabBarHref(tabKey, rootUrl, selectedKey, sessionChanged) {
    const root = rootUrl || '/home';
    if (selectedKey === tabKey) return root;
    if (sessionChanged) return root;
    return peekTabLastUrl(tabKey) || root;
}

function persistWebTabLocation(pathname, currentUser, tabList) {
    const skipInfer = consumeSkipTabInfer(pathname);
    const inferredIndex = inferTabIndexFromUrl(pathname, tabList, currentUser);
    if (!skipInfer && inferredIndex >= 0) {
        rememberSelectedTab(`/tab${inferredIndex}`);
    }
    const selected = getSelectedTab();
    const stillOnOtherTabRoot = skipInfer && inferredIndex >= 0 && inferredIndex !== tabIndexFromKey(selected);
    if (selected && pathname && !stillOnOtherTabRoot) {
        rememberTabLastUrl(selected, pathname);
    }
}

export default function () {
    const { currentUser } = useCurrentUser();
    const TabList = currentUser ? appSetting('menu_items', 'menu_tabbar_logged') : appSetting('menu_items', 'menu_tabbar_non_logged');
    const { visible: visibleTabs, overflow: overflowTabs } = useMemo(
        () => splitTabBarItems(TabList || []),
        [TabList]
    );
    const { t } = useTranslation();
    const notifCount = currentUser ? currentUser.notifications : 0;
    const iFrCounter = getFriendsCounter(currentUser);
    const pathname = usePathname();
    const footer = useFooter();
    const setFooterHeight = useSetFooterHeight();

    const hideForGuest = !currentUser && !appSetting('layout', 'show_tabbar_on_mobile_non_logged');
    const isFooterEnabled = Boolean(footer);
    const lockUnconfirmed = appSetting('layout', 'lock_unconfirmed') && !currentUser?.confirmed;
    const shouldHide = lockUnconfirmed || hideForGuest || !isFooterEnabled;
    const sessionKey = currentUser?.id ? `${currentUser.id}-${currentUser.confirmed}` : 'guest';
    const sessionRef = useRef(sessionKey);
    const sessionChanged = sessionRef.current !== sessionKey;
    const locationPath = pathname === '/' ? '/home' : pathname;
    const selectedTabKey = deriveSelectedTabKey(locationPath, currentUser, TabList, sessionChanged);

    const viewerUrl = currentUser?.url;
    useLayoutEffect(() => {
        if (sessionRef.current !== sessionKey) {
            resetAllTabHistory();
            sessionRef.current = sessionKey;
        }
        if (shouldHide) return;
        persistWebTabLocation(locationPath, { url: viewerUrl }, TabList);
    }, [shouldHide, sessionKey, locationPath, viewerUrl, TabList]);

    useEffect(() => {
        // When the tab bar is not rendering (early return), immediately clear the
        // stored height so Page.minHeight is not incorrectly reduced.
        if (shouldHide) setFooterHeight(0);
        // Also clear on unmount so stale values never survive navigation.
        return () => setFooterHeight(0);
    }, [shouldHide]);

    if (shouldHide)
        return null

    return (
        <View
            className={
                `min-h-16 fixed bottom-0 left-0 z-30 px-4 py-1 w-full lg:hidden  ${isInStandaloneMode() ? "pb-4" : ""}`
            }
            onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}
        >
            <View
                className={`z-50 bg-card shadow-btn-glass dark:shadow-btn-glass-deep rounded-full w-full pb-0 ${isInStandaloneMode() ? "h-12" : ""}`}
            >
                <Row className="flex-auto items-center flex-row w-full p-1.5 gap-1">
                    {visibleTabs.filter(item => !item.hide).map((tab, index) => {
                        const tabKey = `/tab${index}`;
                        const root = resolveTabUrl(tab, currentUser);
                        const isActive = selectedTabKey === tabKey || isTabBarUrlActive(locationPath, root);
                        const href = tabBarHref(tabKey, root, selectedTabKey, sessionChanged);
                        return (
                            <MenuBottomItem
                                key={`bmi-${index}`}
                                notifCount={notifCount}
                                iFrCounter={iFrCounter}
                                link={href}
                                tabKey={tabKey}
                                badge={tab.badge}
                                icon={tab.icon}
                                title={t(tab.title)}
                                isActive={isActive}
                                animated={tab.animated}
                                addClassName={tab.addClassName}
                                rootUrl={root}
                            />
                        );
                    })}
                    {overflowTabs.length > 0 ? (
                        <MoreBottomItem
                            visibleTabs={visibleTabs}
                            overflowTabs={overflowTabs}
                            pathname={locationPath}
                            currentUser={currentUser}
                        />
                    ) : null}
                </Row>
            </View>
        </View>
    );
}

function MenuBottomItem({ link, tabKey, rootUrl, title, badge, icon, isActive, iFrCounter, notifCount, animated, addClassName }) {
    const { currentUser } = useCurrentUser();
    const playSound = useSound('click');
    const useAnimatedIcon = animated === true;
    const [groupHovered, setGroupHovered] = useState(false);
    const badgeObj = [
        {
            condition: (rootUrl === appSetting('notifications', 'url') || badge == 'notifications') && notifCount > 0, //to remove in 11.25 link === appSetting('notifications', 'url')
            value: { variant: 'primary', text: notifCount }
        },
        {
            condition: (rootUrl === appSetting('messenger', 'url') || badge == 'messenger') && currentUser?.counters?.bx_messenger_new_messages > 0,
            value: { variant: 'primary', text: currentUser?.counters?.bx_messenger_new_messages }
        },
        {
            condition: (rootUrl === '/friends' || badge == 'friends') && iFrCounter > 0,
            value: { variant: 'primary', text: iFrCounter }
        },
        {
            condition: (badge == 'notifications, messenger') && currentUser?.counters?.bx_messenger_new_messages+notifCount > 0,
            value: { variant: 'primary', text: currentUser?.counters?.bx_messenger_new_messages+notifCount }
        }
    ].find(item => item.condition)?.value || null;

    const handlePress = useCallback(() => {
        playSound();
        rememberSelectedTab(tabKey, { fromPress: true });
    }, [playSound, tabKey]);
    const baseIconClassName = isActive
        ? 'text-accent-foreground'
        : 'text-secondary-foreground web:group-hover:text-foreground';
    const iconClassName = addClassName ? `${baseIconClassName} ${addClassName}` : baseIconClassName;

    return (
            <Link
                href={link}
                noprefetch={rootUrl === appSetting('notifications', 'url') ? "false" : "true"}
                className="group flex-1"
                alt={title}
                 onClick={handlePress}
            >
                <View
                    className={` my-auto items-center rounded-full min-h-12 justify-center p-1.5 text-center gap-1.5 web:hover:bg-muted/50 ${isActive && 'bg-accent/60'}`}
                    onMouseEnter={useAnimatedIcon ? () => setGroupHovered(true) : undefined}
                    onMouseLeave={useAnimatedIcon ? () => setGroupHovered(false) : undefined}
                >
                    <View className="items-center justify-center">
                        {
                            rootUrl === appSetting('dashboard', 'url') || icon=='dashboard' 
                            ? <View className="w-6 h-6"><Profile  {...currentUser} url_avatar = {currentUser.avatar} url={rootUrl} displayType="unit_wo_info" displaySize="xs" /></View> : 
                            <Icon icon={icon} size={24} animated={useAnimatedIcon} active={useAnimatedIcon ? isActive : undefined} hovered={useAnimatedIcon ? groupHovered : undefined} className={iconClassName} />
                        }
                    </View>
                    {isTabBarLabelsEnabled() && title ? (
                        <Text className={` web:group-hover:text-accent-foreground text-[11px] tracking-tight leading-none font-medium whitespace-nowrap ${isActive ? 'text-accent-foreground' : 'text-secondary-foreground web:group-hover:text-foreground'}`}>{title}</Text>
                    ) : null}
                    {badgeObj && <View className={`absolute bg-destructive border-2 border-card rounded-full px-1.5 min-w-6 items-center justify-center  -top-1 left-1/2 -translate-x-1/2 ml-4`}><Text className="text-white text-xs font-medium tracking-tight leading-5 ">{badgeObj.text}</Text></View>}
                </View>
                
            </Link>
    );
}

/** The viewer's avatar, sized like a tab icon. */
function TabAvatar({ currentUser, url }) {
    return (
        <View className="w-6 h-6">
            <Profile
                {...currentUser}
                url_avatar={currentUser?.avatar}
                url={url}
                showLinks={false}
                displayType="unit_wo_info"
                displaySize="xs"
            />
        </View>
    );
}

/**
 * Last tab when the menu collapses into More. Like the native tab bars: a
 * `{profile}` item first in More makes the tab the viewer's avatar and heads
 * the menu (avatar, name, "View profile" and the operator agent button); if
 * the profile is its only link and there is no agent, the avatar is a plain
 * profile tab. Below `lg` the header's account item (and its Agent button) is
 * hidden, so the agent opens from here.
 */
function MoreBottomItem({ visibleTabs, overflowTabs, pathname, currentUser }) {
    const { t } = useTranslation();
    const params = useLocalSearchParams();
    const footerHeight = useFooterHeight();
    const [menuOpen, setMenuOpen] = useState(false);
    const [agentOpen, setAgentOpen] = useState(false);
    const agentData = useOperatorAgentData(!!currentUser);
    const allItems = useMemo(
        () => buildTabBarMoreMenuItems({
            visible: visibleTabs,
            overflow: overflowTabs,
            currentUser,
            t,
            pathname,
            mode: 'web',
        }),
        [visibleTabs, overflowTabs, currentUser, t, pathname]
    );
    const { header: profileItem, items: profileMenuItems, profileOnly } = splitProfileMoreMenu({
        items: allItems,
        overflow: overflowTabs,
        hasAgent: !!agentData,
    });
    const items = profileItem ? profileMenuItems : allItems;
    const isOverflowActive = overflowTabs.some((tab) =>
        isTabBarUrlActive(pathname, resolveTabUrl(tab, currentUser))
    );
    const avatarUser = profileItem ? currentUser : null;

    if (profileItem && profileOnly) {
        return (
            <Link href={profileItem.link} className="group flex-1 min-w-0" alt={profileItem.title}>
                <MoreBottomTrigger isOverflowActive={isOverflowActive} avatarUser={avatarUser} title={profileItem.title} />
            </Link>
        );
    }

    const toggleAgent = () => {
        setMenuOpen(false);
        setAgentOpen((open) => !open);
    };

    return (
        <View className="flex-1 min-w-0">
            <DropdownMenu
                mode="popup"
                showOnTop
                openOnFocus={false}
                open={menuOpen}
                onOpenChange={setMenuOpen}
                items={items}
                triggerClassName="group flex-1 w-full h-full min-w-0"
                header={profileItem || agentData ? (
                    <MoreMenuHeader
                        profileItem={profileItem}
                        currentUser={currentUser}
                        agentActive={agentOpen}
                        onProfilePress={() => setMenuOpen(false)}
                        onAgentPress={agentData ? toggleAgent : null}
                    />
                ) : null}
            >
                <MoreBottomTrigger
                    isOverflowActive={isOverflowActive}
                    avatarUser={avatarUser}
                    title={profileItem ? profileItem.title : t('More')}
                />
            </DropdownMenu>
            {agentData ? (
                <OperatorAgentPanel
                    data={agentData}
                    open={agentOpen}
                    onClose={() => setAgentOpen(false)}
                    bottomOffset={footerHeight + 8}
                    params={params}
                />
            ) : null}
        </View>
    );
}

/** Top of the More menu: the profile row (opens the profile) and the Agent button. */
function MoreMenuHeader({ profileItem, currentUser, agentActive, onProfilePress, onAgentPress }) {
    const { t } = useTranslation();
    return (
        <Row className="items-center gap-2 pb-1.5 mb-1.5 border-b border-border">
            {profileItem ? (
                <Link
                    href={profileItem.link}
                    onClick={onProfilePress}
                    className="flex-1 min-w-0"
                    alt={profileItem.title}
                >
                    <Row
                        className={cn(
                            'items-center gap-3 rounded-lg p-2 web:hover:bg-muted/50 web:cursor-pointer',
                            profileItem.selected && 'bg-accent'
                        )}
                    >
                        <View className="w-11 h-11">
                            <Profile
                                {...currentUser}
                                url_avatar={currentUser?.avatar}
                                url={profileItem.link}
                                showLinks={false}
                                displayType="unit_wo_info"
                                displaySize="base"
                            />
                        </View>
                        <View className="flex-1 min-w-0">
                            <Text
                                numberOfLines={1}
                                className={cn(
                                    'text-sm font-semibold',
                                    profileItem.selected ? 'text-accent-foreground' : 'text-foreground'
                                )}
                            >
                                {currentUser?.display_name || profileItem.title}
                            </Text>
                            <Text numberOfLines={1} className="text-xs text-muted-foreground">
                                {t('View profile')}
                            </Text>
                        </View>
                    </Row>
                </Link>
            ) : (
                <View className="flex-1" />
            )}
            {onAgentPress ? (
                <NeoButton
                    style="borderless"
                    borderShape="circle"
                    image="Sparkles"
                    selected={agentActive}
                    accessibilityLabel={t(agentActive ? 'operator_agent_close' : 'operator_agent_open')}
                    onPress={onAgentPress}
                />
            ) : null}
        </Row>
    );
}

function MoreBottomTrigger({ isOverflowActive, avatarUser, title }) {
    const { t } = useTranslation();
    const isOpen = useContext(DropdownMenuOpenContext) ?? false;
    const isActive = isOverflowActive || isOpen;

    return (
        <View
            className={`w-full my-auto items-center rounded-full min-h-12 justify-center p-1.5 text-center gap-1.5 web:hover:bg-muted/50 ${isActive ? 'bg-accent/60' : ''}`}
        >
            <View className="items-center justify-center">
                {avatarUser ? (
                    <TabAvatar currentUser={avatarUser} url={avatarUser.url} />
                ) : (
                    <Icon
                        icon="ChevronsUpDown"
                        size={24}
                        className={isActive
                            ? 'text-accent-foreground'
                            : 'text-secondary-foreground web:group-hover:text-foreground'}
                    />
                )}
            </View>
            {isTabBarLabelsEnabled() ? (
                <Text
                    className={`web:group-hover:text-accent-foreground text-[11px] tracking-tight leading-none font-medium whitespace-nowrap ${isActive ? 'text-accent-foreground' : 'text-secondary-foreground web:group-hover:text-foreground'}`}
                >
                    {title || t('More')}
                </Text>
            ) : null}
        </View>
    );
}
