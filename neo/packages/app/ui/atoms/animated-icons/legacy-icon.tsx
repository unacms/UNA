'use client'

import { useState, type ComponentType } from 'react';
import { Platform } from 'react-native';
import { useIconClassColor } from 'app/ui/atoms/icon-class-color';
import type { IconCoreProps } from 'app/ui/atoms/icon';
import { parseIconSceneClasses } from './scenes';

/**
 * A registry value that is a component (`MyIcon: AnimatedMyIcon`), as forks wrote them before the spec engine.
 * It gets the props it always had; hover comes from the parent's `hovered` or, on web, from the icon's own
 * mouse events. New icons should be specs (see animated-icons.md).
 */
export function LegacyAnimatedIcon({ Component, origIcon, className, color, size, width, height, _strokeWidth, active, selected, hovered, pressed, rest }: IconCoreProps & { Component: ComponentType<any> }) {
    const { scenes, cleanedClassName } = typeof origIcon === 'string'
        ? parseIconSceneClasses(className)
        : { scenes: {}, cleanedClassName: className };
    const [hoveredLocal, setHoveredLocal] = useState(false);
    const hasHovered = hovered !== undefined && hovered !== null;
    const classColor = useIconClassColor(cleanedClassName);
    const hoverHandlers = scenes.draw && !hasHovered && Platform.OS === 'web'
        ? { onMouseEnter: () => setHoveredLocal(true), onMouseLeave: () => setHoveredLocal(false) }
        : {};

    return (
        <Component
            color={color || classColor}
            size={size}
            width={width}
            height={height}
            strokeWidth={_strokeWidth}
            className={cleanedClassName}
            active={active ?? selected}
            selected={selected}
            hovered={hasHovered ? hovered : hoveredLocal}
            pressed={pressed}
            scenes={scenes}
            {...hoverHandlers}
            {...rest}
        />
    );
}
