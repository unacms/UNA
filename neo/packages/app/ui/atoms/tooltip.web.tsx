'use client';
import { useState, useRef, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Text } from 'app/design/typography';
import { View } from 'app/design/view';
import { appSetting } from 'app/lib/util';
import type { View as RNView, ViewStyle } from 'react-native';

// react-native-web renders View as a DOM node, so the ref is both.
type WebViewRef = RNView & HTMLDivElement;

const CLIP_PAD = 8;
const GAP = 10;

type TooltipStyle = {
    position: 'fixed';
    top: number;
    left: number;
    visibility?: 'hidden';
};

type TooltipProps = {
    children?: ReactNode;
    content?: ReactNode;
    enabled?: boolean;
    side?: 'top' | 'bottom';
};

const HIDDEN_STYLE: TooltipStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    visibility: 'hidden',
};

export default function Tooltip({ children, content, enabled = true, side = 'bottom' }: TooltipProps) {
    const tooltipsEnabled = appSetting('layout', 'tooltips');
    const shouldRenderTooltip = !!enabled && !!tooltipsEnabled;

    const [visible, setVisible] = useState(false);
    const [tooltipStyle, setTooltipStyle] = useState<TooltipStyle>(HIDDEN_STYLE);
    const tooltipRef = useRef<WebViewRef>(null);
    const wrapperRef = useRef<WebViewRef>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        if (!shouldRenderTooltip || !visible) {
            setTooltipStyle(HIDDEN_STYLE);
            return;
        }

        const updatePosition = () => {
            if (!tooltipRef.current || !wrapperRef.current) return;
            const tooltipRect = tooltipRef.current.getBoundingClientRect();
            const wrapperRect = wrapperRef.current.getBoundingClientRect();
            const vw = window.innerWidth;
            const vh = window.innerHeight;

            let top = side === 'top'
                ? wrapperRect.top - tooltipRect.height - GAP
                : wrapperRect.bottom + GAP;
            if (top < CLIP_PAD) top = CLIP_PAD;
            if (top + tooltipRect.height > vh - CLIP_PAD) {
                top = Math.max(CLIP_PAD, vh - tooltipRect.height - CLIP_PAD);
            }

            let left = wrapperRect.left + (wrapperRect.width - tooltipRect.width) / 2;
            left = Math.min(Math.max(left, CLIP_PAD), vw - tooltipRect.width - CLIP_PAD);

            setTooltipStyle({ position: 'fixed', top, left });
        };

        updatePosition();
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [visible, shouldRenderTooltip, side, content]);

    if (!shouldRenderTooltip) {
        return children;
    }

    const tooltip = visible && typeof document !== 'undefined'
        ? createPortal(
            <View
                ref={tooltipRef}
                pointerEvents="none"
                className="z-50 shadow-lg w-auto backdrop-blur bg-popover/90 rounded-full py-1.5 px-3"
                // RN types lack `position: 'fixed'`; react-native-web supports it.
                style={tooltipStyle as unknown as ViewStyle}
            >
                <Text className="text-card-foreground whitespace-nowrap text-sm">{content}</Text>
            </View>,
            document.body
        )
        : null;

    return (
        <View
            {...eventHandlers}
            className="relative"
            ref={wrapperRef}
        >
            {children}
            {tooltip}
        </View>
    );
}
