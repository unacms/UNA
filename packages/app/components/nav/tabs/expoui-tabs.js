/**
 * System tab bar via expo-router NativeTabs (iOS UITabBar / Android Material 3).
 * Gated by `native.expo_ui_buttons` + `native.expo_native_tabs`.
 *
 * Expo UI TabView / NavigationBar are in-screen chrome, not a router. NEO's
 * tab0–tab4 slots are full-screen routes, so NativeTabs is the fit.
 */
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useEffect, useMemo, useState } from 'react';
import { PixelRatio, Platform, Pressable, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { View } from 'app/design/view';
import { androidTabBarHeight, appSetting, findIconFromRemote, isAndroid, isIos, FeedbackHaptics, clearNotif, IOS_TAB_BAR_MARGIN } from 'app/lib/util';
import { useTranslation } from 'react-i18next';
import { TabSlideHost } from 'app/components/nav/tab-slide';
import { playTabFeedback } from 'app/components/nav/tab-feedback';
import { joinUnaUrl } from 'app/config';
import { ImageManipulator, SaveFormat } from 'app/lib/image/manipulator';
import { pngBase64WithCircleMask } from 'app/lib/image/circle-png';
import { getNativeOptimizedImageUrl } from 'app/lib/image-helpers';
import { lucideAssetName, lucideDrawableName } from 'app/lib/platform/lucide-assets';
import { getBadgeLabel } from './badges';
import {
    MORE_TAB_ICON,
    areTabBarLabelsHidden,
    buildTabBarMoreMenuItems,
    isDashboardTab,
    isExternalTabUrl,
    isProfileTab,
    resolveTabUrl,
    splitTabBarItems,
    tabBarMoreSeparator,
    trimMenuSeparators,
} from './tab-menu';
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { NativeMoreSheet, hasNativeMoreSheet } from 'app/components/nav/tabs/more-sheet';
import { OperatorAgentPanel, useOperatorAgentData } from 'app/ui/molecules/system/operator-agent';
import { useNativeTokenColor } from 'app/design/controls/neo-button/native-style-colors';
import { getWindowSafeAreaInsets, useGlobalSearchParams, useRouter, usePathname, useSafeAreaInsets } from 'app/lib/hooks/router';
import { nativeTabHref, rememberSelectedTab } from 'app/lib/navigation/tab-history';
import emitter, { EVENTS } from 'app/context/emitter';
import * as WebBrowser from 'expo-web-browser';
import { useBottomSheetData } from 'app/context/bottomsheet';
import { useCurrentUser } from 'app/context/user';

const IOS_TAB_BAR_HEIGHT = 52;
/** More popup entry that opens the operator agent (the iOS sheet shows an icon instead). */
const OPERATOR_AGENT_ITEM_ID = 'operator-agent';

function resolveTabIcons(icon) {
    const lucide = findIconFromRemote(icon) || icon;
    const mapped = appSetting('theme', 'expo_ui', 'tabs')?.icons?.[lucide];
    // Lucide mode: the generated template asset (iOS) / vector drawable
    // (Android), tinted by `iconColor` (no filled variant — selected is the
    // same glyph in `primary`).
    const xcasset = isIos && appSetting('theme', 'expo_ui', 'iosIconSource') !== 'sf'
        ? lucideAssetName(lucide)
        : null;
    const drawable = isAndroid && appSetting('theme', 'expo_ui', 'androidIconSource') !== 'material'
        ? lucideDrawableName(lucide)
        : null;
    if (xcasset) return { xcasset, md: mapped?.md || 'circle' };
    if (drawable) return { drawable };
    if (mapped) return mapped;
    const sfName = appSetting('theme', 'expo_ui', 'button')?.iosSymbols?.[lucide];
    if (typeof sfName === 'string' && sfName) {
        return { sf: { default: sfName, selected: `${sfName}.fill` }, md: 'circle' };
    }
    return { sf: 'circle', md: 'circle' };
}

/** `Icon` props for `resolveTabIcons()` — iOS priority is sf > xcasset, so send only one. */
function tabIconProps(icons) {
    if (icons.drawable) return { drawable: icons.drawable };
    return icons.xcasset
        ? { xcasset: icons.xcasset, md: icons.md }
        : { sf: icons.sf, md: icons.md };
}

function getOverflowBadgeLabel(currentUser, overflow = []) {
    let total = 0;
    for (const tab of overflow) {
        if (tab?.hide === true) continue;
        const label = getBadgeLabel(currentUser, tab);
        if (!label) continue;
        const n = parseInt(label, 10);
        if (n > 0) total += n;
    }
    if (total <= 0) return null;
    return total > 99 ? '99+' : String(total);
}

/** UITabBar draws `src` icons square at intrinsic size — resize + circle-mask once. */
const TAB_AVATAR_PT = 28;
/** Avatar in the More sheet's profile header. */
const SHEET_AVATAR_PT = 40;
const avatarIconCache = new Map();

/** Absolute avatar URL, resized by the native images proxy when configured. */
function avatarImageUri(avatar, pt) {
    const raw = String(avatar);
    const uri = raw.startsWith('data:') ? raw : joinUnaUrl(raw) || raw;
    return getNativeOptimizedImageUrl(uri, pt) || uri;
}

async function loadCircledTabAvatar(avatar) {
    const scale = PixelRatio.get();
    const px = Math.round(TAB_AVATAR_PT * scale);
    const remote = avatarImageUri(avatar, TAB_AVATAR_PT);
    await Image.prefetch(remote);
    const cached = await Image.getCachePathAsync(remote);
    const context = ImageManipulator.manipulate(cached ? `file://${cached}` : remote);
    context.resize({ width: px, height: px });
    const rendered = await context.renderAsync();
    const { base64 } = await rendered.saveAsync({ format: SaveFormat.PNG, compress: 1, base64: true });
    return {
        uri: `data:image/png;base64,${pngBase64WithCircleMask(base64)}`,
        width: TAB_AVATAR_PT,
        height: TAB_AVATAR_PT,
        scale,
    };
}

function useAvatarTabIcon(avatar) {
    const [source, setSource] = useState(() => (avatar ? avatarIconCache.get(avatar) ?? null : null));
    useEffect(() => {
        if (!avatar || avatarIconCache.has(avatar)) return undefined;
        let cancelled = false;
        loadCircledTabAvatar(avatar)
            .then((icon) => {
                avatarIconCache.set(avatar, icon);
                if (!cancelled) setSource(icon);
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [avatar]);
    return source;
}

function renderTabTrigger({
    tab,
    index,
    currentUser,
    avatarSource,
    hideLabels,
    t,
}) {
    const icons = resolveTabIcons(tab.icon);
    const badge = getBadgeLabel(currentUser, tab);

    return (
        <NativeTabs.Trigger
            key={`tab${index}`}
            name={`tab${index}`}
            hidden={tab.hide === true}
            disablePopToTop
            disableScrollToTop
            disableAutomaticContentInsets
        >
            {avatarSource ? (
                <NativeTabs.Trigger.Icon
                    src={avatarSource}
                    renderingMode="original"
                />
            ) : (
                <NativeTabs.Trigger.Icon {...tabIconProps(icons)} />
            )}
            {hideLabels || tab.title === '' ? (
                <NativeTabs.Trigger.Label hidden>
                    {tab.title ? t(tab.title) : undefined}
                </NativeTabs.Trigger.Label>
            ) : (
                <NativeTabs.Trigger.Label>{t(tab.title)}</NativeTabs.Trigger.Label>
            )}
            {badge ? <NativeTabs.Trigger.Badge>{badge}</NativeTabs.Trigger.Badge> : null}
        </NativeTabs.Trigger>
    );
}

/**
 * iOS sheet: invisible target over the More (avatar) tab. The tab bar's glass
 * indicator starts sliding on touch-down, before iOS asks whether the tab may
 * be selected, so the menu tap is taken here and the tab bar never sees it —
 * the indicator and the page stay put and the sheet opens on touch-down.
 * Geometry of the iOS 26 floating bar on iPhone (measured on a 15 Pro): 21pt
 * side margins, 7.5pt inner padding, evenly spaced items, 49pt above the
 * bottom inset. Taps just outside it reach the `disabled` native tab, which
 * opens the menu too (with the indicator's bounce).
 */
const IOS_TAB_BAR = { margin: IOS_TAB_BAR_MARGIN, padding: 7.5, height: 49 };

function MoreTabTarget({ itemCount, onPress }) {
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const slot = (width - 2 * (IOS_TAB_BAR.margin + IOS_TAB_BAR.padding)) / itemCount;
    return (
        <Pressable
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            onPressIn={onPress}
            style={{
                position: 'absolute',
                right: 0,
                bottom: 0,
                width: IOS_TAB_BAR.margin + IOS_TAB_BAR.padding + slot,
                height: IOS_TAB_BAR.height + insets.bottom,
                zIndex: 9999,
            }}
        />
    );
}

/** Transparent hit target over the native More tab — opens the same popup as JS tabs (not with the iOS sheet). */
function NativeTabsMoreOverlay({
    visible,
    isShowTabs,
    overflowMenuItems,
    onSelectOverflow,
    moreMenuOpen,
    onMoreMenuOpenChange,
    onMoreTriggerPress,
    tabBarHeight,
}) {
    const { t } = useTranslation();

    if (!isShowTabs || !overflowMenuItems?.length) return null;

    return (
        <View
            pointerEvents="box-none"
            collapsable={false}
            style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: tabBarHeight,
                zIndex: 9999,
                ...(isAndroid ? { elevation: 24 } : null),
            }}
        >
            <View pointerEvents="box-none" className="h-full flex-row">
                {visible.map((tab, index) => (
                    <View key={tab.key || `spacer-${index}`} className="flex-1" pointerEvents="none" />
                ))}
                <View className="flex-1" collapsable={false}>
                    <DropdownMenu
                        mode="popup"
                        showOnTop
                        openOnFocus={false}
                        open={moreMenuOpen}
                        onOpenChange={onMoreMenuOpenChange}
                        items={overflowMenuItems}
                        onSelect={onSelectOverflow}
                        triggerAccessibilityLabel={t('More')}
                        triggerClassName="flex-1 w-full h-full"
                    >
                        <View
                            className="flex-1 w-full h-full"
                            onTouchEnd={() => onMoreTriggerPress()}
                        />
                    </DropdownMenu>
                </View>
            </View>
        </View>
    );
}

export default function ExpoUITabNavigator({
    TabList,
    currentUser,
    colors,
    isShowTabs,
    tabsSessionKey,
}) {
    const { t } = useTranslation();
    const pathname = usePathname();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { setCurrentUser } = useCurrentUser();
    const { setBottomSheetData } = useBottomSheetData();
    const hideLabels = areTabBarLabelsHidden(TabList);
    const avatarIcon = useAvatarTabIcon(isIos ? currentUser?.avatar : null);
    // Own avatar as a tab icon: the `{profile}` item, or the dashboard in menus without one.
    const hasProfileTab = TabList.some(isProfileTab);
    const usesAvatarIcon = (tab) => (hasProfileTab ? isProfileTab(tab) : isDashboardTab(tab, currentUser));

    const { visible, overflow, moreTabIndex } = useMemo(
        () => splitTabBarItems(TabList),
        [TabList]
    );

    // Overflow page the More tab shows (sheet highlight). It outlives visits to
    // other tabs — the More tab comes back on it — and resets with the session.
    const [activeOverflow, setActiveOverflow] = useState({ session: tabsSessionKey, url: null });
    const activeOverflowUrl = activeOverflow.session === tabsSessionKey ? activeOverflow.url : null;
    const [moreMenuOpen, setMoreMenuOpen] = useState(false);

    // Operator agent: opened from the More menu (same rule as pages skipping
    // their floating button, `hasNativeTabsMoreMenu`) and shown over every tab.
    const agentData = useOperatorAgentData(overflow.length > 0 && !!isShowTabs);
    const agentParams = useGlobalSearchParams();
    const [agentOpen, setAgentOpen] = useState(false);
    const toggleAgent = () => {
        setMoreMenuOpen(false);
        setAgentOpen((open) => !open);
    };

    // Selected tab: the toggled look of selected glass buttons (`native_tabs.selected`).
    const tabsSelected = appSetting('theme', 'native_tabs', 'selected');
    const selectedInk = useNativeTokenColor(tabsSelected?.foreground) || colors.primary;
    const selectedIndicator = useNativeTokenColor(tabsSelected?.indicator) || colors.primaryBg;
    const badgeBackground = useNativeTokenColor(appSetting('theme', 'native_tabs', 'badgeBackground') || 'bg-destructive');

    // JS popup's hit area over the More tab; the Android bar pads itself with the system inset.
    const tabBarHeight = isAndroid ? androidTabBarHeight(hideLabels) + insets.bottom : IOS_TAB_BAR_HEIGHT;
    // Agent card sits above the bar, where the page float used to.
    const agentBottomOffset = 16 + (isAndroid
        ? tabBarHeight
        : IOS_TAB_BAR.height + (getWindowSafeAreaInsets().bottom || 0));

    useEffect(() => {
        const subscription = emitter.addListener(EVENTS.tabsMore, (data) => {
            if (data?.action === 'open') setMoreMenuOpen(true);
            if (data?.action === 'close') setMoreMenuOpen(false);
        });
        return () => subscription.remove();
    }, []);

    const overflowMenuItems = useMemo(
        () => buildTabBarMoreMenuItems({
            visible,
            overflow,
            moreTabIndex,
            currentUser,
            t,
            pathname,
            activeOverflowUrl,
            mode: 'native',
        }),
        [visible, overflow, moreTabIndex, currentUser, t, pathname, activeOverflowUrl]
    );

    // Plain function — React Compiler memoizes it (manual useCallback here
    // could not be preserved by the compiler).
    const handleOverflowSelect = async (item) => {
        if (item?.id === OPERATOR_AGENT_ITEM_ID) {
            toggleAgent();
            return;
        }
        if (item?.type === 'separator' || !item?.tab) return;

        const tab = item.tab;
        const tabUrl = resolveTabUrl(tab, currentUser);
        const routeIndex = item.isOverflow ? moreTabIndex : item.tabIndex;
        setBottomSheetData(null);

        if (isExternalTabUrl(tabUrl)) {
            await WebBrowser.openBrowserAsync(tabUrl);
            FeedbackHaptics('Medium');
            return;
        }

        const notificationUrl = appSetting('notifications', 'url');
        if (tabUrl === notificationUrl) {
            clearNotif();
            setCurrentUser({
                notifications: 0,
                notificationsTs: Date.now(),
                counters: {
                    ...(currentUser?.counters || {}),
                    bx_notifications: 0,
                },
            });
        }

        playTabFeedback();
        setMoreMenuOpen(false);
        if (item.isOverflow) setActiveOverflow({ session: tabsSessionKey, url: tabUrl });
        rememberSelectedTab(`/tab${routeIndex}`);
        router.push(nativeTabHref(tabUrl, `/tab${routeIndex}`));
    };

    const collapsed = overflow.length > 0;
    const moreRoot = overflow[0];
    // iOS: a `{profile}` item heading the More list makes the More tab the
    // user's avatar and the sheet's header (Linear style).
    const profileMore = collapsed && isIos && isProfileTab(moreRoot);
    const sheetExclude = appSetting('theme', 'expo_ui', 'tabs')?.more_sheet_exclude || [];
    const sheetHeader = profileMore && hasNativeMoreSheet
        ? overflowMenuItems.find((item) => item.tab === moreRoot) ?? null
        : null;
    const sheetItems = trimMenuSeparators(overflowMenuItems.filter(
        (item) => item !== sheetHeader && !sheetExclude.includes(item.tab?.url)
    ));
    // The profile is the only More link left: the avatar opens it directly
    // (unless the sheet is also where the operator agent opens).
    const profileOnly = !!sheetHeader && !sheetItems.some((item) => item.isOverflow) && !agentData;
    // Popup More menu (Android, iOS without the sheet): Agent heads the list,
    // shown selected while its chat is open.
    const popupMenuItems = agentData
        ? [
            { id: OPERATOR_AGENT_ITEM_ID, title: t('operator_agent_title'), icon: 'Sparkles', selected: agentOpen },
            { ...tabBarMoreSeparator(), id: `${OPERATOR_AGENT_ITEM_ID}-separator` },
            ...overflowMenuItems,
        ]
        : overflowMenuItems;

    // The menu opens over the current page: `MoreTabTarget` takes the tap on
    // iPhone, and the `disabled` native tab covers the rest (edge taps,
    // VoiceOver, iPad). With the profile as the only More link the avatar is a
    // real tab instead — the press selects it and the profile shows.
    // Plain values, like the handlers above — React Compiler memoizes them.
    const handleMoreTabPress = () => {
        if (profileOnly) {
            rememberSelectedTab(`/tab${moreTabIndex}`);
            return;
        }
        playTabFeedback();
        setMoreMenuOpen(true);
    };

    // More presses go to the trigger's own `listeners`; every tab press gets the click.
    const moreTabListeners = { tabPress: handleMoreTabPress };
    const screenListeners = { tabPress: () => playTabFeedback() };

    const moreIcons = resolveTabIcons(profileMore ? moreRoot.icon : MORE_TAB_ICON);
    const moreTitle = profileMore ? t(moreRoot.title) : t('More');
    const overflowBadge = getOverflowBadgeLabel(currentUser, overflow);

    return (
        <View className="flex-1">
            <NativeTabs
                key={tabsSessionKey}
                hidden={!isShowTabs}
                tintColor={selectedInk}
                backgroundColor={isAndroid ? colors.barsBackground : undefined}
                indicatorColor={isAndroid ? selectedIndicator : undefined}
                rippleColor={isAndroid ? colors.primary : undefined}
                badgeBackgroundColor={badgeBackground}
                iconColor={{
                    default: colors.barsColor,
                    selected: selectedInk,
                }}
                labelStyle={{
                    default: { color: colors.barsColor },
                    selected: { color: selectedInk },
                }}
                labelVisibilityMode={hideLabels ? 'unlabeled' : 'labeled'}
                tabBarRespectsIMEInsets={isAndroid}
                screenListeners={screenListeners}
                unstable_nativeProps={{
                    nativeContainerStyle: {
                        backgroundColor: isIos ? 'transparent' : colors.barsBackground,
                    },
                }}
            >
                {collapsed
                    ? visible.map((tab, index) => renderTabTrigger({
                        tab,
                        index,
                        currentUser,
                        avatarSource: usesAvatarIcon(tab) ? avatarIcon : null,
                        hideLabels,
                        t,
                    }))
                    : TabList.map((tab, index) => renderTabTrigger({
                        tab,
                        index,
                        currentUser,
                        avatarSource: usesAvatarIcon(tab) ? avatarIcon : null,
                        hideLabels,
                        t,
                    }))}
                {collapsed ? (
                    // `disabled` (native preventNativeSelection) while More opens a
                    // menu: a tap only emits `tabPress` and never selects the tab.
                    // A normal tab when the profile is its only link. Router
                    // navigation (overflow picks, links) lands on it either way.
                    <NativeTabs.Trigger
                        key={`tab${moreTabIndex}`}
                        name={`tab${moreTabIndex}`}
                        disabled={!profileOnly}
                        disablePopToTop
                        disableScrollToTop
                        disableAutomaticContentInsets
                        listeners={moreTabListeners}
                    >
                        {profileMore && avatarIcon ? (
                            <NativeTabs.Trigger.Icon src={avatarIcon} renderingMode="original" />
                        ) : (
                            <NativeTabs.Trigger.Icon {...tabIconProps(moreIcons)} />
                        )}
                        {hideLabels ? (
                            <NativeTabs.Trigger.Label hidden>{moreTitle}</NativeTabs.Trigger.Label>
                        ) : (
                            <NativeTabs.Trigger.Label>{moreTitle}</NativeTabs.Trigger.Label>
                        )}
                        {overflowBadge ? (
                            <NativeTabs.Trigger.Badge>{overflowBadge}</NativeTabs.Trigger.Badge>
                        ) : null}
                    </NativeTabs.Trigger>
                ) : null}
            </NativeTabs>
            {collapsed && hasNativeMoreSheet && isShowTabs && !profileOnly && !Platform.isPad ? (
                <MoreTabTarget
                    itemCount={visible.filter((tab) => tab.hide !== true).length + 1}
                    onPress={handleMoreTabPress}
                />
            ) : null}
            {collapsed && hasNativeMoreSheet && isShowTabs ? (
                <NativeMoreSheet
                    open={moreMenuOpen}
                    onOpenChange={setMoreMenuOpen}
                    items={sheetItems}
                    onSelect={handleOverflowSelect}
                    profile={sheetHeader ? {
                        item: sheetHeader,
                        name: currentUser?.display_name,
                        avatar: currentUser?.avatar ? avatarImageUri(currentUser.avatar, SHEET_AVATAR_PT) : null,
                    } : null}
                    onAgentPress={agentData ? toggleAgent : undefined}
                    agentActive={agentOpen}
                />
            ) : null}
            {collapsed && !hasNativeMoreSheet ? (
                <NativeTabsMoreOverlay
                    visible={visible}
                    isShowTabs={isShowTabs}
                    overflowMenuItems={popupMenuItems}
                    onSelectOverflow={handleOverflowSelect}
                    moreMenuOpen={moreMenuOpen}
                    onMoreMenuOpenChange={setMoreMenuOpen}
                    onMoreTriggerPress={handleMoreTabPress}
                    tabBarHeight={tabBarHeight}
                />
            ) : null}
            <TabSlideHost
                sessionKey={tabsSessionKey}
                backgroundColor={colors.background}
            />
            {agentData ? (
                <OperatorAgentPanel
                    data={agentData}
                    open={agentOpen}
                    onClose={() => setAgentOpen(false)}
                    bottomOffset={agentBottomOffset}
                    params={agentParams}
                />
            ) : null}
        </View>
    );
}