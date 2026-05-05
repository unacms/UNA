import { View, ScrollView } from 'app/design/view';
import { getPageWidth } from 'app/lib/util'
import { Platform } from 'react-native'
import { useScroll } from 'app/lib/hooks/useScroll';
import { useHeaderHeight, useFooterHeight, useSetHeader, defaultHeader } from 'app/context/jotai/layout';
import { KbAvoidingViewScroll } from 'app/ui/atoms/kb-avoiding-view';
import { useCallback } from 'react';
import { useFocusEffect }  from 'app/lib/hooks/router'

export default function Page({ children, data, page_width, processKeyboard=true }) {
    const headerHeightFromAtom = useHeaderHeight();
    const footerHeightFromAtom = useFooterHeight();
    const isWeb = Platform.OS == 'web';
    const Wrapper = isWeb ? View : processKeyboard? KbAvoidingViewScroll : ScrollView;
    const { onScroll } = useScroll();
    const setHeader = useSetHeader();


    useFocusEffect(
        useCallback(() => {
            setHeader(defaultHeader);
        }, [])
    );

    return (
        <Wrapper
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