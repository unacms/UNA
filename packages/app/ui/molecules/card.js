import { View } from 'app/design/view';
import { Text } from 'app/design/typography';
import { cn } from 'app/lib/util';
import { useLayoutSettings } from 'app/context/layout-settings';

function Card({
    className,
    density, // Can override global density
    ...props
}) {
    const { density: effectiveDensity } = useLayoutSettings();
    return (
        <View
            className={`u-card-base-${effectiveDensity} ${className}` }
            {...props}
        />
    );
}

function CardHeader({
    className,
    density,
    ...props
}) {
    const { density: effectiveDensity } = useLayoutSettings();
    return (
        <View
            className={cn(`u-card-header-${effectiveDensity}`, className)}
            {...props}
        />
    );
}

function CardIcon({
    className,
    density,
    ...props
}) {
    const { density: effectiveDensity } = useLayoutSettings();
    return (
        <View
            className={cn(`u-card-icon-${effectiveDensity}`, className)}
            {...props}
        />
    );
}

function CardTitle({
    className,
    density,
    ...props
}) {
    const { density: effectiveDensity } = useLayoutSettings();
    return (
        <Text
            role="heading"
            aria-level={3}
            className={cn(`u-card-title-${effectiveDensity}`, className)}
            {...props}
        />
    );
}

function CardDescription({
    className,
    density,
    ...props
}) {
    const { density: effectiveDensity } = useLayoutSettings();
    return (
        <Text
            className={cn(`u-card-description-${effectiveDensity}`, className)}
            {...props}
        />
    );
}

function CardContent({
    className,
    density,
    ...props
}) {
    const { density: effectiveDensity } = useLayoutSettings();
    return (
        <View
            className={cn(`u-card-content-${effectiveDensity}`, className)}
            {...props}
        />
    );
}

function CardFooter({
    className,
    density,
    ...props
}) {
    const { density: effectiveDensity } = useLayoutSettings();
    return (
        <View
            className={cn(`u-card-footer-${effectiveDensity}`, className)}
            {...props}
        />
    );
}

// Export default card
export default Card;

// Export all card components
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, CardIcon };
