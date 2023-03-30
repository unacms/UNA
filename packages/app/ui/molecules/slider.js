import { View,ScrollView, Row, TouchableOpacity } from 'app/design/view'
import { useState, useRef } from 'react'
import { Button } from 'app/design/controls'

export function Slider(props) {
    const [scrollOffset, setScrollOffset] = useState({ x: 0, y: 0 });
    const [contentWidth, setContentWidth] = useState(0);
    const [scrollViewWidth, setScrollViewWidth] = useState(0);

    const scrollViewRef = useRef();

    const scrollLeft = () => {
        console.log('7878',scrollViewRef.current.contentOffset)
        scrollViewRef.current.scrollTo({ x: scrollOffset.x - props.offset, y: 0, animated: true });
    };

    const scrollRight = () => {
        console.log('7878',scrollViewRef.current.contentOffset)
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
            <Button variant="text" startDecorator='arrow-left' disabled={isLeftButtonDisabled()} onPress={scrollLeft} />
            <ScrollView className='w-72 relative '>
                <View className='absolute left-0 top-0 h-full w-32  bg-gradient-to-r from-white  z-50'></View>
                <View className='absolute right-0 top-0 h-full w-32   bg-gradient-to-l from-white z-50'></View>
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
            <Button variant="text" startDecorator='arrow-right' disabled={isRightButtonDisabled()} onPress={scrollRight}/>
        </Row>
    )
}