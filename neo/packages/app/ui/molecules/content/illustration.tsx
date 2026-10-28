import Svg, { Path } from 'react-native-svg';
import { useResolveClassNames } from 'uniwind';
import { View } from 'app/design/view';
import { ILLUSTRATIONS, ILLUSTRATION_VIEWBOX } from './illustration-shapes';
import type { IllustrationProps, IllustrationTone } from './illustration.types';

// react-native-svg needs concrete colours: resolve each tone's token for the current theme.
function useToneColors(): Record<IllustrationTone, string | undefined> {
    const muted = useResolveClassNames('text-muted')?.color as string | undefined;
    const accent = useResolveClassNames('text-accent')?.color as string | undefined;
    const primary = useResolveClassNames('text-primary')?.color as string | undefined;
    const accentForeground = useResolveClassNames('text-accent-foreground')?.color as string | undefined;
    const primaryForeground = useResolveClassNames('text-primary-foreground')?.color as string | undefined;
    return { muted, accent, primary, accentForeground, primaryForeground };
}

/** Decorative shape art in the theme's colours; drawn inline, so nothing is fetched. */
export default function Illustration({ name, className = '' }: IllustrationProps) {
    const colors = useToneColors();
    return (
        <View className={`w-full h-full ${className}`} accessible={false} importantForAccessibility="no-hide-descendants">
            <Svg width="100%" height="100%" viewBox={ILLUSTRATION_VIEWBOX}>
                {ILLUSTRATIONS[name].map((shape) => (
                    <Path
                        key={shape.d}
                        d={shape.d}
                        fill={colors[shape.tone] ?? 'transparent'}
                        fillRule={shape.evenOdd ? 'evenodd' : 'nonzero'}
                    />
                ))}
            </Svg>
        </View>
    );
}
