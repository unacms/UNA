import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { BottomSheet, Button, Divider, Group, HStack, Host, Image, RNHostView, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
    background,
    buttonStyle,
    contentShape,
    font,
    foregroundStyle,
    frame,
    lineLimit,
    padding,
    presentationDragIndicator,
    resizable,
    shapes,
} from '@expo/ui/swift-ui/modifiers';
import { useTheme } from 'app/design/theme';
import { appSetting } from 'app/lib/util';
import { toHexColor } from 'app/lib/platform/native-color';
import { getNativeIcon } from 'app/design/controls/neo-button/neo-button-expoui';
import type { MoreSheetItem, MoreSheetProfile, NativeMoreSheetProps } from 'app/components/nav/tabs/more-sheet.types';

type SFSymbol = NonNullable<ComponentProps<typeof Image>['systemName']>;

/**
 * iOS: More opens a native sheet that lists every route (tab routes, divider,
 * overflow) — it rises over the tab bar and takes its place, on the system
 * Liquid Glass sheet material, like Revolut / Linear. `expo_ui.tabs.more_sheet`.
 * A `{profile}` More item heads it with the user's avatar and name.
 */
export const hasNativeMoreSheet = !!appSetting('theme', 'expo_ui', 'tabs')?.more_sheet;

const ICON_PT = 22;
const AVATAR_PT = 40;

const AVATAR_STYLE = StyleSheet.create({
    image: { width: AVATAR_PT, height: AVATAR_PT, borderRadius: AVATAR_PT / 2 },
}).image;

/** Same glyph source as NeoButton: `Lucide/<kebab>` asset or SF Symbol per `iosIconSource`. */
function RowIcon({ icon, color, size = ICON_PT }: { icon?: string; color?: string; size?: number }) {
    const name = getNativeIcon(icon, appSetting('theme', 'expo_ui', 'button'));
    if (typeof name !== 'string') return null;
    const box = frame({ width: size, height: size });
    return name.startsWith('Lucide/')
        ? <Image assetName={name} color={color} modifiers={[resizable(), box]} />
        : <Image systemName={name as SFSymbol} size={size - 2} color={color} modifiers={[box]} />;
}

/** Selected row: the same soft capsule the tab bar uses for the active tab. */
function selectedFill(selected?: boolean) {
    return selected ? [background({ type: 'hierarchical', style: 'quaternary' }, shapes.capsule())] : [];
}

function Row({ item, accent, onPress }: { item: MoreSheetItem; accent?: string; onPress: () => void }) {
    const tint = item.selected ? accent : undefined;
    return (
        <Button onPress={onPress} modifiers={[buttonStyle('plain')]}>
            <HStack
                spacing={16}
                modifiers={[
                    padding({ horizontal: 16, vertical: 12 }),
                    frame({ maxWidth: Infinity, alignment: 'leading' }),
                    ...selectedFill(item.selected),
                    contentShape(shapes.capsule()),
                ]}
            >
                <RowIcon icon={item.icon} color={tint} />
                <Text modifiers={[font({ size: 17, weight: 'medium' }), ...(tint ? [foregroundStyle(tint)] : [])]}>
                    {item.title ?? ''}
                </Text>
                <Spacer />
            </HStack>
        </Button>
    );
}

/** Avatar and name heading the sheet, like Linear's account header — opens the profile. */
function ProfileHeader({ profile, onPress }: { profile: MoreSheetProfile; onPress: () => void }) {
    const { t } = useTranslation();
    const { item, name, avatar } = profile;
    return (
        <Button onPress={onPress} modifiers={[buttonStyle('plain')]}>
            <HStack
                spacing={14}
                modifiers={[
                    padding({ horizontal: 12, vertical: 8 }),
                    frame({ maxWidth: Infinity, alignment: 'leading' }),
                    ...selectedFill(item.selected),
                    contentShape(shapes.capsule()),
                ]}
            >
                {avatar ? (
                    <RNHostView matchContents>
                        <View collapsable={false} pointerEvents="none">
                            <ExpoImage source={{ uri: avatar }} style={AVATAR_STYLE} contentFit="cover" />
                        </View>
                    </RNHostView>
                ) : (
                    <RowIcon icon="CircleUserRound" size={AVATAR_PT} />
                )}
                <VStack alignment="leading" spacing={2}>
                    <Text modifiers={[font({ size: 17, weight: 'semibold' }), lineLimit(1)]}>
                        {name || item.title || ''}
                    </Text>
                    <Text
                        modifiers={[
                            font({ size: 15 }),
                            foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
                            lineLimit(1),
                        ]}
                    >
                        {t('View profile')}
                    </Text>
                </VStack>
                <Spacer />
            </HStack>
        </Button>
    );
}

export function NativeMoreSheet({ open, onOpenChange, items, onSelect, profile }: NativeMoreSheetProps) {
    const { colors } = useTheme();
    const accent = toHexColor(colors.primary) ?? undefined;
    return (
        // The sheet presents over the window; its host only needs to be mounted.
        <Host style={{ position: 'absolute', width: 0, height: 0 }}>
            <BottomSheet isPresented={open} onIsPresentedChange={onOpenChange} fitToContents>
                <Group modifiers={[presentationDragIndicator('hidden')]}>
                    <VStack spacing={2} modifiers={[padding({ horizontal: 12, top: 20, bottom: 8 })]}>
                        {profile ? <ProfileHeader profile={profile} onPress={() => onSelect(profile.item)} /> : null}
                        {profile ? <Divider modifiers={[padding({ horizontal: 16, vertical: 8 })]} /> : null}
                        {items.map((item, index) => (
                            item.type === 'separator'
                                ? <Divider key={`separator-${index}`} modifiers={[padding({ horizontal: 16, vertical: 8 })]} />
                                : <Row key={item.id || `item-${index}`} item={item} accent={accent} onPress={() => onSelect(item)} />
                        ))}
                    </VStack>
                </Group>
            </BottomSheet>
        </Host>
    );
}
