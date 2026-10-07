import { StyleSheet } from 'react-native';
import { useResolveClassNames } from 'uniwind';
import { Host, Mask, Rectangle, ZStack } from '@expo/ui/swift-ui';
import { foregroundStyle } from '@expo/ui/swift-ui/modifiers';
import { View } from 'app/design/view';
import { useThemeValue } from 'app/design/theme';
import { appSetting } from 'app/lib/util';
import { toHexColor } from 'app/lib/platform/native-color';
import type { EdgeBlurConfig, EdgeBlurProps, EdgeBlurSlot, EdgeBlurViewProps } from 'app/ui/atoms/edge-blur.types';

/** `layout.header.fade_blur` / `layout.footer_fade_blur` / `layout.tabbar_fade_blur`; null keeps the wash. */
export function edgeBlurConfig(slot: EdgeBlurSlot): EdgeBlurConfig | null {
    const config = slot === 'header'
        ? appSetting('layout', 'header', 'fade_blur')
        : appSetting('layout', slot === 'tabbar' ? 'tabbar_fade_blur' : 'footer_fade_blur');
    return config && typeof config === 'object' ? config : null;
}

const easeInOutSine = (p: number) => -(Math.cos(Math.PI * p) - 1) / 2;

/**
 * Mask alphas for SwiftUI `LinearGradient(colors:)`, which spaces colors
 * evenly: `peak` for the first `hold` of the height, then an eased fall-off
 * (the "easing gradient" trick) so the blur ends without a visible band.
 */
function easedMaskColors(hold: number, steps: number, peak: number) {
    const colors: string[] = [];
    const max = Math.min(1, Math.max(0, peak));
    for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1);
        const p = t <= hold ? 0 : (t - hold) / (1 - hold);
        const alpha = Math.round((1 - easeInOutSine(p)) * max * 255);
        colors.push(`#000000${alpha.toString(16).padStart(2, '0')}`);
    }
    return colors;
}

/**
 * Progressive-looking edge blur behind iOS bars: a SwiftUI material masked by
 * an eased gradient. Both the blur and the mask are native — masking an
 * `expo-blur` view from an RN `MaskedView` parent can drop the blur. Without
 * `config` it falls back to the Tailwind wash.
 */
export function EdgeBlur({ edge = 'top', config, fallbackClassName, style }: EdgeBlurProps) {
    // Page color, so the blur ends in `bg-background` rather than the material's
    // own gray (dark `thin` reads as `bg-card` over a black page).
    const pageColor = StyleSheet.flatten(useResolveClassNames('bg-background'))?.backgroundColor;
    const tintAlpha = useThemeValue(config?.tint?.light ?? 0, config?.tint?.dark ?? 0);
    if (!config) {
        return <View pointerEvents="none" className={`absolute inset-0 ${fallbackClassName || ''}`} style={style} />;
    }
    const colors = easedMaskColors(config.hold ?? 0.5, config.steps ?? 14, config.opacity ?? 1);
    const tint = tintAlpha > 0 ? toHexColor(pageColor, tintAlpha) : null;
    const top = { x: 0.5, y: 0 };
    const bottom = { x: 0.5, y: 1 };
    // Never a touch target: `box-none` parents (messenger chrome) must keep
    // passing taps in the fade zone through to the list behind.
    return (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
            <Host ignoreSafeArea="all" style={StyleSheet.absoluteFill}>
                <Mask>
                    <ZStack>
                        <Rectangle modifiers={[foregroundStyle({ type: 'material', material: config.material ?? 'regular' })]} />
                        {tint ? <Rectangle modifiers={[foregroundStyle(tint)]} /> : null}
                    </ZStack>
                    <Mask.Content>
                        <Rectangle
                            modifiers={[foregroundStyle({
                                type: 'linearGradient',
                                colors,
                                startPoint: edge === 'top' ? top : bottom,
                                endPoint: edge === 'top' ? bottom : top,
                            })]}
                        />
                    </Mask.Content>
                </Mask>
            </Host>
        </View>
    );
}

/** Swaps the container's wash for a native `EdgeBlur` behind its children. */
export function EdgeBlurView({ edge = 'bottom', config, washClassName, className, children, ...rest }: EdgeBlurViewProps) {
    if (!config) {
        return <View {...rest} className={`${className || ''} ${washClassName || ''}`}>{children}</View>;
    }
    return (
        <View {...rest} className={className}>
            <EdgeBlur edge={edge} config={config} />
            {children}
        </View>
    );
}
