'use client';
import { useState, useRef, useEffect } from 'react';
import { Text } from 'app/design/typography';
import { View } from 'app/design/view';
import { appSetting } from 'app/lib/util';

export default function Tooltip({children, content, enabled = true}) {
    const tooltipsEnabled = appSetting('layout', 'tooltips');
    const shouldRenderTooltip = !!enabled && !!tooltipsEnabled;

    const [visible, setVisible] = useState(false);
    const [tooltipStyle, setTooltipStyle] = useState({});
    const tooltipRef = useRef(null);
    const wrapperRef = useRef(null);
    const timeoutRef = useRef(null);

    const eventHandlers = {
        onMouseEnter: () => {
            timeoutRef.current = setTimeout(() => {
                setVisible(true);
            }, 600); // 500ms delay
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
        if (!shouldRenderTooltip) {
            setVisible(false);
            return;
        }

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
    }, [visible, shouldRenderTooltip]);

    if (!shouldRenderTooltip) {
        return children;
    }

    return (
        <View
            {...eventHandlers}
            className="relative"
            ref={wrapperRef}
        >
            {children}
            {visible && (
                <View
                    ref={tooltipRef}
                    className="absolute z-50 shadow-lg top-full w-auto backdrop-blur bg-popover/90 rounded-full py-1.5 px-3 mt-2.5"
                    style={tooltipStyle}
                >
                    <Text className="text-card-foreground whitespace-nowrap text-sm">{content}</Text>
                </View>
            )}
        </View>
    );
}