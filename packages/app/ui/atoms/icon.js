'use client'

import { IconSet } from 'app/customization/icons';
import { getAnimatedIconComponent } from 'app/customization/animated-icons-registry';
import { findIconFromRemote, appSetting } from 'app/lib/util'
import { Theme } from 'app/design/theme';
import { useMemo, useState } from 'react';
import { Platform } from 'react-native';
import SvgIcons from 'app/customization/icons-svg';
import { SvgXml } from 'react-native-svg';
import { cssInterop } from 'nativewind';
import { parseIconSceneClasses } from 'app/ui/atoms/animated-icons/parse-icon-scene-classes';

export function Icon(props) {
    const { icon, className, color, size, strokeWidth, animated, selected, hovered, pressed, active, ...rest } = props
    const { colors } = Theme();
    let isXmlSvg = false;

    if (typeof icon === 'string') {
        isXmlSvg = icon.startsWith('<svg');
    } else {
        console.log('Warning: Icon prop is not a string. Received:', icon);
    }

    const _strokeWidth = strokeWidth || appSetting('layout', 'default_icon_stroke_width');
    const processedIcon = findIconFromRemote(icon);

    const InlineIcon = SvgIcons[icon];

    const { scenes, cleanedClassName } =
        animated && typeof icon === 'string'
            ? parseIconSceneClasses(className)
            : { scenes: {}, cleanedClassName: className };

    const [hoveredLocal, setHoveredLocal] = useState(false);
    const hoveredMerged = hovered !== undefined && hovered !== null ? hovered : hoveredLocal;
    const attachWebHoverForDraw =
        animated &&
        scenes.draw &&
        (hovered === undefined || hovered === null) &&
        Platform.OS === 'web';
    const hoverHandlers = attachWebHoverForDraw
        ? {
              onMouseEnter: () => setHoveredLocal(true),
              onMouseLeave: () => setHoveredLocal(false),
          }
        : {};

        const IconComponent = useMemo(() => {
            const IconComponent2 = IconSet[processedIcon];
    
            if (IconComponent2){
                IconComponent2.displayName = processedIcon;
                return cssInterop(IconComponent2, {
                    className: {
                        target: 'style',
                        nativeStyleToProp: {
                            color: true,
                            width: true,
                            height: true,
                        },
                    },
                });
            }
            return null;
        }, [processedIcon]);

    if (animated && typeof icon === 'string' && !isXmlSvg && !InlineIcon) {
        const AnimatedIcon = getAnimatedIconComponent(processedIcon);
        if (AnimatedIcon) {
            return (
                <AnimatedIcon
                    color={color}
                    size={size}
                    width={props.width}
                    height={props.height}
                    strokeWidth={_strokeWidth}
                    className={cleanedClassName}
                    active={active !== undefined && active !== null ? active : selected}
                    selected={selected}
                    hovered={hoveredMerged}
                    pressed={pressed}
                    scenes={scenes}
                    {...hoverHandlers}
                    {...rest}
                />
            );
        }
    }

    //const IconComponent = useMemo(() => IconSet[processedIcon], [processedIcon]);

    


    if (!icon)
        return null;

    if (InlineIcon)
        return <InlineIcon width={props.width || size} height={props.height || size} color={color} />;

    if (isXmlSvg)
        return <SvgXml xml={icon} width={props.width || size} height={props.height || size} color={color} />

    if (!IconComponent) {
        console.log('Icon not found:', processedIcon);
        return null;
    }

    return (
        <IconComponent
            color={color || colors.default}
            size={size}
            strokeWidth={_strokeWidth}
            className={cleanedClassName}
            {...rest}
        />
    );
}

