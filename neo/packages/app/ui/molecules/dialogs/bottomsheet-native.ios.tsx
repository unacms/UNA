import { useState, type ComponentProps, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BottomSheet, Button, Divider, Group, HStack, Host, Image, RNHostView, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
    accessibilityAddTraits,
    accessibilityHidden,
    accessibilityLabel,
    buttonBorderShape,
    buttonStyle,
    contentShape,
    font,
    foregroundStyle,
    frame,
    lineLimit,
    padding,
    presentationDetents,
    presentationDragIndicator,
    resizable,
    shapes,
    type PresentationDetent,
} from '@expo/ui/swift-ui/modifiers';
import { useBottomSheetData, type BottomSheetData, type BottomSheetMenu, type BottomSheetMenuItem } from 'app/context/bottomsheet';
import { getNativeIcon } from 'app/design/controls/neo-button/neo-button-expoui';
import { useNativeTokenColor } from 'app/design/controls/neo-button/native-style-colors';
import { appSetting, isEmoji, resolveMenuItemDescription } from 'app/lib/util';
import { Icon } from 'app/ui/atoms/icon';
import GorhomBottomSheet from './bottomsheet-content';

type SFSymbol = NonNullable<ComponentProps<typeof Image>['systemName']>;
type SheetRequest = Exclude<BottomSheetData, false | null>;

const nativeSheets = !!appSetting('theme', 'expo_ui', 'bottom_sheet');

const ICON_PT = 22;
// Snap points under a quarter of the screen were the JS sheet's collapsed state; a native sheet opens at its detents.
const MIN_FRACTION = 0.25;
const DEFAULT_DETENTS: PresentationDetent[] = ['medium', 'large'];

/**
 * iOS: bottom sheets (`setBottomSheetData`) as a native SwiftUI sheet on the system Liquid
 * Glass material (`theme.expo_ui.bottom_sheet`). A menu's rows (`menu`, from DropdownMenu)
 * are drawn natively and the sheet fits them; other content is hosted in the sheet, sized by
 * its `snapPoints`. `modal` requests and `bottom_sheet: false` use the JS sheet
 * (bottomsheet-content.js), which Android always uses (bottomsheet-native.tsx).
 */
export default function ElementBottomSheetContent() {
    const { bottomSheetData, setBottomSheetData } = useBottomSheetData();
    // The sheet slides out after the request is cleared; keep drawing what it showed.
    const [shown, setShown] = useState<SheetRequest | null>(null);
    if (bottomSheetData && bottomSheetData !== shown) setShown(bottomSheetData);
    const data = bottomSheetData || shown;

    if (!nativeSheets || data?.modal) return <GorhomBottomSheet />;

    const isPresented = !!bottomSheetData;
    const close = () => setBottomSheetData(null);
    const onIsPresentedChange = (presented: boolean) => {
        if (!presented && bottomSheetData) close();
    };

    return (
        // The sheet presents over the window; its host only needs to be mounted.
        <Host style={{ position: 'absolute', width: 0, height: 0 }}>
            <BottomSheet
                isPresented={isPresented}
                onIsPresentedChange={onIsPresentedChange}
                onDismiss={() => setShown(null)}
                fitToContents={!!data?.menu}
            >
                {sheetBody(data, close)}
            </BottomSheet>
        </Host>
    );
}

function sheetBody(data: SheetRequest | null, close: () => void) {
    if (!data) return null;
    if (data.menu) return <MenuSheet menu={data.menu} />;
    return <ContentSheet data={data} onClose={close} />;
}

/** A row's or sheet's title as text; React elements are left out (they never get native rows). */
function textOf(value: unknown): string {
    return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

function rowKey(item: BottomSheetMenuItem, index: number): string {
    return textOf(item.id) || textOf(item.name) || String(index);
}

/** A menu's rows, like the iOS More sheet: icon, title, a checkmark on the chosen one. */
function MenuSheet({ menu }: Readonly<{ menu: BottomSheetMenu }>) {
    const check = useNativeTokenColor('text-accent-foreground') as string | undefined;
    // Rows without an icon keep its space when others have one, so the titles line up.
    const reserveIcon = menu.items.some((item) => item.icon && item.type !== 'group_header');
    return (
        <Group modifiers={[presentationDragIndicator('hidden')]}>
            <VStack spacing={2} modifiers={[padding({ horizontal: 12, top: 20, bottom: 8 })]}>
                {menu.items.map((item, index) => {
                    const key = rowKey(item, index);
                    if (item.type === 'separator') {
                        return <Divider key={key} modifiers={[padding({ horizontal: 16, vertical: 8 })]} />;
                    }
                    if (item.type === 'group_header') {
                        return (
                            <Text
                                key={key}
                                modifiers={[
                                    font({ size: 13, weight: 'semibold' }),
                                    foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
                                    padding({ horizontal: 16, top: index ? 12 : 0, bottom: 4 }),
                                    frame({ maxWidth: Infinity, alignment: 'leading' }),
                                ]}
                            >
                                {textOf(item.title)}
                            </Text>
                        );
                    }
                    return <MenuRow key={key} item={item} check={check} reserveIcon={reserveIcon} onPress={() => menu.onPress(item)} />;
                })}
            </VStack>
        </Group>
    );
}

function MenuRow({ item, check, reserveIcon, onPress }: Readonly<{ item: BottomSheetMenuItem; check?: string; reserveIcon: boolean; onPress: () => void }>) {
    const description = resolveMenuItemDescription(item);
    let icon: ReactNode = null;
    if (item.icon) icon = <RowIcon icon={item.icon} />;
    else if (reserveIcon) icon = <Spacer modifiers={[frame({ width: ICON_PT, height: ICON_PT })]} />;
    return (
        <Button onPress={onPress} modifiers={[buttonStyle('plain'), ...(item.selected ? [accessibilityAddTraits(['isSelected'])] : [])]}>
            <HStack
                spacing={16}
                modifiers={[
                    padding({ horizontal: 16, vertical: 12 }),
                    frame({ maxWidth: Infinity, alignment: 'leading' }),
                    contentShape(shapes.capsule()),
                ]}
            >
                {icon}
                <VStack alignment="leading" spacing={2}>
                    <Text modifiers={[font({ size: 17, weight: 'medium' }), lineLimit(1)]}>{textOf(item.title)}</Text>
                    {description ? (
                        <Text
                            modifiers={[
                                font({ size: 15 }),
                                foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
                                lineLimit(2),
                            ]}
                        >
                            {description}
                        </Text>
                    ) : null}
                </VStack>
                <Spacer />
                {item.selected ? (
                    <Image systemName="checkmark" size={17} color={check} modifiers={[accessibilityHidden()]} />
                ) : null}
            </HStack>
        </Button>
    );
}

/**
 * Same glyph source as NeoButton (`Lucide/<kebab>` asset or SF Symbol); an emoji stays text, and
 * any other icon NEO can draw (a language glyph, a fork's own SVG) is hosted as its `Icon`.
 * Decorative: the row's title names it (an asset image would read as its asset name).
 */
function RowIcon({ icon }: Readonly<{ icon: string }>) {
    const hidden = accessibilityHidden();
    const box = frame({ width: ICON_PT, height: ICON_PT });
    if (isEmoji(icon)) {
        return <Text modifiers={[font({ size: ICON_PT - 2 }), box, hidden]}>{icon}</Text>;
    }
    const name = getNativeIcon(icon, appSetting('theme', 'expo_ui', 'button'));
    if (typeof name === 'string') {
        return name.startsWith('Lucide/')
            ? <Image assetName={name} modifiers={[resizable(), box, hidden]} />
            : <Image systemName={name as SFSymbol} size={ICON_PT - 2} modifiers={[box, hidden]} />;
    }
    return (
        <RNHostView matchContents>
            <View collapsable={false} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <Icon icon={icon} size={ICON_PT} className="text-foreground" />
            </View>
        </RNHostView>
    );
}

/** Any other content: a title row with a glass close button, then the content, scrolling within the detent. */
function ContentSheet({ data, onClose }: Readonly<{ data: SheetRequest; onClose: () => void }>) {
    const { t } = useTranslation();
    const { header, content, footer, isListView, showClose = true } = data as SheetRequest & {
        header?: ReactNode; footer?: ReactNode; isListView?: boolean;
    };
    const title = textOf(data.title);
    const detents = toDetents(data.snapPoints);
    // Opens at the second snap point, as the JS sheet did (its `index={1}`).
    const [detent, setDetent] = useState<PresentationDetent>(detents[Math.min(1, detents.length - 1)] ?? 'medium');
    const hasTitleRow = !!title || showClose;
    return (
        <Group
            modifiers={[
                presentationDetents(detents, { selection: detent, onSelectionChange: setDetent }),
                presentationDragIndicator('visible'),
            ]}
        >
            <VStack spacing={0}>
                {hasTitleRow ? (
                    <HStack modifiers={[padding({ leading: 16, trailing: 12, top: 16, bottom: 4 })]}>
                        {title ? (
                            <Text modifiers={[font({ size: 20, weight: 'bold' }), lineLimit(1)]}>{title}</Text>
                        ) : null}
                        <Spacer />
                        {showClose ? (
                            <Button
                                onPress={onClose}
                                modifiers={[buttonStyle('glass'), buttonBorderShape('circle'), accessibilityLabel(t('Close'))]}
                            >
                                <Image systemName="xmark" size={15} modifiers={[frame({ width: 28, height: 28 })]} />
                            </Button>
                        ) : null}
                    </HStack>
                ) : null}
                <RNHostView>
                    <View style={{ flex: 1 }}>
                        {header}
                        {isListView ? (
                            content
                        ) : (
                            <ScrollView keyboardShouldPersistTaps="always" contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}>
                                {content}
                                {footer}
                            </ScrollView>
                        )}
                    </View>
                </RNHostView>
            </VStack>
        </Group>
    );
}

/** The JS sheet's `snapPoints` ('50%', 300) as SwiftUI detents. */
function toDetents(snapPoints: (string | number)[] | undefined): PresentationDetent[] {
    const detents = new Map<string, PresentationDetent>();
    for (const point of snapPoints ?? []) {
        if (typeof point === 'number') {
            detents.set(`h${point}`, { height: point });
            continue;
        }
        const fraction = Number.parseFloat(point) / 100;
        if (!Number.isFinite(fraction) || fraction < MIN_FRACTION) continue;
        if (fraction >= 0.9) detents.set('large', 'large');
        else detents.set(`f${fraction}`, { fraction });
    }
    return detents.size ? [...detents.values()] : DEFAULT_DETENTS;
}
