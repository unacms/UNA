import { View, Pressable, ScrollView } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Icon } from 'app/ui/atoms/icon';
import { useMenuData } from 'app/context/menu-data';
import { menuRows, type SidebarRowEntry } from './app-sidebar-entries';
import type { AppSidebarListProps } from './app-sidebar.types';

/**
 * The sidebar's menus as the app's own rows, the web sidebar's look: Android, and iOS with `expo_ui.sidebar` off.
 * A row is a Pressable, not a NeoButton: a native NeoButton hosts only icon-like content, not a row.
 */
function Row({ row, narrow, onNavigate }: Readonly<{ row: SidebarRowEntry; narrow?: boolean; onNavigate: (href: string) => void }>) {
    const ink = row.current ? 'text-accent-foreground' : 'text-secondary-foreground';
    return (
        <Pressable
            onPress={() => row.href && onNavigate(row.href)}
            disabled={!row.href}
            accessibilityRole="link"
            accessibilityLabel={row.title}
            accessibilityState={{ selected: row.current }}
            className={`min-h-11 w-full flex-row items-center rounded-xl px-2 active:bg-muted ${row.current ? 'bg-accent' : ''} ${narrow ? 'justify-center' : ''}`}
        >
            <View className={`h-8 w-8 flex-none items-center justify-center rounded-full ${row.current ? '' : 'bg-muted/50'}`}>
                <Icon icon={row.icon} size="20" className={ink} />
            </View>
            {!narrow && <Text numberOfLines={1} className={`min-w-0 flex-1 px-3 text-sm leading-5 font-medium ${ink}`}>{row.title}</Text>}
            {!narrow && !!row.count && <Text className="flex-none px-2 text-xs leading-4 font-medium text-muted-foreground">{row.count}</Text>}
        </Pressable>
    );
}

function Menu({ object, url, narrow, onNavigate }: Readonly<{ object: string } & Omit<AppSidebarListProps, 'panels'>>) {
    const { menuData } = useMenuData(object);
    const rows = menuRows(object, menuData, url);
    if (!rows.length) return null;

    return (
        <View className="w-full gap-0.5 py-2">
            {rows.map((row) => <Row key={row.key} row={row} narrow={narrow} onNavigate={onNavigate} />)}
        </View>
    );
}

export default function AppSidebarRows({ panels, url, narrow, onNavigate }: Readonly<AppSidebarListProps>) {
    return (
        <ScrollView className="min-h-0 flex-1" contentContainerClassName="px-2 pb-2" showsVerticalScrollIndicator={false}>
            {panels.map((object) => <Menu key={object} object={object} url={url} narrow={narrow} onNavigate={onNavigate} />)}
        </ScrollView>
    );
}
