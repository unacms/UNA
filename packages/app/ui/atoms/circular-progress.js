import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Row, Pressable, ScrollView } from 'app/design/view'
import { Button, Modal } from 'app/design/controls'
import Svg, { Circle } from 'react-native-svg';
import { Text, H1C } from 'app/design/typography'

export default function CircularProgress({ percentage, strokeWidth=10, bgColor="#e6e6e6", progressColor="#ff6347", classes="" }) {
    const radius = 50;
    const circumference = 2 * Math.PI * radius; 
    const progress = (percentage / 100) * circumference; 
    const unit = 60
    const unit2 = unit * 2
    return (
        <View className={`items-center justify-center ${classes}`}>
            <Svg height={unit2} width={unit2} viewBox={`0 0 ${unit2} ${unit2}`}>
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
                    rotation="-90"
                    origin={`${unit} ${unit}`}
                />
            </Svg>
            <Text className="absolute">{`${percentage}%`}</Text>
        </View>
    );
};

