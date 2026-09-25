import React from 'react';
import type { ColorValue } from 'react-native';
import { View } from 'app/design/view';
import Svg, { Circle } from 'react-native-svg';
import { Text } from 'app/design/typography';

type CircularProgressProps = {
    percentage: number;
    strokeWidth?: number;
    bgColor?: ColorValue;
    progressColor?: ColorValue;
    classes?: string;
    /** Rendered width/height in px; stroke scales with it. */
    size?: number;
    textClassName?: string;
};

export default function CircularProgress({ percentage, strokeWidth=10, bgColor="#e6e6e6", progressColor="#ff6347", classes="", size, textClassName="" }: CircularProgressProps) {
    const radius = 50;
    const circumference = 2 * Math.PI * radius; 
    const progress = (percentage / 100) * circumference; 
    const unit = 60
    const unit2 = unit * 2
    const px = size ?? unit2
    return (
        <View className={`items-center justify-center ${classes}`}>
            {/* Rotate the wrapper, not the Circle: `rotation`/`origin` leak an invalid `transform-origin` DOM attribute on web. */}
            <View className="-rotate-90">
            <Svg height={px} width={px} viewBox={`0 0 ${unit2} ${unit2}`}>
                <Circle
                    cx={unit}
                    cy={unit}
                    r={radius}
                    stroke={bgColor} 
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                <Circle
                    cx={unit}
                    cy={unit}
                    r={radius}
                    stroke={progressColor} 
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${progress}, ${circumference}`} 
                    fill="none"
                    strokeLinecap="round"
                />
            </Svg>
            </View>
            <Text className={`absolute ${textClassName}`}>{`${percentage}%`}</Text>
        </View>
    );
};
