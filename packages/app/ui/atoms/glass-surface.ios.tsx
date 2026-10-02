import { StyleSheet } from 'react-native';
import { useResolveClassNames } from 'uniwind';
import { Host, Rectangle } from '@expo/ui/swift-ui';
import { foregroundStyle, glassEffect } from '@expo/ui/swift-ui/modifiers';
import { View } from 'app/design/view';
import type { GlassSurfaceProps } from 'app/ui/atoms/glass-surface.types';

/**
 * iOS 26 Liquid Glass behind RN content: a clear SwiftUI shape with
 * `glassEffect`, filling its parent, so the glass follows the parent's size
 * (a composer growing as you type). iOS before 26 draws no glass, so gate it
 * on `hasLiquidGlass` and keep a fill for older systems.
 */
export function GlassSurface({ rounded = 'rounded-full' }: GlassSurfaceProps) {
    const radius = StyleSheet.flatten(useResolveClassNames(rounded))?.borderRadius;
    const isCapsule = rounded === 'rounded-full';
    return (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Host ignoreSafeArea="all" style={StyleSheet.absoluteFill}>
                <Rectangle
                    modifiers={[
                        foregroundStyle('#00000000'),
                        glassEffect({
                            glass: { variant: 'regular' },
                            shape: isCapsule ? 'capsule' : 'roundedRectangle',
                            ...(isCapsule ? null : { cornerRadius: typeof radius === 'number' ? radius : 24 }),
                        }),
                    ]}
                />
            </Host>
        </View>
    );
}
