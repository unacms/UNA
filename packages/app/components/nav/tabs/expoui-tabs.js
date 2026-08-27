/**
 * System tab bar via expo-router NativeTabs (iOS UITabBar / Android Material 3).
 * Gated by `native.expo_ui_buttons` + `native.expo_native_tabs`.
 *
 * Expo UI TabView / NavigationBar are in-screen chrome, not a router. NEO's
 * tab0–tab4 slots are full-screen routes, so NativeTabs is the fit.
 */
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useEffect, useState } from 'react';
import { PixelRatio } from 'react-native';
import { Image } from 'expo-image';
import { View } from 'app/design/view';
import { appSetting, findIconFromRemote, isAndroid, isIos, isTabBarLabelsEnabled } from 'app/lib/util';
import { useTranslation } from 'react-i18next';
import { TabSlideHost } from 'app/components/nav/tab-slide';
import { playTabFeedback } from 'app/components/nav/tab-feedback';
import { joinUnaUrl } from 'app/config';
import { ImageManipulator, SaveFormat } from 'app/lib/image/manipulator';
import { pngBase64WithCircleMask } from 'app/lib/image/circle-png';
import { getNativeOptimizedImageUrl } from 'app/lib/image-helpers';
import { getBadgeLabel } from './badges';
import { isDashboardTab } from './tab-menu';

function resolveTabIcons(icon) {
    const lucide = findIconFromRemote(icon) || icon;
    const tabIcons = appSetting('theme', 'expo_ui', 'tabs')?.icons;
    if (tabIcons?.[lucide]) return tabIcons[lucide];
    const sfName = appSetting('theme', 'expo_ui', 'button')?.iosSymbols?.[lucide];
    if (typeof sfName === 'string' && sfName) {
        return { sf: { default: sfName, selected: `${sfName}.fill` }, md: 'circle' };
    }
    return { sf: 'circle', md: 'circle' };
}

/** UITabBar draws `src` icons square at intrinsic size — resize + circle-mask once. */
const TAB_AVATAR_PT = 28;
const avatarIconCache = new Map();

async function loadCircledTabAvatar(avatar) {
    const raw = String(avatar);
    const uri = raw.startsWith('data:') ? raw : joinUnaUrl(raw) || raw;
    const scale = PixelRatio.get();
    const px = Math.round(TAB_AVATAR_PT * scale);
    const remote = getNativeOptimizedImageUrl(uri, TAB_AVATAR_PT) || uri;
    // The manipulator wants a local file — warm expo-image's disk cache and reuse it.
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

/** Circle-masked avatar icon source; null (SF-symbol fallback) until ready or on failure. */
function useDashboardAvatarIcon(avatar) {
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

export default function ExpoUITabNavigator({
    TabList,
    currentUser,
    colors,
    isShowTabs,
    tabsSessionKey,
}) {
    const { t } = useTranslation();
    const hideLabels = !isTabBarLabelsEnabled() || TabList.every((tab) => tab.title === '');
    const dashboardAvatarSource = useDashboardAvatarIcon(isIos ? currentUser?.avatar : null);

    return (
        <View className="flex-1">
            <NativeTabs
                key={tabsSessionKey}
                hidden={!isShowTabs}
                tintColor={colors.primary}
                backgroundColor={isAndroid ? colors.barsBackground : undefined}
                indicatorColor={isAndroid ? colors.primaryBg : undefined}
                rippleColor={isAndroid ? colors.primary : undefined}
                badgeBackgroundColor={appSetting('theme', 'native_tabs', 'badgeBackground') || colors.primary}
                iconColor={{
                    default: colors.barsColor,
                    selected: colors.primary,
                }}
                labelStyle={{
                    default: { color: colors.barsColor },
                    selected: { color: colors.primary },
                }}
                // Android Material: `auto` hides labels when there are 4+ tabs.
                labelVisibilityMode={hideLabels ? 'unlabeled' : 'labeled'}
                tabBarRespectsIMEInsets={isAndroid}
                screenListeners={{
                    tabPress: () => {
                        playTabFeedback();
                    },
                }}
                unstable_nativeProps={{
                    nativeContainerStyle: {
                        backgroundColor: isIos ? 'transparent' : colors.barsBackground,
                    },
                }}
            >
                {TabList.map((tab, index) => {
                    const icons = resolveTabIcons(tab.icon);
                    const badge = getBadgeLabel(currentUser, tab);
                    const avatarSource = isDashboardTab(tab, currentUser)
                        ? dashboardAvatarSource
                        : null;

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
                                <NativeTabs.Trigger.Icon sf={icons.sf} md={icons.md} />
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
                })}
            </NativeTabs>
            <TabSlideHost
                sessionKey={tabsSessionKey}
                backgroundColor={colors.background}
            />
        </View>
    );
}
