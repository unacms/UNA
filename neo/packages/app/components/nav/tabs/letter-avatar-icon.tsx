import { useRef, useState, type ReactNode } from 'react';
import { PixelRatio } from 'react-native';
import { View } from 'app/design/view';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { useNativeTokenColor } from 'app/design/controls/neo-button/native-style-colors';
import { decodeText, getRandomColor } from 'app/lib/util';

export type TabIconSource = { uri: string; width: number; height: number; scale: number };

type LetterAvatarUser = { id?: string | number; display_name?: string } | null | undefined;

const iconCache = new Map<string, TabIconSource>();

/**
 * The letter avatar web draws for a profile without a photo (Profile `unit_wo_info`: the first
 * letter in `text-card` on `bg-<getRandomColor(id)>-500`), as an image for the native tab bar,
 * which takes images only. An offscreen react-native-svg view is drawn and exported as a PNG;
 * mount `capture` anywhere in the tree. Pass no user to skip it (a profile with a photo).
 */
export function useLetterTabIcon(user: LetterAvatarUser, sizePt: number): { icon: TabIconSource | null; capture: ReactNode } {
    const letter = user?.display_name ? decodeText(String(user.display_name)).slice(0, 1).toUpperCase() : '';
    const background = useNativeTokenColor(`bg-${getRandomColor(user?.id)}-500`) as string | undefined;
    const foreground = useNativeTokenColor('text-card') as string | undefined;
    const key = user && letter && background && foreground ? `${letter}|${background}|${foreground}|${sizePt}` : '';
    const [icons, setIcons] = useState<Record<string, TabIconSource>>({});
    const svgRef = useRef<Svg | null>(null);

    const icon = key ? icons[key] ?? iconCache.get(key) ?? null : null;
    if (!key || icon) return { icon, capture: null };

    // toDataURL renders the view's own bounds at the screen scale: a `sizePt` image at @2x/@3x.
    const scale = PixelRatio.get();
    const capture = (
        // Laid out off screen: it only exists to be exported.
        <View
            key={key}
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{ position: 'absolute', left: -1000, top: -1000, width: sizePt, height: sizePt }}
            onLayout={() => {
                svgRef.current?.toDataURL((base64: string) => {
                    const next = { uri: `data:image/png;base64,${base64}`, width: sizePt, height: sizePt, scale };
                    iconCache.set(key, next);
                    setIcons((prev) => ({ ...prev, [key]: next }));
                });
            }}
        >
            <Svg ref={svgRef} width={sizePt} height={sizePt} viewBox={`0 0 ${sizePt} ${sizePt}`}>
                <Circle cx={sizePt / 2} cy={sizePt / 2} r={sizePt / 2} fill={background} />
                <SvgText
                    x={sizePt / 2}
                    y={sizePt / 2}
                    fill={foreground}
                    fontSize={Math.round(sizePt * 0.46)}
                    fontWeight="600"
                    textAnchor="middle"
                    alignmentBaseline="central"
                >
                    {letter}
                </SvgText>
            </Svg>
        </View>
    );
    return { icon: null, capture };
}
