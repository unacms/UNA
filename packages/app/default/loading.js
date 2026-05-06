"use client"
import { Platform } from 'react-native'
import React, { useEffect, useRef } from 'react';
import { View } from 'app/design/view'
import { Animated } from 'react-native';
import Svg, { G, Circle } from 'react-native-svg';
import { nativeDriver } from 'app/lib/animation'

function RotatingIcon() {
    const spinValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 2000,
                useNativeDriver: nativeDriver,
            })
        );
        animation.start();
        return () => animation.stop();
    }, [spinValue]);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Svg fill="#2563eb" opacity="0.5" width="64" height="128" viewBox="0 0 24 24">
                <G>
                    <Circle cx="12" cy="3" r="1"/>
                    <Circle cx="16.50" cy="4.21" r="1"/>
                    <Circle cx="7.50" cy="4.21" r="1"/>
                    <Circle cx="19.79" cy="7.50" r="1"/>
                    <Circle cx="4.21" cy="7.50" r="1"/>
                    <Circle cx="21.00" cy="12.00" r="1"/>
                    <Circle cx="3.00" cy="12.00" r="1"/>
                    <Circle cx="19.79" cy="16.50" r="1"/>
                    <Circle cx="4.21" cy="16.50" r="1"/>
                    <Circle cx="16.50" cy="19.79" r="1"/>
                    <Circle cx="7.50" cy="19.79" r="1"/>
                    <Circle cx="12" cy="21" r="1"/>
                </G>
            </Svg>
        </Animated.View>
    );
}

export function Loading() {
    if (Platform.OS === 'web') {
        return (
            <div style={{
                width: '100px', height: '100vh', display: 'flex', margin: '0px auto', justifyContent: 'center',
            }}>
                <img src="/loader.svg" alt="Loading indicator" />
            </div>
        );
    }

    return (
        <View className='w-full h-full items-center flex-1 justify-center'>
            <RotatingIcon />
        </View>
    );
}