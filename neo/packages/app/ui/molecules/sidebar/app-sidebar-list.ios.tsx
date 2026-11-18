import type { ComponentProps } from 'react';
import { Button, HStack, Host, Image, List, Section, Spacer, Text } from '@expo/ui/swift-ui';
import {
    accessibilityLabel,
    background,
    buttonStyle,
    contentShape,
    font,
    foregroundStyle,
    frame,
    lineLimit,
    listRowBackground,
    listRowInsets,
    listRowSeparator,
    listSectionSpacing,
    listStyle,
    padding,
    resizable,
    scrollContentBackground,
    shapes,
} from '@expo/ui/swift-ui/modifiers';
import { useNativeTokenColor } from 'app/design/controls/neo-button/native-style-colors';
import { getNativeIcon } from 'app/design/controls/neo-button/neo-button-expoui';
import { appSetting } from 'app/lib/util';
import { useMenuData } from 'app/context/menu-data';
import AppSidebarRows from './app-sidebar-rows';
import { menuRows, type SidebarRowEntry } from './app-sidebar-entries';
import type { AppSidebarListProps } from './app-sidebar.types';

type SFSymbol = NonNullable<ComponentProps<typeof Image>['systemName']>;

/**
 * iOS: the sidebar's menus as one SwiftUI List in the sidebar style (`expo_ui.sidebar`; false = the app's own rows,
 * app-sidebar-rows). One Host for the whole list: native scrolling and Dynamic Type, and no Host per row. A submenu
 * is a Section, so each can load on its own.
 */
const ICON_PT = 20;
const ROW_RADIUS = 12;
const CLEAR = '#00000000';

type Colors = { fill?: string; ink?: string; label?: string; muted?: string };

/** Same glyph source as NeoButton: `Lucide/<kebab>` asset or SF Symbol per `iosIconSource`. */
function RowIcon({ icon, color }: Readonly<{ icon: string; color?: string }>) {
    const name = getNativeIcon(icon, appSetting('theme', 'expo_ui', 'button')) ?? getNativeIcon('Circle', appSetting('theme', 'expo_ui', 'button'));
    if (typeof name !== 'string') return null;
    const box = frame({ width: ICON_PT, height: ICON_PT });
    return name.startsWith('Lucide/')
        ? <Image assetName={name} color={color} modifiers={[resizable(), box]} />
        : <Image systemName={name as SFSymbol} size={ICON_PT - 2} color={color} modifiers={[box]} />;
}

function Row({ row, narrow, colors, onNavigate }: Readonly<{ row: SidebarRowEntry; narrow?: boolean; colors: Colors; onNavigate: (href: string) => void }>) {
    const ink = row.current ? colors.ink : colors.label;
    const shape = shapes.roundedRectangle({ cornerRadius: ROW_RADIUS, roundedCornerStyle: 'continuous' });
    return (
        <Button
            onPress={() => { if (row.href) onNavigate(row.href); }}
            modifiers={[
                buttonStyle('plain'),
                accessibilityLabel(row.title),
                listRowInsets({ top: 1, bottom: 1, leading: 8, trailing: 8 }),
                listRowBackground(CLEAR),
                listRowSeparator('hidden'),
            ]}
        >
            <HStack
                spacing={12}
                modifiers={[
                    padding({ horizontal: narrow ? 0 : 10, vertical: 8 }),
                    frame({ maxWidth: Infinity, alignment: narrow ? 'center' : 'leading' }),
                    ...(row.current && colors.fill ? [background(colors.fill, shape)] : []),
                    contentShape(shape),
                ]}
            >
                <RowIcon icon={row.icon} color={ink} />
                {narrow ? null : (
                    <Text modifiers={[font({ size: 16, weight: 'medium' }), lineLimit(1), ...(ink ? [foregroundStyle(ink)] : [])]}>
                        {row.title}
                    </Text>
                )}
                {narrow ? null : <Spacer />}
                {!narrow && row.count ? (
                    <Text modifiers={[font({ size: 13, weight: 'medium' }), ...(colors.muted ? [foregroundStyle(colors.muted)] : [])]}>
                        {row.count}
                    </Text>
                ) : null}
            </HStack>
        </Button>
    );
}

function Menu({ object, url, narrow, colors, onNavigate }: Readonly<{ object: string; colors: Colors } & Omit<AppSidebarListProps, 'panels'>>) {
    const { menuData } = useMenuData(object);
    const rows = menuRows(object, menuData, url);
    if (!rows.length) return null;

    return (
        <Section>
            {rows.map((row) => <Row key={row.key} row={row} narrow={narrow} colors={colors} onNavigate={onNavigate} />)}
        </Section>
    );
}

function NativeList({ panels, url, narrow, onNavigate }: Readonly<AppSidebarListProps>) {
    const colors: Colors = {
        fill: useNativeTokenColor('bg-accent') as string | undefined,
        ink: useNativeTokenColor('text-accent-foreground') as string | undefined,
        label: useNativeTokenColor('text-secondary-foreground') as string | undefined,
        muted: useNativeTokenColor('text-muted-foreground') as string | undefined,
    };

    return (
        <Host style={{ flex: 1 }}>
            <List modifiers={[listStyle('sidebar'), scrollContentBackground('hidden'), listSectionSpacing(8)]}>
                {panels.map((object) => <Menu key={object} object={object} url={url} narrow={narrow} colors={colors} onNavigate={onNavigate} />)}
            </List>
        </Host>
    );
}

export default function AppSidebarList(props: Readonly<AppSidebarListProps>) {
    return appSetting('theme', 'expo_ui', 'sidebar') === false ? <AppSidebarRows {...props} /> : <NativeList {...props} />;
}
