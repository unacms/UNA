import { View,ScrollView, Row } from 'app/design/view'
import { useState, useRef } from 'react'
import { Button } from 'app/design/controls'

export function Slider(props) {
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
                <Button variant="text" startDecorator='left'  disabled={isLeftButtonDisabled()} onPress={scrollLeft} />
            </View>
            <ScrollView className='w-72 relative items-center'>
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
            </ScrollView>
            <View className={isRightButtonDisabled() ? 'hidden' : ''}>
            <View >
                <Button variant="text" startDecorator='right' disabled={isRightButtonDisabled()} onPress={scrollRight}  /></View>
            </View>
        </Row>
    )
}