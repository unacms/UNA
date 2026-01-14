import { View, ScrollView } from 'app/design/view';
import { getPageWidth } from 'app/lib/util'
import { Platform } from 'react-native'
import { useScroll } from 'app/lib/hooks/useScroll';
import { useHeaderHeight, useSetHeader, defaultHeader } from 'app/context/jotai/layout';
import { KbAvoidingViewScroll } from 'app/ui/atoms/kb-avoiding-view';
import { useCallback } from 'react';
import { useFocusEffect }  from 'app/lib/hooks/router'

export default function Page({ children, data, page_width, processKeyboard=true }) {
    const headerHeightFromAtom = useHeaderHeight();
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
            {...(!isWeb && !processKeyboard ? { contentContainerStyle: { paddingTop: headerHeightFromAtom } } : {})}
            {...(!isWeb && processKeyboard ? { paddingTop: headerHeightFromAtom } : {})}
            className={(page_width || getPageWidth(data?.uri, data?.config)) + ' mx-auto w-full'}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="on-drag"
            onScroll={onScroll}   
        >
            {children}
        </Wrapper>
    )
}