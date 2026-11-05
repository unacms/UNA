'use client'

import { IconFromSet, XmlIcon } from 'app/ui/atoms/iconset';
import type { ComponentType } from 'react';
import { findIconFromRemote, appSetting } from 'app/lib/util';
import { currentLucideName } from 'app/lib/util/lucide-renames';
import SvgIcons from 'app/customization/icons-svg';
import { AnimatedIconHost, findAnimatedIcon } from 'app/ui/atoms/animated-icons/host';
import { parseIconSceneClasses } from 'app/ui/atoms/animated-icons/scenes';
import { tagGlyphIcons } from 'app/ui/atoms/tag-glyph-icons';

type IconRegistry = Record<string, ComponentType<any> | undefined>;

type IconSize = number | string;

export type IconProps = {
    /** Lucide name, remote icon key, inline SVG name, tagsets language glyph (`LocaleEn`), or raw `<svg …>` markup. */
    icon?: string | null;
    className?: string;
    width?: IconSize;
    height?: IconSize;
    size?: IconSize;
    color?: string;
    strokeWidth?: number;
    fill?: string;
    /** Use the animated variant when the registry has one (see animated-icons.md); hover and focus come from the row's `group` on web. */
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

const isValidLucideIconName = (icon: unknown) =>
    typeof icon === 'string' && /^[A-Z][A-Za-z0-9]*$/.test(icon);

export function Icon(props: IconProps) {
    const { fill, ...rest } = props;
    const iconProps = useIconCore(rest);
    if (iconProps.iconType === 'none') return null;
    if (iconProps.iconType === 'animated') return <AnimatedIconHost {...iconProps} />;
    if (iconProps.iconType === 'inline') return <InlineIcon {...iconProps} />;
    if (iconProps.iconType === 'xml') return <XmlIcon {...iconProps} />;
    if (!isValidLucideIconName(iconProps.icon)) return null;
    return <IconFromSet {...iconProps} fill={fill} />;
}

export function InlineIcon({ InlineIcon: C, width, height, size, color, _strokeWidth, cleanedClassName }: IconCoreProps) {
    if (!C) return null;
    return <C width={width || size} height={height || size} color={color} strokeWidth={_strokeWidth} className={cleanedClassName} />;
}

function useIconCore({ icon: origIcon, className, width, height, color, size, strokeWidth, animated, active, selected, hovered, pressed, ...rest }: IconProps) {
    const isXmlSvg = typeof origIcon === 'string' && origIcon.startsWith('<svg');
    const remoteIcon: string | null | undefined = findIconFromRemote(origIcon);
    const _strokeWidth: number | undefined = strokeWidth || appSetting('layout', 'default_icon_stroke_width');
    // The icons-svg registry first (a fork can replace a glyph there), then the tagsets language glyphs.
    const InlineIcon = remoteIcon ? ((SvgIcons as IconRegistry)[remoteIcon] ?? (tagGlyphIcons as IconRegistry)[remoteIcon]) : undefined;
    // No custom drawing: Lucide draws it, under its current name if Lucide has renamed it.
    const icon = InlineIcon ? remoteIcon : currentLucideName(remoteIcon);
    // Web's inline copies of hot Lucide icons (icons-svg.web.js) stay animatable; a fork's own drawing never animates.
    const lucideCopy = (InlineIcon as { lucideInline?: boolean } | undefined)?.lucideInline === true;
    // Web decides in the host once the engine has loaded (the static icon draws until then); native looks it up now.
    const animatedIcon = animated && icon && !isXmlSvg && (!InlineIcon || lucideCopy) && isValidLucideIconName(icon)
        ? findAnimatedIcon(icon)
        : null;

    const iconType = !icon ? 'none'
        : animatedIcon ? 'animated'
        : InlineIcon ? 'inline'
        : isXmlSvg ? 'xml'
        : 'set';

    const cleanedClassName = animated && typeof origIcon === 'string'
        ? parseIconSceneClasses(className).cleanedClassName
        : className;

    return {
        iconType, origIcon, icon, className, animated,
        InlineIcon, animatedIcon,
        _strokeWidth, width, height, size, color,
        active, selected, hovered, pressed,
        cleanedClassName, rest,
    };
}
