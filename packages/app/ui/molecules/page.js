import { View, ScrollView } from 'app/design/view';
import { getPageWidth } from 'app/lib/util'
import { Platform } from 'react-native'
import { useScroll } from 'app/lib/hooks/useScroll';
import { useHeaderHeight, useFooterHeight, useSetHeader, useScrollValue, defaultHeader } from 'app/context/jotai/layout';
import { KbAvoidingViewScroll } from 'app/ui/atoms/kb-avoiding-view';
import { useCallback, useEffect, useRef } from 'react';
import { useFocusEffect }  from 'app/lib/hooks/router'
import { pushFormEnsureVisibleHandler, scrollContainerByDelta } from 'app/lib/form-ensure-visible'

const isWeb = Platform.OS === 'web';

export default function Page({ children, data, page_width, processKeyboard=true, scrollRef: scrollRefProp }) {
    const headerHeightFromAtom = useHeaderHeight();
    const footerHeightFromAtom = useFooterHeight();
    const Wrapper = isWeb ? View : processKeyboard? KbAvoidingViewScroll : ScrollView;
    const { onScroll } = useScroll();
    const setHeader = useSetHeader();
    const internalScrollRef = useRef(null);
    const scrollRef = scrollRefProp ?? internalScrollRef;
    const scrollY = useScrollValue();
    const scrollYRef = useRef(scrollY);
    scrollYRef.current = scrollY;

    useFocusEffect(
        useCallback(() => {
            setHeader(defaultHeader);
        }, [])
    );

    useEffect(() => {
        return pushFormEnsureVisibleHandler(({ windowY }) => {
            const target = (headerHeightFromAtom || 0) + 16;
            const delta = windowY - target;
            if (Math.abs(delta) < 40) return;

            if (isWeb && typeof window !== 'undefined') {
                window.scrollBy({ top: delta, behavior: 'smooth' });
                return;
            }

            scrollContainerByDelta(scrollRef.current, delta, scrollYRef.current);
        });
    }, [headerHeightFromAtom, scrollRef]);

    return (
        <Wrapper
            ref={scrollRef}
            {...(!isWeb && !processKeyboard ? { contentContainerStyle: { flexGrow: 1, paddingTop: headerHeightFromAtom } } : {})}
            {...(!isWeb && processKeyboard ? { paddingTop: headerHeightFromAtom } : {})}
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
