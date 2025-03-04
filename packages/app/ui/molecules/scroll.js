import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Row, Pressable, ScrollView } from 'app/design/view'
import { Button, Modal } from 'app/design/controls'

export default function ScrollControl({ horisontal, children, step, initialValue, leftButton, rightButton }) {
    // Используем ref для доступа к ScrollView
    const scrollViewRef = useRef(null);
    const [offset, setOffset] = useState({offset: 0, contentWidth:0, scrollViewWidth:0});

    useEffect(() => {
        if (scrollViewRef.current){
            if (initialValue > 0) {
                scrollViewRef.current.scrollTo({
                    x: initialValue,
                    animated: true,
                });
            }
            else{
                scrollViewRef.current.scrollTo({
                    x: 1,
                    animated: false,
                });
    
                scrollViewRef.current.scrollTo({
                    x: 0,
                    animated: false,
                });
            }
        }
    }, []);

    const handleScroll = (event) => {

        const offsetX = event.nativeEvent.contentOffset.x;
        const contentWidth = event.nativeEvent.contentSize.width;
        const scrollViewWidth = event.nativeEvent.layoutMeasurement.width;
        setOffset(prevOffset => {
            if (prevOffset.offset !== offsetX || prevOffset.contentWidth !== contentWidth || prevOffset.scrollViewWidth !== scrollViewWidth) {
                return { offset: offsetX, contentWidth, scrollViewWidth };
            }
            return prevOffset;
        });
    };

    const scrollUp = useCallback(() => {
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({
                x: Math.max(0, offset.offset - step),
                animated: true,
            });
        }
    }, [offset.offset, step]);

    const scrollDown = useCallback(() => {
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({
                x: Math.min(offset.offset + step, offset.contentWidth - offset.scrollViewWidth),
                animated: true,
            });
        }
    }, [offset.offset, offset.contentWidth, offset.scrollViewWidth, step]);

    return (
        <View className='w-full'>
            <ScrollView ref={scrollViewRef} horizontal={true}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                showsHorizontalScrollIndicator={false}
               
            >
                {children}
            </ScrollView>
            {(offset.offset > 0) && (
                <View className="absolute w-24 h-full bg-gradient-to-r to-transparent from-bgrbody px-1 justify-center">
                    {leftButton ? <Pressable onPress={scrollUp}>{leftButton}</Pressable> : <Button startDecorator="ChevronLeft" variant="outline" rounded onPress={scrollUp} />}
                </View>)
            }
            {(offset.offset + offset.scrollViewWidth < offset.contentWidth) && (
                <View className="absolute w-24 right-0 h-full bg-gradient-to-l to-transparent from-bgrbody px-1 justify-center items-end">
                        {rightButton ? <Pressable onPress={scrollDown}>{rightButton}</Pressable> : <Button startDecorator="ChevronRight" variant="outline" rounded onPress={scrollDown} />}
                </View>) }
        </View>
    );
};

