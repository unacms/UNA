import { useRef, useState, useEffect } from 'react';
import { useAnimatedValue } from 'app/lib/hooks/use-animated-value';
import { Animated, PanResponder, Dimensions } from 'react-native';
import { View } from 'app/design/view';
import { Button } from "app/design/controls";
import { nativeDriver } from 'app/lib/platform/animation';

const screenWidth = Dimensions.get('window').width;


export default function Gallery({ items, autoscroll }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const position = useAnimatedValue(0);
    const opacity = useAnimatedValue(1);
    const [isPaused, setIsPaused] = useState(false);


    const animateToIndex = (newIndex, direction) => {
        Animated.parallel([
            Animated.timing(position, {
                toValue: direction * -screenWidth,
                duration: 200,
                useNativeDriver: nativeDriver,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: nativeDriver,
            }),
        ]).start(() => {
            setCurrentIndex(newIndex);
            position.setValue(direction * screenWidth);
            Animated.parallel([
                Animated.timing(position, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: nativeDriver,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: nativeDriver,
                }),
            ]).start();
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

// Auto-scroll
useEffect(() => {
    if (!autoscroll || isPaused || items.length <= 1) return;
    
    const interval = typeof autoscroll === 'number' ? autoscroll : 3000;
    const timer = setInterval(() => {
        goRight();
    }, interval);

    return () => clearInterval(timer);
}, [autoscroll, isPaused, currentIndex, items.length]);

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gesture) =>
                Math.abs(gesture.dx) > 20,
            onPanResponderGrant: () => {
                setIsPaused(true); 
            },
            onPanResponderRelease: (_, gesture) => {
                setIsPaused(false); 
                if (gesture.dx > 50) {
                    goLeft();
                } else if (gesture.dx < -50) {
                    goRight();
                }
            },
        })
    ).current;

    return (
        <View className=' w-full overflow-hidden py-2 px-0.5 -my-2 ' {...panResponder.panHandlers}>
            <Animated.View className='flex-1 p-8' style={{ transform: [{ translateX: position }], opacity }}>
                {items[currentIndex]}
            </Animated.View>
            <View className='absolute top-1/4 left-2'>
                <Button variant="secondary" rounded size="xs" onPress={goLeft} startDecorator="ArrowLeft" />
            </View>
            <View className='absolute top-1/4 right-2'>
                <Button variant="secondary" rounded size="xs" onPress={goRight} startDecorator="ArrowRight" />
            </View>
        </View>
    );
};