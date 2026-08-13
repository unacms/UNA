'use client';
import { useState, useRef, useEffect } from 'react';
import { Text } from 'app/design/typography';
import { View } from 'app/design/view';
import { appSetting } from 'app/lib/util';

const CLIP_PAD = 8;

function getClipRect(el) {
    let left = 0;
    let right = typeof window !== 'undefined' ? window.innerWidth : 0;
    let node = el?.parentElement;
    while (node && node !== document.body) {
        const style = window.getComputedStyle(node);
        const overflowX = style.overflowX || style.overflow;
        if (overflowX === 'hidden' || overflowX === 'auto' || overflowX === 'scroll' || overflowX === 'clip') {
            const rect = node.getBoundingClientRect();
            left = Math.max(left, rect.left);
            right = Math.min(right, rect.right);
        }
        node = node.parentElement;
    }
    return { left, right };
}

export default function Tooltip({ children, content, enabled = true, side = 'bottom' }) {
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

        if (!visible) {
            setTooltipStyle({});
            return;
        }

        if (tooltipRef.current && wrapperRef.current) {
            const tooltipRect = tooltipRef.current.getBoundingClientRect();
            const wrapperRect = wrapperRef.current.getBoundingClientRect();
            const clip = getClipRect(wrapperRef.current);

            const minLeft = (clip.left + CLIP_PAD) - wrapperRect.left;
            const maxLeft = (clip.right - CLIP_PAD) - tooltipRect.width - wrapperRect.left;
            let left = (wrapperRect.width - tooltipRect.width) / 2;
            if (maxLeft >= minLeft) {
                left = Math.min(Math.max(left, minLeft), maxLeft);
            } else {
                left = minLeft;
            }

            setTooltipStyle({ left });
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
                    className={`absolute z-50 shadow-lg w-auto backdrop-blur bg-popover/90 rounded-full py-1.5 px-3 ${side === 'top' ? 'bottom-full mb-2.5' : 'top-full mt-2.5'}`}
                    style={tooltipStyle}
                >
                    <Text className="text-card-foreground whitespace-nowrap text-sm">{content}</Text>
                </View>
            )}
        </View>
    );
}