import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Row, Pressable, ScrollView } from 'app/design/view'
import { Button, Modal } from 'app/design/controls'
import { Text } from 'app/design/typography'

export default function ScrollControl({ horisontal, children, step, initialValue, leftButton, rightButton, title }) {
    // Используем ref для доступа к ScrollView
    const scrollViewRef = useRef(null);
    const [offset, setOffset] = useState({ offset: 0, contentWidth: 0, scrollViewWidth: 0 });

    useEffect(() => {
        if (scrollViewRef.current) {
            if (initialValue > 0) {
                scrollViewRef.current.scrollTo({
                    x: initialValue,
                    animated: true,
                });
            }
            else {
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
            {title && <Row className='w-full justify-between items-center'><Text>{title}</Text><Row className="gap-x-2">
                <Button disabled={offset.offset == 0} startDecorator="ChevronLeft" variant="outline" size="sm" rounded onPress={scrollUp} />
                <Button disabled={!(offset.offset + offset.scrollViewWidth < offset.contentWidth)} size="sm" startDecorator="ChevronRight" variant="outline" rounded onPress={scrollDown} />
            </Row></Row>}
            <ScrollView ref={scrollViewRef} horizontal={true}
                onScroll={handleScroll}
                scrollEventThrottle={32}
                showsHorizontalScrollIndicator={false}

            >
                {children}
            </ScrollView>
            {(!title && offset.offset > 0) && (
                <View className="absolute w-12 h-full bg-gradient-to-r to-transparent from-card/50 px-1 justify-center duration-500">
                    {leftButton ? <Pressable onPress={scrollUp}>{leftButton}</Pressable> : <Button startDecorator="ChevronLeft" variant="default" rounded onPress={scrollUp} />}
                </View>)
            }
            {(!title && offset.offset + offset.scrollViewWidth < offset.contentWidth) && (
                <View className="absolute w-12 right-0 h-full bg-gradient-to-l to-transparent from-card/50 px-1 justify-center duration-500 items-end">
                    {rightButton ? <Pressable onPress={scrollDown}>{rightButton}</Pressable> : <Button startDecorator="ChevronRight" variant="default" rounded onPress={scrollDown} />}
                </View>)}
        </View>
    );
};

