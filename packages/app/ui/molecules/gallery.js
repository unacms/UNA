import { useRef, useState, useEffect } from 'react';
import { Animated, PanResponder, Dimensions } from 'react-native';
import { View } from 'app/design/view';
import { Button } from "app/design/controls";

const screenWidth = Dimensions.get('window').width;


export default function Gallery({ items, autoscroll }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const position = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(1)).current;
    const [isPaused, setIsPaused] = useState(false);


    const animateToIndex = (newIndex, direction) => {
        Animated.parallel([
            Animated.timing(position, {
                toValue: direction * -screenWidth,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setCurrentIndex(newIndex);
            position.setValue(direction * screenWidth);
            Animated.parallel([
                Animated.timing(position, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
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

// Автоскролл
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
        <View className=' w-full overflow-hidden' {...panResponder.panHandlers}>
            <Animated.View className='w-full' style={{ transform: [{ translateX: position }], opacity }}>
                {items[currentIndex]}
            </Animated.View>
            <View className='absolute top-[calc(50%)] left-3'>
                <Button variant="secondary" rounded size="base" onPress={goLeft} startDecorator="ArrowLeft" />
            </View>
            <View className='absolute top-[calc(50%)] right-3'>
                <Button variant="secondary" rounded size="base" onPress={goRight} startDecorator="ArrowRight" />
            </View>
        </View>
    );
};