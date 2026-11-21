import { StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { View, Pressable, ScrollView } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Icon } from 'app/ui/atoms/icon';
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { useMenuData } from 'app/context/menu-data';
import { useAppSidebarExpanded, setAppSidebarExpanded } from 'app/context/app-sidebar';
import { DRAWER_SECTION_OPEN_MAX, drawerRows, type PanelSection, type SidebarRowEntry } from './app-sidebar-entries';
import type { AppSidebarListProps, DrawerPref } from './app-sidebar.types';

const PICTURE_STYLE = StyleSheet.create({ image: { width: 24, height: 24, borderRadius: 12 } }).image;

/**
 * The drawer's menus as the app's own rows, the web sidebar's look: Android, and iOS with `expo_ui.sidebar` off.
 * A row is a Pressable, not a NeoButton: a native NeoButton hosts only icon-like content, not a row.
 */
function Row({ row, onNavigate }: Readonly<{ row: SidebarRowEntry; onNavigate: (href: string) => void }>) {
    const ink = row.current ? 'text-accent-foreground' : 'text-secondary-foreground';
    return (
        <Pressable
            onPress={() => row.href && onNavigate(row.href)}
            accessibilityRole="link"
            accessibilityLabel={row.title}
            accessibilityState={{ selected: row.current }}
            className={`min-h-11 w-full flex-row items-center rounded-xl px-2 active:bg-muted ${row.current ? 'bg-accent' : ''}`}
        >
            {!!row.image && (
                <View className="h-8 w-8 flex-none items-center justify-center">
                    <ExpoImage source={{ uri: row.image }} style={PICTURE_STYLE} contentFit="cover" />
                </View>
            )}
            {!row.image && !!row.icon && (
                <View className={`h-8 w-8 flex-none items-center justify-center rounded-full ${row.current ? '' : 'bg-muted/50'}`}>
                    <Icon icon={row.icon} size="20" className={ink} />
                </View>
            )}
            <Text numberOfLines={1} className={`min-w-0 flex-1 px-3 text-sm leading-5 font-medium ${ink}`}>{row.title}</Text>
            {!!row.count && <Text className="flex-none px-2 text-xs leading-4 font-medium text-muted-foreground">{row.count}</Text>}
        </Pressable>
    );
}

/**
 * A menu of the panel under the panel item's title. With a title it can be closed; a long one starts closed, and
 * what the viewer chooses stays while the app runs.
 */
function Menu({ section, url, onNavigate }: Readonly<{ section: PanelSection } & Pick<AppSidebarListProps, 'url' | 'onNavigate'>>) {
    const { object, title } = section;
    const { menuData } = useMenuData(object);
    const chosen = useAppSidebarExpanded(object);
    const rows = drawerRows(object, menuData, url);
    if (!rows.length) return null;

    // The page on screen keeps its menu open, so its row shows.
    const expanded = !title || (chosen ?? (rows.length <= DRAWER_SECTION_OPEN_MAX || rows.some((row) => row.current)));
    return (
        <View className="w-full gap-0.5 py-2">
            {!!title && (
                <Pressable
                    onPress={() => setAppSidebarExpanded(object, !expanded)}
                    accessibilityRole="button"
                    accessibilityLabel={title}
                    accessibilityState={{ expanded }}
                    className="min-h-11 w-full flex-row items-center justify-between rounded-xl px-3 active:bg-muted"
                >
                    <Text numberOfLines={1} className="min-w-0 flex-1 text-sm leading-5 font-semibold text-foreground">{title}</Text>
                    <Icon icon={expanded ? 'ChevronDown' : 'ChevronRight'} size="16" className="text-muted-foreground" />
                </Pressable>
            )}
            {expanded && rows.map((row) => <Row key={row.key} row={row} onNavigate={onNavigate} />)}
        </View>
    );
}

/** A preference: a row with its name and the current choice, which opens the options' menu. */
function Pref({ pref }: Readonly<{ pref: DrawerPref }>) {
    const { t } = useTranslation();
    const current = pref.options.find((option) => option.id === pref.value);
    return (
        <DropdownMenu
            items={pref.options.map((option) => ({ key: option.id, id: option.id, name: option.id, title: option.title, selected: option.id === pref.value }))}
            onSelect={(item) => pref.onSelect(String(item.id))}
            triggerAccessibilityLabel={`${pref.title}: ${current?.title ?? t(pref.value)}`}
        >
            <View className="min-h-11 w-full flex-row items-center rounded-xl px-2">
                <View className="h-8 w-8 flex-none items-center justify-center rounded-full bg-muted/50">
                    <Icon icon={pref.icon} size="20" className="text-secondary-foreground" />
                </View>
                <Text numberOfLines={1} className="min-w-0 flex-1 px-3 text-sm leading-5 font-medium text-secondary-foreground">{pref.title}</Text>
                <Text numberOfLines={1} className="flex-none px-2 text-sm leading-5 text-muted-foreground">{current?.title ?? ''}</Text>
            </View>
        </DropdownMenu>
    );
}

export default function AppSidebarRows({ panels, prefs, url, onNavigate }: Readonly<AppSidebarListProps>) {
    return (
        <ScrollView className="min-h-0 flex-1" contentContainerClassName="px-2 pb-2" showsVerticalScrollIndicator={false}>
            {panels.map((section) => <Menu key={section.object} section={section} url={url} onNavigate={onNavigate} />)}
            {prefs.length > 0 && (
                <View className="w-full gap-0.5 py-2">
                    {prefs.map((pref) => <Pref key={pref.key} pref={pref} />)}
                </View>
            )}
        </ScrollView>
    );
}
