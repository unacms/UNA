import React, { useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, withDelay } from 'react-native-reanimated';
import { appSetting } from 'app/lib/util';
import { cssInterop } from 'nativewind';

cssInterop(Animated.View, { className: 'style' });

function AnimatedView({ children, direction = 'down', className, delay = 0 }) {
    const opacity = useSharedValue(0);
    const initialY = direction === 'up' ? 20 : -20;
    const translateY = useSharedValue(initialY);

    const animationDuration = appSetting('layout', 'card_animation_duration') || 200;

    useEffect(() => {
        opacity.value = withDelay(delay, withTiming(1, { duration: animationDuration }));
        translateY.value = withDelay(delay, withSpring(0, {
            damping: 8,
            stiffness: 40,
        }));
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: `${opacity.value}`,
            transform: [{ translateY: translateY.value }],
        };
    }, [opacity, translateY]);

    if (animationDuration === 0) {
        return <Animated.View className={className}>{children}</Animated.View>;
    }

    return <Animated.View style={animatedStyle} className={className}>{children}</Animated.View>;
};

export default React.memo(AnimatedView); 