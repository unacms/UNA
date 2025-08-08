import { useRef, useState } from 'react';
import { Animated, PanResponder, Dimensions } from 'react-native';
import { View } from 'app/design/view';
import { Button } from "app/design/controls";

const screenWidth = Dimensions.get('window').width;

const SliderControls = ({ items }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const position = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(1)).current;

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

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gesture) =>
                Math.abs(gesture.dx) > 20,
            onPanResponderRelease: (_, gesture) => {
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
            <View className='absolute top-1/4 left-2'>
                <Button variant="outline" rounded size="base" onPress={goLeft} startDecorator="ArrowLeft" />
            </View>
            <View className='absolute top-1/4 right-2'>
                <Button variant="outline" rounded size="base" onPress={goRight} startDecorator="ArrowRight" />
            </View>
        </View>
    );
};

export default SliderControls;