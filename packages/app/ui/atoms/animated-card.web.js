import React, { useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { appSetting } from 'app/lib/util';

function AnimatedCard({ children }) {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(-50);

    const animationDuration = appSetting('layout', 'card_animation_duration') || 350;

    useEffect(() => {
        opacity.value = withTiming(1, { duration: animationDuration });
        translateY.value = withSpring(0, {
            damping: 9,
            stiffness: 70,
        });
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: `${opacity.value}`,
            transform: [{ translateY: translateY.value }],
        };
    }, [opacity, translateY]);

    if (animationDuration === 0) {
        return <>{children}</>;
    }

    return <Animated.View style={animatedStyle}>{children}</Animated.View>;
};

export default React.memo(AnimatedCard); 