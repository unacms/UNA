'use client'

import { SvgXml } from 'react-native-svg';
import { IconFromSet } from 'app/ui/atoms/iconset';
import { useState } from 'react';
import { Platform } from 'react-native';
import { findIconFromRemote, appSetting } from 'app/lib/util';
import SvgIcons from 'app/customization/icons-svg';
import { getAnimatedIconComponent } from 'app/customization/animated-icons-registry';
import { parseIconSceneClasses } from 'app/ui/atoms/animated-icons/parse-icon-scene-classes';

const hasValue = (v) => v !== undefined && v !== null;

export function Icon(props) {
    const { fill, ...rest } = props;
    const iconProps = useIconCore(rest);
    if (iconProps.iconType === 'none') return null;
    if (iconProps.iconType === 'animated') return <AnimatedIcon {...iconProps} />;
    if (iconProps.iconType === 'inline') return <InlineIcon {...iconProps} />;
    if (iconProps.iconType === 'xml') return <XmlIcon {...iconProps} />;
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

export function InlineIcon({ InlineIcon: C, width, height, size, color }) {
    return <C width={width || size} height={height || size} color={color} />;
}

export function XmlIcon({ origIcon, width, height, size, color, cleanedClassName, rest }) {
    if (Platform.OS === 'web') {
        const result = origIcon
            .replace(/\swidth="[^"]*"/i, '')
            .replace(/\sheight="[^"]*"/i, '')
            .replace(/<svg(\s[^>]*)?>/i, `<svg$1 width="${width || size}" height="${height || size}">`);
        return (
            <span
                style={{ color, display: 'flex' }}
                className={cleanedClassName}
                {...rest}
                dangerouslySetInnerHTML={{ __html: result }}
            />
        );
    }
    return <SvgXml xml={origIcon} width={width || size} height={height || size} color={color} />;
}

function useIconCore({ icon: origIcon, className, width, height, color, size, strokeWidth, animated, active, selected, hovered, pressed, ...rest }) {
    const isXmlSvg = typeof origIcon === 'string' && origIcon.startsWith('<svg');
    const icon = findIconFromRemote(origIcon);
    const _strokeWidth = strokeWidth || appSetting('layout', 'default_icon_stroke_width');
    const InlineIcon = SvgIcons[icon];
    const AnimatedIconComponent = animated && icon && !isXmlSvg && !InlineIcon
        ? getAnimatedIconComponent(icon)
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
