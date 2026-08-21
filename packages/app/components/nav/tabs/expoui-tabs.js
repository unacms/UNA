/**
 * System tab bar via expo-router NativeTabs (iOS UITabBar / Android Material 3).
 * Gated by `native.expo_ui_buttons` + `native.expo_native_tabs`.
 *
 * Expo UI TabView / NavigationBar are in-screen chrome, not a router. NEO's
 * tab0–tab4 slots are full-screen routes, so NativeTabs is the fit.
 */
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { PixelRatio } from 'react-native';
import { View } from 'app/design/view';
import { appSetting, findIconFromRemote, isAndroid, isIos, isTabBarLabelsEnabled } from 'app/lib/util';
import { useTranslation } from 'react-i18next';
import { TabSlideHost } from 'app/components/nav/tab-slide';
import { playTabFeedback } from 'app/components/nav/tab-feedback';
import { joinUnaUrl } from 'app/config';
import { getNativeOptimizedImageUrl } from 'app/ui/atoms/image';
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

/** iOS UITabBar loads remote URLs via RCT image loader. Size the Next `w=` like Profile xs. */
function tabAvatarSrc(avatar) {
    if (!avatar) return null;
    const uri = joinUnaUrl(String(avatar)) || String(avatar);
    const width = appSetting('theme', 'profile_sizes', 'xs')?.width || 24;
    return {
        uri: getNativeOptimizedImageUrl(uri, width) || uri,
        width,
        height: width,
        scale: PixelRatio.get(),
    };
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
    const dashboardAvatarSource = isIos
        ? tabAvatarSrc(currentUser?.avatar)
        : null;

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
