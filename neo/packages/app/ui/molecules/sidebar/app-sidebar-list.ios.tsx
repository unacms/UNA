import type { ComponentProps } from 'react';
import { Button, HStack, Host, Image, List, Picker, Section, Spacer, Text } from '@expo/ui/swift-ui';
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
    pickerStyle,
    resizable,
    scrollContentBackground,
    shapes,
    tag,
    tint,
} from '@expo/ui/swift-ui/modifiers';
import { useNativeTokenColor } from 'app/design/controls/neo-button/native-style-colors';
import { getNativeIcon } from 'app/design/controls/neo-button/neo-button-expoui';
import { appSetting } from 'app/lib/util';
import { useMenuData } from 'app/context/menu-data';
import AppSidebarRows from './app-sidebar-rows';
import { useAppSidebarExpanded, setAppSidebarExpanded } from 'app/context/app-sidebar';
import { DRAWER_SECTION_OPEN_MAX, drawerRows, type PanelSection, type SidebarRowEntry } from './app-sidebar-entries';
import type { AppSidebarListProps, DrawerPref } from './app-sidebar.types';

type SFSymbol = NonNullable<ComponentProps<typeof Image>['systemName']>;

/**
 * iOS: the drawer's menus as one SwiftUI List in the sidebar style (`expo_ui.sidebar`; false = the app's own rows,
 * app-sidebar-rows). One Host for the whole list: native scrolling and Dynamic Type, and no Host per row. A submenu
 * is a Section, so each can load on its own; the Preferences are the last one, each a Picker that opens the system
 * menu of its options.
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

function Row({ row, colors, onNavigate }: Readonly<{ row: SidebarRowEntry; colors: Colors; onNavigate: (href: string) => void }>) {
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
                    padding({ horizontal: 10, vertical: 8 }),
                    frame({ maxWidth: Infinity, alignment: 'leading' }),
                    ...(row.current && colors.fill ? [background(colors.fill, shape)] : []),
                    contentShape(shape),
                ]}
            >
                {row.icon ? <RowIcon icon={row.icon} color={ink} /> : null}
                <Text modifiers={[font({ size: 16, weight: 'medium' }), lineLimit(1), ...(ink ? [foregroundStyle(ink)] : [])]}>
                    {row.title}
                </Text>
                <Spacer />
                {row.count ? (
                    <Text modifiers={[font({ size: 13, weight: 'medium' }), ...(colors.muted ? [foregroundStyle(colors.muted)] : [])]}>
                        {row.count}
                    </Text>
                ) : null}
            </HStack>
        </Button>
    );
}

/**
 * A menu of the panel: a section under the panel item's title. With a title it can be closed; a long one starts
 * closed, and what the viewer chooses stays while the app runs.
 */
function Menu({ section, url, colors, onNavigate }: Readonly<{ section: PanelSection; colors: Colors } & Pick<AppSidebarListProps, 'url' | 'onNavigate'>>) {
    const { object, title } = section;
    const { menuData } = useMenuData(object);
    const chosen = useAppSidebarExpanded(object);
    const rows = drawerRows(object, menuData, url);
    if (!rows.length) return null;

    const list = rows.map((row) => <Row key={row.key} row={row} colors={colors} onNavigate={onNavigate} />);
    if (!title) return <Section>{list}</Section>;

    // The page on screen keeps its menu open, so its row shows.
    const expanded = chosen ?? (rows.length <= DRAWER_SECTION_OPEN_MAX || rows.some((row) => row.current));
    return (
        <Section title={title} isExpanded={expanded} onIsExpandedChange={(next) => setAppSidebarExpanded(object, next)}>
            {list}
        </Section>
    );
}

/** A preference: its name with the icon of the current choice, and the choice, which opens the options' menu. */
function Pref({ pref, colors }: Readonly<{ pref: DrawerPref; colors: Colors }>) {
    return (
        <Picker
            selection={pref.value}
            onSelectionChange={(id) => pref.onSelect(String(id))}
            label={(
                <HStack spacing={12}>
                    <RowIcon icon={pref.icon} color={colors.label} />
                    <Text modifiers={[font({ size: 16, weight: 'medium' }), lineLimit(1), ...(colors.label ? [foregroundStyle(colors.label)] : [])]}>
                        {pref.title}
                    </Text>
                </HStack>
            )}
            modifiers={[
                pickerStyle('menu'),
                ...(colors.muted ? [tint(colors.muted)] : []),
                // The rows' own inset: 8pt to the row's shape, 10pt inside it.
                listRowInsets({ top: 1, bottom: 1, leading: 18, trailing: 10 }),
                listRowBackground(CLEAR),
                listRowSeparator('hidden'),
            ]}
        >
            {pref.options.map((option) => <Text key={option.id} modifiers={[tag(option.id)]}>{option.title}</Text>)}
        </Picker>
    );
}

function NativeList({ panels, prefs, url, onNavigate }: Readonly<AppSidebarListProps>) {
    const colors: Colors = {
        fill: useNativeTokenColor('bg-accent') as string | undefined,
        ink: useNativeTokenColor('text-accent-foreground') as string | undefined,
        label: useNativeTokenColor('text-secondary-foreground') as string | undefined,
        muted: useNativeTokenColor('text-muted-foreground') as string | undefined,
    };

    return (
        <Host style={{ flex: 1 }}>
            <List modifiers={[listStyle('sidebar'), scrollContentBackground('hidden'), listSectionSpacing(8)]}>
                {panels.map((section) => <Menu key={section.object} section={section} url={url} colors={colors} onNavigate={onNavigate} />)}
                {prefs.length ? (
                    <Section>
                        {prefs.map((pref) => <Pref key={pref.key} pref={pref} colors={colors} />)}
                    </Section>
                ) : null}
            </List>
        </Host>
    );
}

export default function AppSidebarList(props: Readonly<AppSidebarListProps>) {
    return appSetting('theme', 'expo_ui', 'sidebar') === false ? <AppSidebarRows {...props} /> : <NativeList {...props} />;
}
