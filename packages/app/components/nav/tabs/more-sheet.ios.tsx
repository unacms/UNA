import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { BottomSheet, Button, Divider, Group, HStack, Host, Image, RNHostView, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
    accessibilityLabel,
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
import { useIosStyleColors, useNativeTokenColor } from 'app/design/controls/neo-button/native-style-colors';
import { appSetting } from 'app/lib/util';
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
const AGENT_BUTTON_PT = 44;

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

/** Selected-row colors (`native_tabs.selected`): fill + icon / label ink, as hex. */
type SelectedColors = { fill?: string; ink?: string };

/** Selected row: the toggled capsule of the active tab (system fill if unresolved). */
function selectedFill(selected: boolean | undefined, colors: SelectedColors) {
    if (!selected) return [];
    return [colors.fill
        ? background(colors.fill, shapes.capsule())
        : background({ type: 'hierarchical', style: 'quaternary' }, shapes.capsule())];
}

function Row({ item, selectedColors, onPress }: { item: MoreSheetItem; selectedColors: SelectedColors; onPress: () => void }) {
    const tint = item.selected ? selectedColors.ink : undefined;
    return (
        <Button onPress={onPress} modifiers={[buttonStyle('plain')]}>
            <HStack
                spacing={16}
                modifiers={[
                    padding({ horizontal: 16, vertical: 12 }),
                    frame({ maxWidth: Infinity, alignment: 'leading' }),
                    ...selectedFill(item.selected, selectedColors),
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
function ProfileHeader({ profile, selectedColors, onPress }: { profile: MoreSheetProfile; selectedColors: SelectedColors; onPress: () => void }) {
    const { t } = useTranslation();
    const { item, name, avatar } = profile;
    const tint = item.selected ? selectedColors.ink : undefined;
    return (
        <Button onPress={onPress} modifiers={[buttonStyle('plain')]}>
            <HStack
                spacing={14}
                modifiers={[
                    padding({ horizontal: 12, vertical: 8 }),
                    frame({ maxWidth: Infinity, alignment: 'leading' }),
                    ...selectedFill(item.selected, selectedColors),
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
                    <Text modifiers={[font({ size: 17, weight: 'semibold' }), lineLimit(1), ...(tint ? [foregroundStyle(tint)] : [])]}>
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

type IosStyleColors = { tint?: string; foreground?: string };

/**
 * Icon-only Agent button on the right of the header row — toggles the operator
 * agent. Colored like a `bordered` NeoButton (`expo_ui.button.iosColors`); while
 * the chat is open it takes the toggled look of selected tabs / subtabs.
 */
function AgentButton({ active, onPress }: { active?: boolean; onPress: () => void }) {
    const { t } = useTranslation();
    const iosColors = appSetting('theme', 'expo_ui', 'button')?.iosColors;
    const restingMap = iosColors?.bordered;
    // Same lookup as NeoButton: the style's own `selected`, else the shared toggled palette.
    const selectedMap = restingMap?.selected ?? iosColors?.glass?.selected;
    const resting = useIosStyleColors(restingMap) as IosStyleColors | undefined;
    const toggled = useIosStyleColors(selectedMap) as IosStyleColors | undefined;
    const colors = active ? toggled ?? resting : resting;
    return (
        <Button
            onPress={onPress}
            modifiers={[
                buttonStyle('plain'),
                accessibilityLabel(t(active ? 'operator_agent_close' : 'operator_agent_open')),
            ]}
        >
            <HStack
                modifiers={[
                    frame({ width: AGENT_BUTTON_PT, height: AGENT_BUTTON_PT }),
                    colors?.tint
                        ? background(colors.tint, shapes.circle())
                        : background({ type: 'hierarchical', style: 'quaternary' }, shapes.circle()),
                    contentShape(shapes.circle()),
                ]}
            >
                <RowIcon icon="Sparkles" color={colors?.foreground} />
            </HStack>
        </Button>
    );
}

export function NativeMoreSheet({ open, onOpenChange, items, onSelect, profile, onAgentPress, agentActive }: NativeMoreSheetProps) {
    const tabsSelected = appSetting('theme', 'native_tabs', 'selected');
    const selectedColors: SelectedColors = {
        fill: useNativeTokenColor(tabsSelected?.indicator) as string | undefined,
        ink: useNativeTokenColor(tabsSelected?.foreground) as string | undefined,
    };
    const hasHeader = !!profile || !!onAgentPress;
    return (
        // The sheet presents over the window; its host only needs to be mounted.
        <Host style={{ position: 'absolute', width: 0, height: 0 }}>
            <BottomSheet isPresented={open} onIsPresentedChange={onOpenChange} fitToContents>
                <Group modifiers={[presentationDragIndicator('hidden')]}>
                    <VStack spacing={2} modifiers={[padding({ horizontal: 12, top: 20, bottom: 8 })]}>
                        {hasHeader ? (
                            <HStack spacing={8} modifiers={[padding({ trailing: 4 })]}>
                                {profile ? <ProfileHeader profile={profile} selectedColors={selectedColors} onPress={() => onSelect(profile.item)} /> : <Spacer />}
                                {onAgentPress ? <AgentButton active={agentActive} onPress={onAgentPress} /> : null}
                            </HStack>
                        ) : null}
                        {hasHeader ? <Divider modifiers={[padding({ horizontal: 16, vertical: 8 })]} /> : null}
                        {items.map((item, index) => (
                            item.type === 'separator'
                                ? <Divider key={`separator-${index}`} modifiers={[padding({ horizontal: 16, vertical: 8 })]} />
                                : <Row key={item.id || `item-${index}`} item={item} selectedColors={selectedColors} onPress={() => onSelect(item)} />
                        ))}
                    </VStack>
                </Group>
            </BottomSheet>
        </Host>
    );
}
