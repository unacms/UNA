'use client'

import { useEffect, useState, memo, useMemo } from 'react';
import { Platform } from 'react-native';
import { storageGet, storageSet, findIconFromRemote, appSetting } from 'app/lib/util'
import SvgIcons from  'app/customization/icons-svg';
import { getAnimatedIconComponent } from 'app/customization/animated-icons-registry';
import { parseIconSceneClasses } from 'app/ui/atoms/animated-icons/parse-icon-scene-classes';

export const Icon = memo(function Icon(props) {
    const { icon: origIcon, className, width, height, color, size, strokeWidth, fill, animated, selected, hovered, pressed, active, ...rest } = props;
    const isXmlSvg = origIcon?.startsWith('<svg');
    const icon = findIconFromRemote(origIcon);
    const _strokeWidth = strokeWidth || appSetting('layout', 'default_icon_stroke_width');
    
    // Мемоизируем ключ, чтобы он не пересчитывался при каждом рендере
    const key = useMemo(() => `${icon}-${width || ''}-${height || ''}-${size || ''}-${fill || ''}`, [icon, width, height, size, strokeWidth, fill]);

    // Initialize with empty string to avoid hydration mismatch
    // localStorage is only available on client, so we read it in useEffect
    const [currentIcon, setCurrentIcon] = useState('');
    const InlineIcon = SvgIcons[icon];

    const AnimatedIcon =
        animated && typeof origIcon === 'string' && !isXmlSvg && !InlineIcon ? getAnimatedIconComponent(icon) : null;

    const { scenes, cleanedClassName } =
        animated && typeof origIcon === 'string'
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

    useEffect(() => {
        if (AnimatedIcon) return;
        // Skip if we have an inline icon or XML SVG
        if (InlineIcon || isXmlSvg) return;
        
        // Check localStorage first (client-side only)
        const cachedIcon = storageGet(`icon-${key}`, '', true);
        if (cachedIcon) {
            setCurrentIcon(cachedIcon);
            return;
        }
        
        // No cached icon and no icon name - nothing to fetch
        if (!icon) return;

        // Fetch icon from server
        const fetchIcon = async () => {
            let url = `/api/api.icon?icon=${icon}`;
            if (width) url += `&width=${width}`;
            if (height) url += `&height=${height}`;
            if (size) url += `&size=${size}`;
            if (fill) url += `&fill=${fill}`;
            if (_strokeWidth) url += `&strokeWidth=${_strokeWidth}`;
            
            try {
                const response = await fetch(url);
                const data = await response.json();
                setCurrentIcon(data.icon);
                storageSet(`icon-${key}`, '', data.icon, true);
            } catch (error) {
                console.error('Error loading icon:', error);
            }
        };

        fetchIcon();
    }, [icon, key, InlineIcon, isXmlSvg, width, height, size, fill, _strokeWidth, AnimatedIcon]);

    if (AnimatedIcon) {
        return (
            <AnimatedIcon
                color={color}
                size={size}
                width={width}
                height={height}
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

    if (!currentIcon) {
        if (InlineIcon){
            return <InlineIcon width={width || size} height={height || size} />;
        }
        if (isXmlSvg){
            const result = origIcon
                .replace(/\swidth="[^"]*"/i, '')
                .replace(/\sheight="[^"]*"/i, '')
                .replace(
                /<svg(\s[^>]*)?>/i,
                `<svg$1 width="${width || size}" height="${height || size}">`
            );
            return <span style={{color:color, display: 'flex'}} className={cleanedClassName} {...rest} dangerouslySetInnerHTML={{ __html: result }} />;
        }
        return null; // Возвращаем null, если иконка не загружена
        
    }

    return (
        <span style={{color:color, display: 'flex'}}  className={cleanedClassName} {...rest} dangerouslySetInnerHTML={{ __html: currentIcon }} />
    );
});

