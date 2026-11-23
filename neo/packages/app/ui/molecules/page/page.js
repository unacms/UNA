import { View, ScrollView } from 'app/design/view';
import { getPageWidth, appSetting } from 'app/lib/util'
import AppVersion from 'app/ui/atoms/app-version'
import { Platform } from 'react-native'
import { useScroll } from 'app/lib/hooks/use-scroll';
import { useHeaderHeight, useFooterHeight, useGetScrollValue, useInformerStripHeight } from 'app/context/jotai/layout';
import { useIsDesktop } from 'app/context/measure';
import { KbAvoidingViewScroll } from 'app/ui/atoms/kb-avoiding-view';
import { useEffect, useRef } from 'react';
import { pushFormEnsureVisibleHandler, scrollContainerByDelta } from 'app/lib/form/form-ensure-visible'
import { useCurrentUser } from 'app/context/user';
import { getNativeTabBarOverlayInset } from 'app/components/nav/tabs/tab-menu';
import { PageHeaderBand } from 'app/ui/molecules/header/page-header-parts';

const isWeb = Platform.OS === 'web';

/**
 * The page scroller (keyboard-aware on native) around a page's content.
 *
 * @param {{ children?: import('react').ReactNode, data?: any, page_width?: any, processKeyboard?: boolean, scrollRef?: any }} props
 */
export default function Page({ children, data, page_width, processKeyboard=true, scrollRef: scrollRefProp }) {
    const headerHeightFromAtom = useHeaderHeight();
    const footerHeightFromAtom = useFooterHeight();
    const Wrapper = isWeb ? View : processKeyboard? KbAvoidingViewScroll : ScrollView;
    const { onScroll } = useScroll();
    const getScrollValue = useGetScrollValue();
    const internalScrollRef = useRef(null);
    const scrollRef = scrollRefProp ?? internalScrollRef;
    // NativeTabs screens run under the tab bar; without this the page's last
    // content (e.g. Sign out on /dashboard) can't scroll clear of it.
    const { currentUser } = useCurrentUser();
    const tabBarInset = getNativeTabBarOverlayInset(currentUser);

    // The informer strip above the header (components/layout.js, layout.web.js below desktop): the apps keep all of
    // it on screen, the web what of it has not scrolled away yet.
    const isDesktop = useIsDesktop();
    const stripHeight = useInformerStripHeight();

    useEffect(() => {
        return pushFormEnsureVisibleHandler(({ windowY }) => {
            let stripAbove = stripHeight;
            if (isWeb) stripAbove = isDesktop ? 0 : Math.max(0, stripHeight - getScrollValue());
            const target = (headerHeightFromAtom || 0) + stripAbove + 16;
            const delta = windowY - target;
            if (Math.abs(delta) < 40) return;

            if (isWeb && typeof window !== 'undefined') {
                window.scrollBy({ top: delta, behavior: 'smooth' });
                return;
            }

            scrollContainerByDelta(scrollRef.current, delta, getScrollValue());
        });
    }, [headerHeightFromAtom, stripHeight, isDesktop, scrollRef, getScrollValue]);

    return (
        <Wrapper
            ref={scrollRef}
            {...(!isWeb && !processKeyboard ? { contentContainerStyle: { flexGrow: 1, paddingTop: headerHeightFromAtom, paddingBottom: tabBarInset } } : {})}
            {...(!isWeb && processKeyboard ? { paddingTop: headerHeightFromAtom, paddingBottom: tabBarInset } : {})}
            className={(page_width || getPageWidth(data?.uri, data?.config)) + ' mx-auto w-full'}
            style={isWeb ? { display: 'flex', flexDirection: 'column', minHeight: `calc(100vh - ${headerHeightFromAtom}px - ${footerHeightFromAtom}px)` } : undefined}
            keyboardShouldPersistTaps="always"
            keyboardAwareBottomOffset={Platform.OS === 'ios' ? 120 : 64}
            keyboardDismissMode="on-drag"
            onScroll={onScroll}   
        >
            {/* Native: the card band behind the page header at rest; scrolls with the page. */}
            {!isWeb && headerHeightFromAtom > 0 ? (
                <PageHeaderBand height={headerHeightFromAtom} />
            ) : null}
            {children}
            {appSetting('native', 'app_version_pages')?.includes(data?.uri) && <AppVersion />}
        </Wrapper>
    )
}
