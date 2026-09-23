'use client';

import type { CSSProperties } from 'react';
import NextImage from 'next/image';
import type { ImageInnerProps, ImageProps } from './image.types';
import { cn } from 'app/lib/util';
import {
    canOptimizeSrc,
    createOptimizedLoader,
    hasSizeClass,
    getSizesAttr,
    getImageProps,
    useImageOptimizerRetry,
} from 'app/lib/image-helpers';

export {
    POST_ENTRY_COVER_SIZES,
    POST_ENTRY_COVER_WIDTH_CAP,
} from 'app/lib/image-helpers';

function ElementImageInner(props: ImageInnerProps) {
    const {
        width,
        height,
        alt = '',
        style: styleProp,
        sizes,
        optimizedWidthCap,
        unoptimized: forceUnoptimized = false,
        className,
        contentFit,
        priority,
        loading,
        onError,
        onLoad,
        normalizedSrc,
        isCover,
    } = props;

    // Web only ever gets CSS styles here (ViewStyle is the native half of ImageProps).
    const style = styleProp as CSSProperties | undefined;
    const sizesAttr = getSizesAttr(sizes);
    const canOptimize = canOptimizeSrc(normalizedSrc, { forceUnoptimized });

    const { useOriginalImage, handleError } = useImageOptimizerRetry({
        retryKey: normalizedSrc,
        canRetry: canOptimize,
        onError,
    });

    const useOptimized = canOptimize && !useOriginalImage;
    const loader = useOptimized ? createOptimizedLoader(optimizedWidthCap ?? 1920) : undefined;
    const objectFit = contentFit ?? (isCover ? 'cover' : undefined);
    const imageKey = `${normalizedSrc}-${useOptimized ? 'opt' : 'orig'}`;

    const image = (
        <NextImage
            key={imageKey}
            src={normalizedSrc}
            alt={alt}
            sizes={sizesAttr}
            className={className}
            onError={handleError}
            onLoad={onLoad}
            unoptimized={!useOptimized}
            loader={loader}
            priority={priority ? true : undefined}
            loading={priority ? (loading ?? 'eager') : loading}
            fill={isCover || undefined}
            width={isCover ? undefined : width}
            height={isCover ? undefined : height}
            style={isCover
                ? (objectFit ? { objectFit } : undefined)
                : (objectFit ? { ...style, objectFit } : style)}
        />
    );

    if (!isCover) return image;

    return (
        <span
            className={cn(
                'relative block overflow-hidden',
                hasSizeClass(className) ? '' : 'w-full h-full',
                className,
            )}
            style={style}
        >
            {image}
        </span>
    );
}

export default function ElementImage(props: ImageProps) {
    const imageProps = getImageProps(props);
    if (!imageProps.src) return null;
    return <ElementImageInner {...props} {...imageProps} />;
}
