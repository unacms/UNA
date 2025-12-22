import { View, ScrollView } from 'app/design/view';
import { getPageWidth } from 'app/lib/util'
import { Platform } from 'react-native'
import { useScroll } from 'app/lib/hooks/useScroll';

export default function Page({ children, data, page_width }) {
    const isWeb = Platform.OS == 'web';
    const Wrapper = isWeb ? View : ScrollView;
    const { onScroll } = useScroll();

    return (
        <Wrapper
            className={(page_width || getPageWidth(data?.uri, data?.config)) + ' mx-auto w-full'}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="on-drag"
            onScroll={onScroll}
        >
            {children}
        </Wrapper>
    )
}