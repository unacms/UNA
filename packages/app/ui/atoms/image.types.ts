// Props shared by image.tsx (native) and image.web.tsx.
import type { CSSProperties } from 'react';
import type { ViewStyle } from 'react-native';

export type ImageProps = {
    /** URL; UNA display fields and `source` are also accepted (see getImageSrc). */
    src?: string | null;
    source?: string | { uri?: string };
    /** `cover` (or `fill`) stretches the image over its parent. */
    view?: 'cover' | string;
    fill?: boolean | 'fill';
    width?: number;
    height?: number;
    alt?: string;
    /** CSS on web, a View style on native. */
    style?: CSSProperties | ViewStyle;
    className?: string;
    contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
    priority?: boolean | 'low' | 'normal' | 'high';
    onError?: (...args: any[]) => void;
    onLoad?: (...args: any[]) => void;
    /** Native: no placeholder background. */
    nobg?: boolean;
    /** Web: breakpoint width, `'auto'`, or a ready `sizes` attribute. */
    sizes?: number | string;
    /** Web: max width requested from the optimizer. */
    optimizedWidthCap?: number;
    /** Web: skip the optimizer. */
    unoptimized?: boolean;
    /** Web: native lazy-loading hint. */
    loading?: 'eager' | 'lazy';
    [key: string]: unknown;
};

export type ImageInnerProps = ImageProps & { normalizedSrc: string; isCover: boolean };
