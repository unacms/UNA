import { View, ScrollView } from 'app/design/view';
import { getPageWidth } from 'app/lib/util'
import { Platform } from 'react-native'
import { useScroll } from 'app/lib/hooks/use-scroll';
import { useHeaderHeight, useFooterHeight, useGetScrollValue } from 'app/context/jotai/layout';
import { KbAvoidingViewScroll } from 'app/ui/atoms/kb-avoiding-view';
import { useEffect, useRef } from 'react';
import { pushFormEnsureVisibleHandler, scrollContainerByDelta } from 'app/lib/form/form-ensure-visible'
import { useCurrentUser } from 'app/context/user';
import { getNativeTabBarOverlayInset } from 'app/components/nav/tabs/tab-menu';

const isWeb = Platform.OS === 'web';

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

    useEffect(() => {
        return pushFormEnsureVisibleHandler(({ windowY }) => {
            const target = (headerHeightFromAtom || 0) + 16;
            const delta = windowY - target;
            if (Math.abs(delta) < 40) return;

            if (isWeb && typeof window !== 'undefined') {
                window.scrollBy({ top: delta, behavior: 'smooth' });
                return;
            }

            scrollContainerByDelta(scrollRef.current, delta, getScrollValue());
        });
    }, [headerHeightFromAtom, scrollRef, getScrollValue]);

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
            {children}
        </Wrapper>
    )
}
