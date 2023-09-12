import { View } from 'app/design/view'
import Animated, { Easing, useSharedValue, useAnimatedStyle, withSpring, withTiming, interpolate } from 'react-native-reanimated';

export default function (props) {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(-50); // start position
    // Start the animations
    opacity.value = withTiming(1, { duration: 500 });

    translateY.value = withSpring(0);

    const animatedStyles = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
            transform: [
                {
                    translateY: translateY.value
                }
            ]
        };
    },[opacity, translateY]);

 	return (
        <Animated.View style={[animatedStyles]} className="max-w-5xl w-full mx-auto ">	
            {props.children}
        </Animated.View>
    );
} 
