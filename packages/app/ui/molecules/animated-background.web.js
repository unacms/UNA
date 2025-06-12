import React, { useState, useEffect, useRef } from 'react';
import Animated, { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { View } from 'app/design/view';
import { 
    SvgBackgroundSplash, 
    SvgBackgroundSplashDark,
    SvgBackgroundCreateAccount,
    SvgBackgroundCreateAccountDark,
    SvgBackgroundLogin,
    SvgBackgroundLoginDark,
} from './backgrounds';
import { useColorScheme } from 'nativewind';

const backgrounds = {
    splash: {
        light: <SvgBackgroundSplash />,
        dark: <SvgBackgroundSplashDark />,
    },
    'create-account': {
        light: <SvgBackgroundCreateAccount />,
        dark: <SvgBackgroundCreateAccountDark />,
    },
    login: {
        light: <SvgBackgroundLogin />,
        dark: <SvgBackgroundLoginDark />,
    },
    default: {
        light: <View className="w-full h-full bg-white" />,
        dark: <View className="w-full h-full bg-black" />,
    }
};

function AnimatedBackgroundComponent({ background }) {
    const { colorScheme } = useColorScheme();
    const opacity = useSharedValue(1);
    const animationDuration = 500;

    const [currentBg, setCurrentBg] = useState(backgrounds[background]?.[colorScheme] || backgrounds.default[colorScheme]);
    const [prevBg, setPrevBg] = useState(null);
    
    const bgRef = useRef(currentBg);
    bgRef.current = currentBg;

    useEffect(() => {
        const newBg = backgrounds[background]?.[colorScheme] || backgrounds.default[colorScheme];

        if (bgRef.current && newBg.type === bgRef.current.type && JSON.stringify(newBg.props) === JSON.stringify(bgRef.current.props)) {
            return;
        }

        setPrevBg(bgRef.current);
        setCurrentBg(newBg);
        
        opacity.value = 0;
        opacity.value = withTiming(1, { duration: animationDuration });
        
        const timer = setTimeout(() => {
            setPrevBg(null);
        }, animationDuration);
        
        return () => clearTimeout(timer);

    }, [background, colorScheme]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }), [opacity]);

    return (
        <>
            {prevBg && (
                <View style={{ position: 'fixed', width: '100vw', height: '100vh', top: 0, left: 0, zIndex: -1 }}>
                    {prevBg}
                </View>
            )}
            {currentBg && (
                <Animated.View style={[{ position: 'fixed', width: '100vw', height: '100vh', top: 0, left: 0, zIndex: -1 }, animatedStyle]}>
                    {currentBg}
                </Animated.View>
            )}
        </>
    );
}

export default AnimatedBackgroundComponent; 