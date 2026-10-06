import { View,ScrollView, Row } from 'app/design/view'
import { useState, useRef } from 'react'
import { NeoButton } from 'app/design/controls'
import { useTranslation } from 'react-i18next'

export function Slider(props) {
    const { t } = useTranslation();
    const [scrollOffset, setScrollOffset] = useState({ x: 0, y: 0 });
    const [contentWidth, setContentWidth] = useState(0);
    const [scrollViewWidth, setScrollViewWidth] = useState(0);

    const scrollViewRef = useRef();

    const scrollLeft = () => {
        scrollViewRef.current.scrollTo({ x: scrollOffset.x - props.offset, y: 0, animated: true });
    };

    const scrollRight = () => {
        scrollViewRef.current.scrollTo({ x: scrollOffset.x + props.offset, y: 0, animated: true });
    }

    const isRightButtonDisabled = () => {
        return scrollOffset.x + scrollViewWidth >= contentWidth;
    };

    const isLeftButtonDisabled = () => {
        return scrollOffset.x == 0;
    };

    const handleScroll = (event) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const offsetY = event.nativeEvent.contentOffset.y;
        setScrollOffset({ x: offsetX, y: offsetY });
    };

    return (
        <Row className="w-full">
            <View className={isLeftButtonDisabled() ? 'hidden' : ''}>
                <NeoButton style="borderless" image="ArrowLeft" accessibilityLabel={t('Scroll left')} disabled={isLeftButtonDisabled()} onPress={scrollLeft} />
            </View>
            <View className='w-80 relative items-center'>
                <ScrollView onScroll={handleScroll} ref={scrollViewRef} className='relative w-full' contentContainerStyle={{paddingHorizontal: 8}}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    onLayout={(event) =>
                        setScrollViewWidth(event.nativeEvent.layout.width)
                    }
                    onContentSizeChange={(width, height) => setContentWidth(width)}
                >
                    {props.children}
                </ScrollView>
            </View>
            <View className={isRightButtonDisabled() ? 'hidden' : ''}>
            <View >
                <NeoButton style="borderless" image="ArrowRight" accessibilityLabel={t('Scroll right')} disabled={isRightButtonDisabled()} onPress={scrollRight} /></View>
            </View>
        </Row>
    )
}