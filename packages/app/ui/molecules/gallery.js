import { useRef, useState, useEffect } from 'react';
import { Animated, PanResponder, Dimensions, Easing } from 'react-native';
import { View } from 'app/design/view';
import { Button } from "app/design/controls";

const screenWidth = Dimensions.get('window').width;
const AUTOPLAY_DEFAULT_MS = 8000;
const PROGRESS_TRACK_WIDTH = 96;
const PROGRESS_TRACK_PADDING = 2;
const CARD_SHADOW_GUTTER = 2;


export default function Gallery({ items, autoscroll }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [nextIndex, setNextIndex] = useState(null);
    const [slideDirection, setSlideDirection] = useState(1);
    const [containerWidth, setContainerWidth] = useState(screenWidth);
    const slideTranslateX = useRef(new Animated.Value(0)).current;
    const progress = useRef(new Animated.Value(0)).current;
    const isAnimatingRef = useRef(false);
    const [isPaused, setIsPaused] = useState(false);


    const animateToIndex = (newIndex, direction) => {
        if (isAnimatingRef.current || items.length <= 1 || newIndex === currentIndex) return;
        isAnimatingRef.current = true;
        setSlideDirection(direction);
        setNextIndex(newIndex);
        slideTranslateX.setValue(direction === 1 ? 0 : -containerWidth);

        Animated.timing(slideTranslateX, {
            toValue: direction === 1 ? -containerWidth : 0,
            duration: 360,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
        }).start(({ finished }) => {
            if (finished) {
                setCurrentIndex(newIndex);
            }

            setNextIndex(null);
            slideTranslateX.setValue(0);
            isAnimatingRef.current = false;
        });
    };

    const goLeft = () => {
        const prevIndex = (currentIndex - 1 + items.length) % items.length;
        animateToIndex(prevIndex, -1);
    };

    const goRight = () => {
        const nextIndex = (currentIndex + 1) % items.length;
        animateToIndex(nextIndex, 1);
    };

// Autoscroll
useEffect(() => {
    if (!autoscroll || isPaused || items.length <= 1) return;
    
    const interval = typeof autoscroll === 'number' ? autoscroll : AUTOPLAY_DEFAULT_MS;
    const timer = setInterval(() => {
        goRight();
    }, interval);

    return () => clearInterval(timer);
}, [autoscroll, isPaused, currentIndex, items.length]);

useEffect(() => {
    if (currentIndex >= items.length && items.length > 0) {
        setCurrentIndex(0);
    }

    if (items.length <= 1) {
        progress.setValue(0);
        return;
    }

    Animated.timing(progress, {
        toValue: currentIndex,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
    }).start();
}, [currentIndex, items.length, progress]);

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gesture) =>
                Math.abs(gesture.dx) > 20,
            onPanResponderGrant: () => {
                setIsPaused(true); 
            },
            onPanResponderRelease: (_, gesture) => {
                setIsPaused(false); 
                if (isAnimatingRef.current) return;
                if (gesture.dx > 50) {
                    goLeft();
                } else if (gesture.dx < -50) {
                    goRight();
                }
            },
        })
    ).current;

    const progressWidth = Math.max(0, PROGRESS_TRACK_WIDTH - PROGRESS_TRACK_PADDING * 2);
    const progressSteps = Math.max(1, items.length);
    const pillWidth = Math.max(12, progressWidth / progressSteps);
    const travelRange = Math.max(0, progressWidth - pillWidth);
    const pillTranslateX = progress.interpolate({
        inputRange: [0, Math.max(1, items.length - 1)],
        outputRange: [0, travelRange],
        extrapolate: 'clamp',
    });
    const slideCellStyle = {
        width: containerWidth,
        flexShrink: 0,
        paddingHorizontal: CARD_SHADOW_GUTTER,
        paddingTop: CARD_SHADOW_GUTTER,
    };
    return (
        <View
            className=' w-full overflow-hidden pb-8'
            onLayout={(event) => {
                const nextWidth = event?.nativeEvent?.layout?.width;
                if (nextWidth) setContainerWidth(nextWidth);
            }}
            {...panResponder.panHandlers}
        >
            {nextIndex !== null ? (
                <Animated.View
                    
                    style={{
                        flexDirection: 'row',
                        flexWrap: 'nowrap',
                        width: containerWidth * 2,
                        transform: [{ translateX: slideTranslateX }],
                    }}
                >
                    {slideDirection === 1 ? (
                        <>
                            <View style={slideCellStyle}>
                                {items[currentIndex]}
                            </View>
                            <View style={slideCellStyle}>
                                {items[nextIndex]}
                            </View>
                        </>
                    ) : (
                        <>
                            <View style={slideCellStyle}>
                                {items[nextIndex]}
                            </View>
                            <View style={slideCellStyle}>
                                {items[currentIndex]}
                            </View>
                        </>
                    )}
                </Animated.View>
            ) : (
                <View style={slideCellStyle}>
                    {items[currentIndex]}
                </View>
            )}
            <View className='absolute bottom-0 left-1'>
                <Button variant="text" rounded size="xs" onPress={goLeft} startDecorator="ArrowLeft" />
            </View>
            {items.length > 1 && (
                <View pointerEvents='none' className='absolute bottom-1 left-0 right-0 items-center'>
                    <View
                        className='h-4 rounded-full bg-muted relative overflow-hidden'
                        style={{
                            width: PROGRESS_TRACK_WIDTH,
                        }}
                    >
                        <Animated.View
                            style={{
                                position: 'absolute',
                                left: PROGRESS_TRACK_PADDING,
                                top: 2,
                                transform: [{ translateX: pillTranslateX }],
                            }}
                        >
                            <View
                                className='h-3 rounded-full bg-card'
                                style={{ width: pillWidth }}
                            />
                        </Animated.View>
                    </View>
                </View>
            )}
            <View className='absolute bottom-0 right-1'>
                <Button variant="text" rounded size="xs" onPress={goRight} startDecorator="ArrowRight" />
            </View>
        </View>
    );
};