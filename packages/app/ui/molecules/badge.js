import { View } from 'app/design/view';
import { Text } from 'app/design/typography';
import { cn } from 'app/lib/util';
import { useLayoutSettings } from 'app/context/layout-settings';

function Badge({
    className,
    variant = "default",
    density, // Can override global density
    children,
    ...props
}) {
    const { density: effectiveDensity } = useLayoutSettings();
    
    return (
        <View
            className={cn(
                `u-badge-base-${effectiveDensity}`,
                `u-badge-${variant}-${effectiveDensity}`,
                className
            )}
            {...props}
        >
            <Text className={cn(
                `u-badge-text-${effectiveDensity}`,
                `u-badge-text-${variant}-${effectiveDensity}`
            )}>
                {children}
            </Text>
        </View>
    );
}

export default Badge; 