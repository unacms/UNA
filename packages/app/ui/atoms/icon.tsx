'use client'

import { IconFromSet, XmlIcon } from 'app/ui/atoms/iconset';
import { useIconClassColor } from 'app/ui/atoms/icon-class-color';
import { useState, type ComponentType } from 'react';
import { Platform } from 'react-native';
import { findIconFromRemote, appSetting } from 'app/lib/util';
import SvgIcons from 'app/customization/icons-svg';
import { animatedIcons } from 'app/customization/animated-icons';

type IconRegistry = Record<string, ComponentType<any> | undefined>;

type IconSize = number | string;

export type IconProps = {
    /** Lucide name, remote icon key, inline SVG name, or raw `<svg …>` markup. */
    icon?: string | null;
    className?: string;
    width?: IconSize;
    height?: IconSize;
    size?: IconSize;
    color?: string;
    strokeWidth?: number;
    fill?: string;
    /** Use the animated variant when the registry has one (see animated-icons.md). */
    animated?: boolean;
    active?: boolean;
    selected?: boolean;
    hovered?: boolean;
    pressed?: boolean;
    /** Passed through to the rendered icon component. */
    [key: string]: unknown;
};

/** Normalized props shared by all icon renderers (see `useIconCore`). */
export type IconCoreProps = ReturnType<typeof useIconCore> & { fill?: string };

const hasValue = (v: unknown) => v !== undefined && v !== null;
const isValidLucideIconName = (icon: unknown) =>
    typeof icon === 'string' && /^[A-Z][A-Za-z0-9]*$/.test(icon);

export function Icon(props: IconProps) {
    const { fill, ...rest } = props;
    const iconProps = useIconCore(rest);
    if (iconProps.iconType === 'none') return null;
    if (iconProps.iconType === 'animated') return <AnimatedIcon {...iconProps} />;
    if (iconProps.iconType === 'inline') return <InlineIcon {...iconProps} />;
    if (iconProps.iconType === 'xml') return <XmlIcon {...iconProps} />;
    if (!isValidLucideIconName(iconProps.icon)) return null;
    return <IconFromSet {...iconProps} fill={fill} />;
}

export function AnimatedIcon({ AnimatedIconComponent, origIcon, className, animated, color, size, width, height, _strokeWidth, active, selected, hovered, pressed, rest }: IconCoreProps) {
    const { scenes, cleanedClassName } = animated && typeof origIcon === 'string'
        ? parseIconSceneClasses(className)
        : { scenes: {}, cleanedClassName: className };

    const [hoveredLocal, setHoveredLocal] = useState(false);
    const hoveredMerged = hasValue(hovered) ? hovered : hoveredLocal;
    const activeResolved = hasValue(active) ? active : selected;
    const classColor = useIconClassColor(cleanedClassName);
    const hoverHandlers = animated && scenes.draw && !hasValue(hovered) && Platform.OS === 'web'
        ? { onMouseEnter: () => setHoveredLocal(true), onMouseLeave: () => setHoveredLocal(false) }
        : {};

    // Only rendered for iconType 'animated', so the component is always set.
    if (!AnimatedIconComponent) return null;

    return (
        <AnimatedIconComponent
            color={color || classColor}
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

const DEFAULT_ANIMATED_SCENES = { fill: true, draw: true };

type IconScene = 'fill' | 'draw' | 'morph' | 'smoke' | `custom${1 | 2 | 3 | 4 | 5 | 6}`;

function parseIconSceneClasses(className?: string): { scenes: Partial<Record<IconScene, boolean>>; cleanedClassName: string } {
    const scenes: Record<IconScene, boolean> = {
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

    if (!className || typeof className !== 'string') {
        return {
            scenes: { ...scenes, ...DEFAULT_ANIMATED_SCENES },
            cleanedClassName: className || '',
        };
    }

    const parts = className.split(/\s+/).filter(Boolean);
    let hasExplicitScene = false;
    for (const tok of parts) {
        const m = tok.match(/icon-scene-(fill|draw|morph|smoke|custom[1-6])/);
        const scene = m?.[1];
        if (scene && scene in scenes) {
            hasExplicitScene = true;
            scenes[scene as IconScene] = true;
        }
    }

    if (!hasExplicitScene) {
        Object.assign(scenes, DEFAULT_ANIMATED_SCENES);
    }

    const cleanedClassName = parts.filter((t) => !t.includes('icon-scene-')).join(' ');

    return { scenes, cleanedClassName };
}

export function InlineIcon({ InlineIcon: C, width, height, size, color, _strokeWidth, cleanedClassName }: IconCoreProps) {
    if (!C) return null;
    return <C width={width || size} height={height || size} color={color} strokeWidth={_strokeWidth} className={cleanedClassName} />;
}

function getAnimatedIcon(name: string) {
    return (animatedIcons as IconRegistry | undefined)?.[name] ?? null;
}

function useIconCore({ icon: origIcon, className, width, height, color, size, strokeWidth, animated, active, selected, hovered, pressed, ...rest }: IconProps) {
    const isXmlSvg = typeof origIcon === 'string' && origIcon.startsWith('<svg');
    const icon: string | null | undefined = findIconFromRemote(origIcon);
    const _strokeWidth: number | undefined = strokeWidth || appSetting('layout', 'default_icon_stroke_width');
    const InlineIcon = icon ? (SvgIcons as IconRegistry)[icon] : undefined;
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
