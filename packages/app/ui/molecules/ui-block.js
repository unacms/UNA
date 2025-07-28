import * as React from 'react';
import { View } from 'app/design/view';
import { Text } from 'app/design/typography';
import { cn } from 'app/lib/util';
import { useLayoutSettings } from 'app/context/layout-settings';

function Block({
    className,
    density, // Can override global density
    ...props
}) {
    const { density: effectiveDensity } = useLayoutSettings();
    return (
        <View
            className={cn(`u-block-base-${effectiveDensity}`, className)}
            {...props}
        />
    );
}

function BlockHeader({
    className,
    density,
    ...props
}) {
    const { density: effectiveDensity } = useLayoutSettings();

    return (
        <View
            className={cn(`u-block-header-${effectiveDensity}`, className)}
            {...props}
        />
    );
}

function BlockTitle({
    className,
    density,
    ...props
}) {
    const { density: effectiveDensity } = useLayoutSettings();

    return (
        <Text
            role="heading"
            aria-level={3}
            className={cn(`u-block-title-${effectiveDensity}`, className)}
            {...props}
        />
    );
}

function BlockDescription({
    className,
    density,
    ...props
}) {
    const { density: effectiveDensity } = useLayoutSettings();
    return (
        <Text
            className={cn(`u-block-description-${effectiveDensity}`, className)}
            {...props}
        />
    );
}

function BlockContent({
    className,
    density,
    ...props
}) {
    const { density: effectiveDensity } = useLayoutSettings();

    return (
        <View
            className={cn(`u-block-content-${effectiveDensity}`, className)}
            {...props}
        />
    );
}

function BlockFooter({
    className,
    density,
    ...props
}) {
    const { density: effectiveDensity } = useLayoutSettings();

    return (
        <View
            className={cn(`u-block-footer-${effectiveDensity}`, className)}
            {...props}
        />
    );
}

// Export default block
export default Block;

// Export all block components
export { Block, BlockContent, BlockDescription, BlockFooter, BlockHeader, BlockTitle }; 