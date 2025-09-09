import React from 'react';
import { useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { appSetting } from 'app/lib/util';

const AnimatedContainer = (props) => {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(-50); // start position
    const animationDuration = appSetting('layout', 'card_animation_duration');

    if (animationDuration  == 0){
        return (
            props.children
        );
    }

    useEffect(() => {
        // Start the animations
        opacity.value = withTiming(1, { duration: animationDuration });
        translateY.value = withSpring(0);
    }, []); // <-- Empty dependency array ensures this runs only once on mount

    const animatedStyles = useAnimatedStyle(() => {
        return {
            opacity: `${opacity.value}`,
            transform: [
                {
                    translateY: translateY.value
                }
            ]
        };
    },[opacity, translateY]);
    
    return (
        <Animated.View style={[animatedStyles]} className={appSetting('layout', 'max_width_content') + ' w-full mx-auto'}>
            {props.children}
        </Animated.View>
    );
} 

export default React.memo(AnimatedContainer);