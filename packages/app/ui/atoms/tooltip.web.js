'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Text } from 'app/design/typography';
import { View } from 'app/design/view';
import { appSetting } from 'app/lib/util';

export default function Tooltip(props) {
    const [visible, setVisible] = useState(false);
    const [tooltipStyle, setTooltipStyle] = useState({});
    const tooltipRef = useRef(null);
    const wrapperRef = useRef(null);

    const eventHandlers = {
        onMouseEnter: () => setVisible(true),
        onMouseLeave: () => setVisible(false),
    };

    useEffect(() => {
        if (visible && tooltipRef.current && wrapperRef.current) {
            const tooltipElement = tooltipRef.current.getBoundingClientRect();
            const wrapperElement = wrapperRef.current.getBoundingClientRect();
            const screenWidth = window.innerWidth;

            let newStyles = {};

            const tooltipWidth = tooltipElement.width;
            const wrapperWidth = wrapperElement.width;
            const centerOffset = (wrapperWidth - tooltipWidth) / 2;

            newStyles.left = centerOffset + 'px';

            if (tooltipElement.right > screenWidth) {
                newStyles.left = screenWidth - tooltipElement.right + centerOffset + 'px';
            }

            if (tooltipElement.left < 0) {
                newStyles.left = Math.abs(tooltipElement.left) + centerOffset + 'px';
            }

            setTooltipStyle(newStyles);
        }
    }, [visible]);

    if (!appSetting('layout', 'tooltips')) {
        return props.children;
    }

    return (
        <View
            {...eventHandlers}
            className="relative"
            ref={wrapperRef}
        >
            {props.children}
            {visible && (
                <View
                    ref={tooltipRef}
                    className="absolute top-full w-auto bg-green-500 rounded-full p-2 mt-2"
                    style={tooltipStyle}
                >
                    <Text className="text-red-500 whitespace-nowrap">{props.content}</Text>
                </View>
            )}
        </View>
    );
}