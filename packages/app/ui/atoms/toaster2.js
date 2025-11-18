import { Platform } from 'react-native'
import { Button } from 'app/design/controls'
import { View } from 'app/design/view';
import Animated, { useSharedValue, withTiming, useAnimatedStyle, Easing, withSequence } from "react-native-reanimated";
import { useEffect, useState, } from 'react';

export default function Toaster({ isVisible, title, size, onPress }) {

    const sharedValue = useSharedValue(50);

    const isWeb = Platform.OS === 'web';
    const sClassName = isWeb ? ' fixed bottom-16 left-0 mb-2 w-full items-center z-100' : 'absolute top-24 w-full items-center z-50';
    const sClassName2 = isWeb ? 'items-center rounded-full shadow-xl mx-auto ' : 'w-1/2 items-center';

    const indicatorStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: sharedValue.value }],
        };
    }, [sharedValue]);

    useEffect(() => {
        sharedValue.value = withSequence(
            withTiming(isVisible ? 0 : -50, { duration: 300 }),
        );
    }, []);


    return (
        <View className={sClassName}>
            <Animated.View className={isWeb ? "w-full" : ""} style={indicatorStyle} >
                <View margin="" rounded=' rounded-xl ' addClassName="max-w-screen-lg w-auto p-3 sm:p-4 w-full " className={sClassName2}>
                    <Button variant="primary" title={title} size={size} rounded onPress={onPress} />
                </View>
            </Animated.View>
        </View>
    );
};

