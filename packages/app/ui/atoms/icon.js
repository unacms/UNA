'use client'

import { IconFromSet, XmlIcon } from 'app/ui/atoms/iconset';
import { useState } from 'react';
import { Platform } from 'react-native';
import { findIconFromRemote, appSetting } from 'app/lib/util';
import SvgIcons from 'app/customization/icons-svg';
import { animatedIcons } from 'app/customization/animated-icons';

const hasValue = (v) => v !== undefined && v !== null;
const isValidLucideIconName = (icon) =>
    typeof icon === 'string' && /^[A-Z][A-Za-z0-9]*$/.test(icon);

export function Icon(props) {
    const { fill, ...rest } = props;
    const iconProps = useIconCore(rest);
    if (iconProps.iconType === 'none') return null;
    if (iconProps.iconType === 'animated') return <AnimatedIcon {...iconProps} />;
    if (iconProps.iconType === 'inline') return <InlineIcon {...iconProps} />;
    if (iconProps.iconType === 'xml') return <XmlIcon {...iconProps} />;
    if (!isValidLucideIconName(iconProps.icon)) return null;
    return <IconFromSet {...iconProps} fill={fill} />;
}

export function AnimatedIcon({ AnimatedIconComponent, origIcon, className, animated, color, size, width, height, _strokeWidth, active, selected, hovered, pressed, rest }) {
    const { scenes, cleanedClassName } = animated && typeof origIcon === 'string'
        ? parseIconSceneClasses(className)
        : { scenes: {}, cleanedClassName: className };

    const [hoveredLocal, setHoveredLocal] = useState(false);
    const hoveredMerged = hasValue(hovered) ? hovered : hoveredLocal;
    const activeResolved = hasValue(active) ? active : selected;
    const hoverHandlers = animated && scenes.draw && !hasValue(hovered) && Platform.OS === 'web'
        ? { onMouseEnter: () => setHoveredLocal(true), onMouseLeave: () => setHoveredLocal(false) }
        : {};

    return (
        <AnimatedIconComponent
            color={color}
            size={size}
            width={width}
            height={height}
            strokeWidth={_strokeWidth}
            className={cleanedClassName}
            active={activeResolved}
            selected={selected}
            hovered={hoveredMerged}
            pressed={pressed}
            scenes={scenes}
            {...hoverHandlers}
            {...rest}
        />
    );
}

function parseIconSceneClasses(className) {
    if (!className || typeof className !== 'string') {
        return {
            scenes: {},
            cleanedClassName: className || '',
        };
    }

    const scenes = {
        fill: false,
        draw: false,
        morph: false,
        smoke: false,
        custom1: false,
        custom2: false,
        custom3: false,
        custom4: false,
        custom5: false,
        custom6: false,
    };

    const parts = className.split(/\s+/).filter(Boolean);
    for (const tok of parts) {
        const m = tok.match(/icon-scene-(fill|draw|morph|smoke|custom[1-6])/);
        if (m && m[1] in scenes) {
            scenes[m[1]] = true;
        }
    }

    const cleanedClassName = parts.filter((t) => !t.includes('icon-scene-')).join(' ');

    return { scenes, cleanedClassName };
}

export function InlineIcon({ InlineIcon: C, width, height, size, color }) {
    return <C width={width || size} height={height || size} color={color} />;
}

function getAnimatedIcon(name) {
    return animatedIcons?.[name] ?? null;
}

function useIconCore({ icon: origIcon, className, width, height, color, size, strokeWidth, animated, active, selected, hovered, pressed, ...rest }) {
    const isXmlSvg = typeof origIcon === 'string' && origIcon.startsWith('<svg');
    const icon = findIconFromRemote(origIcon);
    const _strokeWidth = strokeWidth || appSetting('layout', 'default_icon_stroke_width');
    const InlineIcon = SvgIcons[icon];
    const AnimatedIconComponent = animated && icon && !isXmlSvg && !InlineIcon
        ? getAnimatedIcon(icon)
        : null;

    const iconType = !icon ? 'none'
        : AnimatedIconComponent ? 'animated'
        : InlineIcon ? 'inline'
        : isXmlSvg ? 'xml'
        : 'set';

    const cleanedClassName = animated && typeof origIcon === 'string'
        ? parseIconSceneClasses(className).cleanedClassName
        : className;

    return {
        iconType, origIcon, icon, className, animated,
        InlineIcon, AnimatedIconComponent,
        _strokeWidth, width, height, size, color,
        active, selected, hovered, pressed,
        cleanedClassName, rest,
    };
}
