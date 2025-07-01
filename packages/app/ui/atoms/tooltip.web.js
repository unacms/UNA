'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Text } from 'app/design/typography';
import { View, ViewRef } from 'app/design/view';
import { appSetting } from 'app/lib/util';

export default function Tooltip({children, content}) {
    const [visible, setVisible] = useState(false);
    const [tooltipStyle, setTooltipStyle] = useState({});
    const tooltipRef = useRef(null);
    const wrapperRef = useRef(null);
    const timeoutRef = useRef(null);

    const eventHandlers = {
        onMouseEnter: () => {
            timeoutRef.current = setTimeout(() => {
                setVisible(true);
            }, 500); // 500ms delay
        },
        onMouseLeave: () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            setVisible(false);
        },
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

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
        return children;
    }

    return (
        <ViewRef
            {...eventHandlers}
            className="relative"
            ref={wrapperRef}
        >
            {children}
            {visible && (
                <ViewRef
                    ref={tooltipRef}
                    className="absolute z-50 shadow top-full w-auto backdrop-blur bg-black/60 dark:bg-white/60 rounded-full py-2 px-4 mt-2.5"
                    style={tooltipStyle}
                >
                    <Text className="text-neutral-100 dark:text-neutral-900 whitespace-nowrap">{content}</Text>
                </ViewRef>
            )}
        </ViewRef>
    );
}