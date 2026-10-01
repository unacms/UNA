import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAnimatedValue } from 'app/lib/hooks/use-animated-value';
import { Animated, Platform } from 'react-native';
import { nativeDriver } from 'app/lib/platform/animation';
import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import { FeedbackHaptics, appSetting, getMenuSettings } from 'app/lib/util';
import { useCurrentUser } from 'app/context/user';
import { appStatic } from 'app/lib/app-static';
import { usePathname, useRouter } from 'app/lib/hooks/router';
import { components } from 'app/components/registry';
import { useIsDesktop } from 'app/context/measure';
import { NeoButton, NeoButtonLink } from 'app/design/controls';
import Link from 'app/ui/atoms/link';
import { canGoBackInTab, getTabKeyFromPathname, navigateBackInTab } from 'app/lib/navigation/tab-history';
import { useTranslation } from 'react-i18next';
import {
    useHeaderHeight,
    useScrollDirection,
    useSetHeaderHeight,
    useSetScrollDirection,
} from 'app/context/jotai/layout';
import { useHeaderOptions } from 'app/ui/molecules/header/options';
import { useIsTabSlideCopy } from 'app/context/tab-route-override';
import MenuTop from 'app/components/nav/menu-top';

const DEFAULT_CONTENT_PINNED_FIXED =
    ' bg-card backdrop-blur-xl shadow-sm ';

const SUBTAB_SLOT_MIN = 56;
const SUBTAB_REVEAL_DELAY_MS = 160;
const SUBTAB_REVEAL_FADE_MS = 220;

/**
 * First visit: reserve the subtab row and fade Hosts in after they layout so
 * the ~0.5s glass width-grow is not visible. A subtab switch swaps the owning
 * `PageHeaderOptions` in one commit, so `subHeader` never blinks to null.
 */
function RevealingSubHeader({ subHeader, onLayout }) {
    const [revealed, setRevealed] = useState(false);
    const opacity = useAnimatedValue(0);

    const hasSubHeader = !!subHeader;
    useEffect(() => {
        if (!hasSubHeader || revealed) return;
        const timer = setTimeout(() => {
            setRevealed(true);
            Animated.timing(opacity, {
                toValue: 1,
                duration: SUBTAB_REVEAL_FADE_MS,
                useNativeDriver: nativeDriver,
            }).start();
        }, SUBTAB_REVEAL_DELAY_MS);
        return () => clearTimeout(timer);
    }, [hasSubHeader, opacity, revealed]);

    if (!hasSubHeader) return null;

    return (
        <View
            onLayout={onLayout}
            collapsable={false}
            style={revealed ? undefined : { minHeight: SUBTAB_SLOT_MIN }}
        >
            <Animated.View style={{ opacity }} collapsable={false}>
                {subHeader}
            </Animated.View>
        </View>
    );
}

function settingString(value) {
    return typeof value === 'string' ? value.trim() : '';
}

/** `bg-*` including variant prefixes (`lg:bg-card`, `dark:lg:bg-card/60`). */
const BG_UTILITY = /(?:^|\s)(?:[\w-]+?:)*bg-[^\s]+/g;
const HAS_BG_UTILITY = /(?:^|\s)(?:[\w-]+?:)*bg-/;

/** Drop `bg-*` tokens so a later scrolled `bg-*` can win (Uniwind does not merge). */
export function stripBackgroundClasses(className) {
    return String(className || '').replace(BG_UTILITY, ' ');
}

/** Drop unprefixed fill + gradient stops so they can live on a native overlay. */
export function stripHeaderSurfaceClasses(className) {
    return String(className || '').replace(/(?:^|\s)(?:bg-|from-|via-|to-)[^\s]+/g, ' ');
}

/** Resting unprefixed `bg-*` tokens from `layout.header.container` (native fade overlay). */
export function getHeaderRestingBackgroundClass() {
    return (String(appSetting('layout', 'header', 'container') || '').match(/(?:^|\s)(bg-[^\s]+)/g) || [])
        .map((token) => token.trim())
        .join(' ');
}

const HEADER_FADE_TOKEN = /^(bg-(?:linear|gradient)-[^\s]+|from-[^\s]+|via-[^\s]+|to-[^\s]+)$/;
const DEFAULT_HEADER_FADE_EXTEND = 0;

/** Color wash. Prefer `layout.header.fade`; else gradient tokens on `container_scrolled`. */
export function getHeaderFadeClass() {
    const explicit = settingString(appSetting('layout', 'header', 'fade'));
    if (explicit) {
        return explicit;
    }
    return settingString(appSetting('layout', 'header', 'container_scrolled'))
        .split(/\s+/)
        .filter((token) => HEADER_FADE_TOKEN.test(token))
        .join(' ');
}

/** Extra px the fade overlay extends below the measured header. */
export function getHeaderFadeExtend() {
    const value = Number(appSetting('layout', 'header', 'fade_extend'));
    return Number.isFinite(value) && value > 0 ? value : DEFAULT_HEADER_FADE_EXTEND;
}

/**
 * Resolves flow + fixed-overlay content classNames.
 * When `layout.header.content_scrolled` is unset/blank, output matches the legacy paths exactly.
 */
export function resolveHeaderContentClassNames({ usesFixedOverlayHeader, isScrolled }) {
    const content = ` ${appSetting('layout', 'header', 'content')}`;
    const contentScrolled = settingString(appSetting('layout', 'header', 'content_scrolled'));
    const usesScrollContentStyles = contentScrolled.length > 0;

    if (!usesScrollContentStyles) {
        const flowHeaderContentClassName = usesFixedOverlayHeader
            ? `${content} `
            : content;
        const fixedHeaderContentClassName =
            appSetting('layout', 'header', 'content_pinned_fixed') ||
            DEFAULT_CONTENT_PINNED_FIXED;
        const fixedOverlayContentClassName = `${content} ${fixedHeaderContentClassName}`;
        return { flowHeaderContentClassName, fixedOverlayContentClassName };
    }

    const scrolledSuffix = isScrolled ? ` ${contentScrolled}` : '';
    const flowHeaderContentClassName = usesFixedOverlayHeader
        ? `${content}${scrolledSuffix} `
        : `${content}${scrolledSuffix}`;

    const pinnedExtra = settingString(appSetting('layout', 'header', 'content_pinned_fixed'));
    const pinnedSuffix = isScrolled && pinnedExtra.length > 0 ? ` ${pinnedExtra}` : '';
    const fixedOverlayContentClassName = `${content}${scrolledSuffix}${pinnedSuffix}`;

    return { flowHeaderContentClassName, fixedOverlayContentClassName };
}

/** Optional `layout.header.container_scrolled` suffix; blank/undefined leaves container classes unchanged. */
export function getContainerScrolledSuffix(isScrolled) {
    if (!isScrolled) {
        return '';
    }
    const containerScrolled = settingString(appSetting('layout', 'header', 'container_scrolled'));
    return containerScrolled.length > 0 ? ` ${containerScrolled}` : '';
}

/** `layout.header.container` plus optional scrolled suffix. Fade wash lives on the overlay, not the bar. */
export function resolveHeaderContainerClassName(isScrolled) {
    const container = appSetting('layout', 'header', 'container') || '';
    const suffix = getContainerScrolledSuffix(isScrolled);
    if (!suffix) {
        return container;
    }
    const base = HAS_BG_UTILITY.test(suffix) ? stripBackgroundClasses(container) : container;
    return `${base}${suffix}`;
}

export const TextHeader = memo(({ text }) => {
    return (
        <Text className="font-bold truncate leading-12 text-card-foreground text-2xl tracking-tight">
            {text}
        </Text>
    );
});

export const PageHeaderSmall = ({ pageData }) => {
    const { t } = useTranslation();
    const HeaderElement = components['molecule']['header_element'];
    return (
        <Row className="w-full justify-between gap-2">
            <Link href="/home" alt={t('Home')} className="items-center">
                {appStatic('logo')}
            </Link>
            <HeaderElement url={pageData?.url} uri={pageData?.uri} />
        </Row>
    );
};

export function usePageHeaderBase(pageData) {
    const { currentUser } = useCurrentUser();
    const router = useRouter();
    const options = useHeaderOptions();
    // Same shape the body always consumed: `header` is the full-bar override
    // (`false` = no bar at all), `subHeader` the row under it.
    const header = useMemo(() => ({
        header: options.hidden ? false : options.main,
        subHeader: options.sub,
        headerActions: options.actions,
        backButton: options.backButton,
        title: options.title,
    }), [options]);
    const scrollDirection = useScrollDirection();
    const setScrollDirection = useSetScrollDirection();
    const setHeaderHeightAtom = useSetHeaderHeight();
    const headerHeight = useHeaderHeight();
    // The slide-layer copy shares this tab's atoms but mounts fresh (messenger
    // shows the default bar until its convos load). Only the real page publishes
    // its height, or the copy's value can outlive it.
    const isSlideCopy = useIsTabSlideCopy();

    const isWeb = Platform.OS === 'web';
    const isDesktop = useIsDesktop();
    const isHome = pageData?.uri === 'home';
    const isCollapsibleHeader =
        appSetting('native', 'collapsible_header') && !isDesktop;
    const isContextSelector = !!pageData?.context && (appSetting('context_selector', 'show_always') || pageData?.context?.current?.id);
    const isFullContextSelector = appSetting('context_selector', 'show_always');
    const isShowLogo = isDesktop || (!isWeb && !currentUser) || isHome;
    const isBackButton = header.backButton;

    const menuSettings = getMenuSettings(
        pageData?.menu?.object,
        pageData?.menu?.config,
        pageData?.menu
    );

    useEffect(() => {
        setScrollDirection(0);
    }, [isDesktop, pageData?.uri, pageData?.url, setScrollDirection]);

    // Native: no reset when the full bar is swapped (messenger list ↔ chat
    // header). A bar of a different height re-fires the container onLayout; one
    // of the same height (a re-created injected header, e.g. on the messenger
    // inbox/direct switch) never does, so a reset to 0 would stick and slide
    // the list under the header.

    const pageTitle = useMemo(() => {
        let nextTitle = pageData?.name;

        if (menuSettings.name) {
            nextTitle = menuSettings.name;
        }
        if (header.title) {
            nextTitle = header.title;
        }

        return (nextTitle || '').replace('__notification__', '');
    }, [header.title, menuSettings.name, pageData?.name]);

    const onHeaderLayout = useCallback((event) => {
        const { height } = event.nativeEvent.layout;
        // Native Host remounts (glass selected tint) can report 0 for a frame,
        // or main-only height before tabs finish layout — and may never emit
        // another event. Keep the last full offset while subtabs are showing.
        if (height <= 0 || isSlideCopy) return;
        setHeaderHeightAtom((prev) => {
            if (prev === height) return prev;
            // Host remount can report main-only (~64). Keep the last full
            // offset then. Still allow coming down from an inflated measure.
            if (!isWeb && header.subHeader && prev > height && height < 80) return prev;
            return height;
        });
    }, [header.subHeader, isSlideCopy, isWeb, setHeaderHeightAtom]);

    const mainHeaderHeightRef = useRef(0);
    const subHeaderHeightRef = useRef(0);

    const syncHeaderHeight = useCallback(() => {
        if (header.header === false) {
            setHeaderHeightAtom(0);
            return;
        }
        const total = mainHeaderHeightRef.current + (header.subHeader ? subHeaderHeightRef.current : 0);
        // Do not publish 0 from unmeasured refs — that removes the list spacer
        // and PageHeader often will not re-measure after a subtab remount.
        if (total <= 0) return;
        setHeaderHeightAtom((prev) => (prev === total ? prev : total));
    }, [header.header, header.subHeader, setHeaderHeightAtom]);

    const onMainHeaderLayout = useCallback((event) => {
        mainHeaderHeightRef.current = event.nativeEvent.layout.height;
        // Native: total height comes from PageHeader container onLayout so we
        // never publish "main + 0" before subHeader measures (Settings tabs clip).
        if (isWeb) {
            syncHeaderHeight();
        }
    }, [isWeb, syncHeaderHeight]);

    const onSubHeaderLayout = useCallback((event) => {
        subHeaderHeightRef.current = event.nativeEvent.layout.height;
        if (isWeb) {
            syncHeaderHeight();
        }
    }, [isWeb, syncHeaderHeight]);

    useEffect(() => {
        if (header.header === false) {
            if (!isSlideCopy) setHeaderHeightAtom(0);
            return;
        }
        if (!header.subHeader) {
            subHeaderHeightRef.current = 0;
        }
        // Web: keep summing main + sub. Native: PageHeader onLayout owns the
        // total. Do not publish main-only (often 0 — the main ref is unused on
        // native) when subHeader flickers during a subtab remount.
        if (isWeb) {
            syncHeaderHeight();
        }
    }, [header.header, header.subHeader, isSlideCopy, isWeb, setHeaderHeightAtom, syncHeaderHeight]);

    return {
        currentUser,
        header,
        headerHeight,
        isBackButton,
        isCollapsibleHeader,
        isContextSelector,
        isFullContextSelector,
        isShowLogo,
        isWeb,
        onHeaderLayout,
        onMainHeaderLayout,
        onSubHeaderLayout,
        pageTitle,
        router,
        scrollDirection,
    };
}

export const PageHeaderBody = memo(({
    contentClassName,
    currentUser,
    header,
    isBackButton,
    isContextSelector,
    isFullContextSelector,
    isShowLogo,
    isWeb,
    onMainHeaderLayout,
    onSubHeaderLayout,
    pageData,
    pageTitle,
    router,
}) => {
    const { t } = useTranslation();
    const ContextSelector = components['molecule']['context_selector'];
    const HeaderElement = components['molecule']['header_element'];
    const pathname = usePathname();
    const currentTab = getTabKeyFromPathname(pathname);
    const canShowBackButton = isWeb
        ? (isBackButton &&
            (typeof isBackButton === 'function' || (typeof history !== 'undefined' && history.length > 2)))
        : ((typeof isBackButton === 'function' || canGoBackInTab(currentTab))) && (appSetting('native', 'backbutton_in_header') ||  appSetting('native', 'backbutton_in_header_path')?.includes(pageData.uri));
    const onBackPress = () => {
        FeedbackHaptics('Medium');
        if (typeof isBackButton === 'function') {
            isBackButton();
        } else {
            if (!isWeb && router) {
                navigateBackInTab(router, currentTab, currentUser);
            } else {
                router ? router.back() : history.back();
            }
        }
    };
    const BackButtonElement = ({ className = 'items-center' }) => (
        <View className={className}>
            <NeoButton
                borderShape="circle"
                image="ArrowLeft"
                style="glass"
                controlSize="regular"
                accessibilityLabel={t('Back')}
                onPress={onBackPress}
            />
        </View>
    );

    const Logo = (
        <>
            <View className="sm:hidden">
                {/* 32px mark + 6px insets = 44px content — a true circle at the
                    regular control height; wider marks degrade to a padded pill. */}
                <NeoButtonLink
                    href="/home"
                    alt={t('Home')}
                    style="glass"
                    controlSize="regular"
                    borderShape="capsule"
                    contentInsets={{ x: 6 }}
                    accessibilityLabel={t('Home')}
                >
                    {appStatic('logo')}
                </NeoButtonLink>
            </View>
            <View className="hidden sm:flex lg:hidden">
                <NeoButtonLink
                    href="/home"
                    alt={t('Home')}
                    style="glass"
                    controlSize="regular"
                    borderShape="capsule"
                    contentInsets={{ x: 12}}
                    accessibilityLabel={t('Home')}
                >
                    {appStatic('logo')}
                </NeoButtonLink>
            </View>
            <View className="hidden lg:flex -ms-2">
                <NeoButtonLink
                    href="/home"
                    alt={t('Home')}
                    style="borderless"
                    controlSize="regular"
                    contentInsets={{ x: 8 }}
                    accessibilityLabel={t('Home')}
                >
                    {appStatic('logo')}
                </NeoButtonLink>
            </View>
        </>
    );

    const leftElement = (!currentUser || (appSetting('layout', 'lock_unconfirmed') && !currentUser?.confirmed)) ? (
        Logo
    ) : isFullContextSelector ? (
        <ContextSelector url={pageData?.url} uri={pageData?.uri} data={pageData?.context} />
    ) : isShowLogo ? (
        Logo
    ) : (
        <TextHeader text={pageTitle} />
    );

    const contextSelectorElement =
        isContextSelector && !isFullContextSelector ? (
            <ContextSelector
                url={pageData?.url}
                uri={pageData?.uri}
                data={pageData?.context}
                mode="min"
            />
        ) : null;

    if (header.header) {
        if (!isWeb && canShowBackButton) {
            return (
                <View onLayout={onMainHeaderLayout}>
                    <Row className={`${contentClassName}`}>
                        <BackButtonElement className="items-center mr-2" />
                        <View className="flex-1">{header.header}</View>
                    </Row>
                </View>
            );
        }
        return (
            <View onLayout={onMainHeaderLayout}>
                {header.header}
            </View>
        );
    }

    return (
        <>
            <Row className={' ' + contentClassName} onLayout={onMainHeaderLayout}>
                <View className={' ' + appSetting('layout', 'header', 'content_left')}>
                    <Row className='flex-none items-center gap-3'>
                        {canShowBackButton && (
                            <BackButtonElement />
                        )}
                        
                        <View className=" min-w-0 ">{leftElement}</View>
                        {contextSelectorElement}
                    </Row>
                </View>
                {isWeb && <MenuTop url={pageData?.url} uri={pageData?.uri} />}
                <View className={' ' + appSetting('layout', 'header', 'content_right')}>
                
                    {header.headerActions ?? <HeaderElement url={pageData?.url} uri={pageData?.uri} />}
                
                </View>
            </Row>
            {isWeb ? (
                header.subHeader ? (
                    <View onLayout={onSubHeaderLayout}>
                        {header.subHeader}
                    </View>
                ) : null
            ) : (
                <RevealingSubHeader
                    subHeader={header.subHeader}
                    onLayout={onSubHeaderLayout}
                />
            )}
        </>
    );
});