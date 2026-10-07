import { useEffect, useRef, useState } from 'react';
import { Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
    Column,
    HorizontalDivider,
    Host,
    Image,
    ModalBottomSheet,
    RNHostView,
    Row,
    Spacer,
    Text,
    type ModalBottomSheetRef,
} from '@expo/ui/jetpack-compose';
import {
    background,
    clickable,
    clip,
    fillMaxWidth,
    padding,
    Shapes,
    size,
    weight,
} from '@expo/ui/jetpack-compose/modifiers';
import { useNativeTokenColor } from 'app/design/controls/neo-button/native-style-colors';
import { nativeFonts } from 'app/design/fonts/native-fonts';
import { appSetting } from 'app/lib/util';
import { Icon } from 'app/ui/atoms/icon';
import type { MoreSheetItem, MoreSheetProfile, NativeMoreSheetProps } from 'app/components/nav/tabs/more-sheet.types';

/**
 * Android: More opens a Material 3 modal bottom sheet (Jetpack Compose via
 * Expo UI) — the counterpart of the iOS Liquid Glass sheet. Same content: a
 * `{profile}` header with the agent button, then the tab routes, a divider and
 * the More routes. `expo_ui.tabs.more_sheet`.
 */
export const hasNativeMoreSheet = !!appSetting('theme', 'expo_ui', 'tabs')?.more_sheet;

const ICON_DP = 24;
const AVATAR_DP = 44;
const AGENT_BUTTON_DP = 44;
// Compose resolves the family through React Native's font manager ('Inter'),
// or the platform default for the system font.
const FONT_FAMILY = nativeFonts.main === 'sans-serif' ? 'default' : nativeFonts.main;

/**
 * The app's own Lucide icon, hosted in the sheet. Compose's vector loader fills
 * the stroke-only Lucide drawables, so they can't be Compose `Icon`s. The host
 * sends touches inside it to JS, past the row's Compose `clickable`, so the
 * icon takes the row's press itself.
 */
function RowIcon({ icon, color, sizeDp = ICON_DP, label, onPress }: { icon?: string; color?: string; sizeDp?: number; label?: string; onPress?: () => void }) {
    if (!icon) return null;
    return (
        <RNHostView matchContents>
            <Pressable
                collapsable={false}
                onPress={onPress}
                disabled={!onPress}
                accessibilityLabel={label}
                style={{ width: sizeDp, height: sizeDp }}
            >
                <Icon icon={icon} width={sizeDp} height={sizeDp} color={color} />
            </Pressable>
        </RNHostView>
    );
}

/**
 * Sheet colors as hex: `fill` / `ink` = the selected tab's indicator and ink
 * (`native_tabs.selected`, as on the Android bar); `muted` = secondary text;
 * `rest` / `restInk` = the agent button at rest.
 */
type SheetColors = { fill?: string; ink?: string; muted?: string; rest?: string; restInk?: string };

function rowModifiers(selected: boolean | undefined, colors: SheetColors, onPress: () => void, vertical: number) {
    return [
        fillMaxWidth(),
        clip(Shapes.RoundedCorner(28)),
        ...(selected && colors.fill ? [background(colors.fill)] : []),
        clickable(onPress),
        padding(16, vertical, 16, vertical),
    ];
}

function SheetRow({ item, selectedColors, onPress }: { item: MoreSheetItem; selectedColors: SheetColors; onPress: () => void }) {
    const ink = item.selected ? selectedColors.ink : undefined;
    return (
        <Row
            horizontalArrangement={{ spacedBy: 16 }}
            verticalAlignment="center"
            modifiers={rowModifiers(item.selected, selectedColors, onPress, 14)}
        >
            <RowIcon icon={item.icon} color={ink ?? selectedColors.restInk} onPress={onPress} />
            <Text color={ink} style={{ fontSize: 16, fontWeight: '500', fontFamily: FONT_FAMILY }} maxLines={1}>
                {item.title ?? ''}
            </Text>
        </Row>
    );
}

/** Avatar and name heading the sheet — opens the profile. */
function ProfileHeader({ profile, selectedColors, onPress }: { profile: MoreSheetProfile; selectedColors: SheetColors; onPress: () => void }) {
    const { t } = useTranslation();
    const { item, name, avatar } = profile;
    const ink = item.selected ? selectedColors.ink : undefined;
    return (
        <Row
            horizontalArrangement={{ spacedBy: 14 }}
            verticalAlignment="center"
            modifiers={[weight(1), ...rowModifiers(item.selected, selectedColors, onPress, 8)]}
        >
            {avatar ? (
                <Image
                    source={{ uri: avatar }}
                    contentScale="crop"
                    contentDescription={null}
                    modifiers={[size(AVATAR_DP, AVATAR_DP), clip(Shapes.Circle)]}
                />
            ) : (
                <RowIcon icon="CircleUserRound" sizeDp={AVATAR_DP} color={selectedColors.restInk} onPress={onPress} />
            )}
            <Column>
                <Text color={ink} style={{ fontSize: 17, fontWeight: '600', fontFamily: FONT_FAMILY }} maxLines={1}>
                    {name || item.title || ''}
                </Text>
                <Text style={{ fontSize: 14, fontFamily: FONT_FAMILY }} color={selectedColors.muted} maxLines={1}>
                    {t('View profile')}
                </Text>
            </Column>
        </Row>
    );
}

/**
 * Icon-only Agent button on the right of the header row — toggles the operator
 * agent. A muted circle at rest; the selected tab's indicator / ink while the
 * chat is open.
 */
function AgentButton({ active, colors, onPress }: { active?: boolean; colors: SheetColors; onPress: () => void }) {
    const { t } = useTranslation();
    const fill = active ? colors.fill : colors.rest;
    const ink = active ? colors.ink : colors.restInk;
    return (
        <Row
            horizontalArrangement="center"
            verticalAlignment="center"
            modifiers={[
                size(AGENT_BUTTON_DP, AGENT_BUTTON_DP),
                clip(Shapes.Circle),
                ...(fill ? [background(fill)] : []),
                clickable(onPress),
            ]}
        >
            <RowIcon icon="Sparkles" color={ink} sizeDp={22} label={t(active ? 'operator_agent_close' : 'operator_agent_open')} onPress={onPress} />
        </Row>
    );
}

export function NativeMoreSheet({ open, onOpenChange, items, onSelect, profile, onAgentPress, agentActive }: NativeMoreSheetProps) {
    const tabsSelected = appSetting('theme', 'native_tabs', 'selected');
    const colors: SheetColors = {
        fill: useNativeTokenColor(tabsSelected?.indicator) as string | undefined,
        ink: useNativeTokenColor(tabsSelected?.foreground) as string | undefined,
        muted: useNativeTokenColor('text-muted-foreground') as string | undefined,
        rest: useNativeTokenColor('bg-muted') as string | undefined,
        restInk: useNativeTokenColor('text-foreground') as string | undefined,
    };
    const sheetRef = useRef<ModalBottomSheetRef>(null);

    // The sheet is shown while mounted. When the parent closes it (a row was
    // picked), animate it out first, then unmount.
    const [mounted, setMounted] = useState(open);
    if (open && !mounted) setMounted(true);
    useEffect(() => {
        if (open || !mounted) return;
        let cancelled = false;
        const hide = sheetRef.current?.hide() ?? Promise.resolve();
        hide.finally(() => {
            if (!cancelled) setMounted(false);
        });
        return () => {
            cancelled = true;
        };
    }, [open, mounted]);

    // Swipe down, back or a scrim tap: Compose has already hidden the sheet.
    const handleDismiss = () => {
        setMounted(false);
        onOpenChange(false);
    };

    const hasHeader = !!profile || !!onAgentPress;
    return (
        // The sheet is a window of its own; its host only needs to be mounted.
        <Host style={{ position: 'absolute', width: 0, height: 0 }}>
            {mounted ? (
                <ModalBottomSheet ref={sheetRef} onDismissRequest={handleDismiss} skipPartiallyExpanded>
                    <Column modifiers={[padding(12, 0, 12, 24)]} verticalArrangement={{ spacedBy: 2 }}>
                        {hasHeader ? (
                            <Row verticalAlignment="center" horizontalArrangement={{ spacedBy: 8 }} modifiers={[fillMaxWidth(), padding(0, 0, 4, 0)]}>
                                {profile ? (
                                    <ProfileHeader profile={profile} selectedColors={colors} onPress={() => onSelect(profile.item)} />
                                ) : (
                                    <Spacer modifiers={[weight(1)]} />
                                )}
                                {onAgentPress ? <AgentButton active={agentActive} colors={colors} onPress={onAgentPress} /> : null}
                            </Row>
                        ) : null}
                        {hasHeader ? <HorizontalDivider modifiers={[padding(16, 8, 16, 8)]} /> : null}
                        {items.map((item, index) => (
                            item.type === 'separator'
                                ? <HorizontalDivider key={`separator-${index}`} modifiers={[padding(16, 8, 16, 8)]} />
                                : <SheetRow key={item.id || `item-${index}`} item={item} selectedColors={colors} onPress={() => onSelect(item)} />
                        ))}
                    </Column>
                </ModalBottomSheet>
            ) : null}
        </Host>
    );
}
