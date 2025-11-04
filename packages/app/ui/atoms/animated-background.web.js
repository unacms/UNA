import { useState, useEffect, useRef } from 'react';
import Animated, { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { View } from 'app/design/view';
import { ThemeName } from 'app/design/theme';
import { callFn } from 'app/lib/functions/call';
import { usePathname } from 'app/lib/hooks/router';
import { useCurrentUser } from 'app/context/user';

const backgrounds = callFn("getBackgrounds", []);   

function AnimatedBackgroundComponent({ }) {
    const theme = ThemeName();
    const opacity = useSharedValue(1);
    const animationDuration = 500;
    const pathname = usePathname();
    const { currentUser } = useCurrentUser();
    const background = callFn("getBackground", [pathname, currentUser]);   


    const [currentBg, setCurrentBg] = useState(backgrounds[background]?.[theme] || backgrounds.default[theme]);
    const [prevBg, setPrevBg] = useState(null);
    
    const bgRef = useRef(currentBg);
    bgRef.current = currentBg;

    useEffect(() => {
        const newBg = backgrounds[background]?.[theme] || backgrounds.default[theme];

        /*if (bgRef.current && newBg.type === bgRef.current.type && JSON.stringify(newBg.props) === JSON.stringify(bgRef.current.props)) {
            return;
        }
*/
        setPrevBg(bgRef.current);
        setCurrentBg(newBg);
        
        opacity.value = 0;
        opacity.value = withTiming(1, { duration: animationDuration });
        
        const timer = setTimeout(() => {
            setPrevBg(null);
        }, animationDuration);
        
        return () => clearTimeout(timer);

    }, [background, theme]);

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