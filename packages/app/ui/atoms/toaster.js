import { Platform } from 'react-native'
import { Button } from 'app/design/controls'
import { View } from 'app/design/view';
import Animated, { useSharedValue, withTiming, useAnimatedStyle, Easing, withSequence } from "react-native-reanimated";
import { useEffect, useState, useImperativeHandle, forwardRef } from 'react';

const ElementToster = forwardRef((props, ref) => {
    const [isVisible, setIsVisible] = useState(false);
    const sharedValue = useSharedValue(50); 

    const isWeb = Platform.OS === 'web';
    const sClassName = isWeb ? ' fixed bottom-32 left-0 w-full items-center z-50' : 'absolute bottom-12 w-full items-center z-50';
    const sClassName2 = isWeb ? 'items-center' : 'w-1/2 items-center';
        
    const indicatorStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: sharedValue.value }],
            opaopacity: sharedValue.value == 25 ? 1 : 0
        };
    },[sharedValue]);

    useEffect(() => {
        sharedValue.value = withSequence(
            withTiming(isVisible ? 25 : -50, { duration: 300 }), // fade out
          );
    }, [isVisible]);

    useImperativeHandle(ref, () => ({
        
        setVisible: (visible) => setIsVisible(visible),
    }));
    console.log("isVisible", isVisible)
    return (
        <View style={{ display: isVisible ? 'flex' : 'none' }} className={sClassName}>
            <Animated.View style={indicatorStyle} >
                <View className={sClassName2}>
                    <Button variant="primary" title={props.title} size={props.size} rounded onPress={props.onPress} />
                </View>
            </Animated.View>
        </View>
    );
});

export default ElementToster;
