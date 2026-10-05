'use client';

import type { ViewStyle } from 'react-native';
import type { ImageInnerProps, ImageProps } from './image.types';
import { Image as ExpoImage } from 'expo-image';
import { View } from 'app/design/view';
import { appSetting, cn } from 'app/lib/util';
import {
    getNativeOptimizedImageUrl,
    hasSizeClass,
    getNativeLayoutWidth,
    getImageProps,
    useImageOptimizerRetry,
} from 'app/lib/image-helpers';

export {
    POST_ENTRY_COVER_SIZES,
    POST_ENTRY_COVER_WIDTH_CAP,
} from 'app/lib/image-helpers';

const fillStyle = { width: '100%', height: '100%' } as const;

function ElementImageInner(props: ImageInnerProps) {
    const {
        width,
        height,
        alt = '',
        style,
        nobg,
        className,
        priority,
        contentFit,
        onError,
        onLoad,
        normalizedSrc,
        isCover,
    } = props;

    const layoutWidth = getNativeLayoutWidth({
        width,
        style,
        className,
        isCover,
    });

    const optimizedSrc = getNativeOptimizedImageUrl(normalizedSrc, layoutWidth);

    const { useOriginalImage, handleError } = useImageOptimizerRetry({
        retryKey: optimizedSrc || normalizedSrc,
        canRetry: !!optimizedSrc,
        onError,
    });

    const imageUri = useOriginalImage || !optimizedSrc ? normalizedSrc : optimizedSrc;

    const backgroundColor = nobg ? undefined : appSetting('layout', 'background_image_color') || undefined;

    const hasExplicitSize = hasSizeClass(className);
    const isAbsolutelyPositioned = typeof className === 'string'
        && /(^|\s)absolute(\s|$)/.test(className);

    const wrapperStyle: ViewStyle = {
        ...(style as ViewStyle),
        ...(backgroundColor ? { backgroundColor } : null),
        ...(!isCover && typeof width === 'number' ? { width } : null),
        ...(!isCover && typeof height === 'number' ? { height } : null),
        ...(isCover && !hasExplicitSize
            ? (isAbsolutelyPositioned
                ? { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }
                : fillStyle)
            : null),
    };

    return (
        <View
            className={cn(isCover ? 'overflow-hidden' : undefined, className)}
            style={wrapperStyle}
        >
            <ExpoImage
                key={`${normalizedSrc}-${useOriginalImage ? 'orig' : 'opt'}`}
                source={{ uri: imageUri }}
                style={fillStyle}
                contentFit={contentFit ?? 'cover'}
                cachePolicy="memory-disk"
                recyclingKey={normalizedSrc}
                priority={priority === true ? 'high' : (priority || undefined)}
                alt={alt}
                onError={handleError}
                onLoad={onLoad}
            />
        </View>
    );
}

export default function ElementImage(props: ImageProps) {
    const imageProps = getImageProps(props);
    if (!imageProps.src) return null;
    return <ElementImageInner {...props} {...imageProps} />;
}
