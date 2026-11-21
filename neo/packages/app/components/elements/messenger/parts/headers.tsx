import { cloneElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { Text } from 'app/design/typography';
import { View, Row, ScrollView } from 'app/design/view';
import { NeoButton } from 'app/design/controls';
import { appSetting } from 'app/lib/util';
import DropdownMenu, { type DropdownMenuItemData } from 'app/ui/atoms/dropdown-menu';
import { getDataForMenu } from 'app/lib/util/menu';
import { useTranslation } from 'react-i18next';
import { MenuSwitcher, SearchInput, useDebouncedSearch } from 'app/components/elements/chat/parts/headers';
import type { AddButtons, ApiMenu, ConvoAction, MessengerMenuItem, ShortMenu } from 'app/components/elements/messenger/parts/messenger.types';

const isWeb = Platform.OS === 'web';

/** Native: `header.content` uses fixed `h-16`; messenger title/actions can paint taller. */
export function messengerHeaderContentClass() {
    const content = appSetting('layout', 'header', 'content');
    return isWeb ? content : String(content || '').replace(/\bh-16\b/g, 'min-h-16');
}

// Actions NEO can handle, keyed by item name in UNA's `bx_messenger_lot_info_menu`.
const CONVO_ACTIONS: Record<string, ConvoAction> = {
    // From the talk menu (`bx_messenger_lot_menu`), which UNA merges in for the app.
    star: { id: 'star', title: 'Mark as important', icon: 'Star' },
    mute: { id: 'mute', title: 'Mute', icon: 'Bell', iconOn: 'BellOff' },
    add_participants: { id: 'edit', title: 'Edit participants list', icon: 'Users' },
    info: { id: 'info', title: 'Info', icon: 'Info' },
    leave: { id: 'leave', title: 'Leave chat', icon: 'LogOut' },
    delete: { id: 'delete', title: 'Delete chat', icon: 'Trash' },
    media: { id: 'files', title: 'Files', icon: 'Paperclip' },
    clear: { id: 'clear', title: 'Clear history', icon: 'Eraser' },
    settings: { id: 'settings', title: 'Settings', icon: 'Settings' },
};

/**
 * Conversation actions from UNA's `bx_messenger_lot_info_menu` (Studio order;
 * UNA leaves out what the viewer may not run); items NEO can't handle are
 * dropped. Without the menu (older UNA) the basic actions are shown.
 */
export function getConvoActions(menu: ApiMenu | null | undefined): ConvoAction[] {
    // Older UNA has no services for clear / settings.
    if (!Array.isArray(menu?.items))
        return ['add_participants', 'info', 'leave', 'delete'].flatMap((name) => CONVO_ACTIONS[name] ?? []);

    return menu.items.flatMap((item) => {
        const action = item?.name ? CONVO_ACTIONS[item.name] : undefined;
        if (!action) return [];
        // Toggles (mute, star) carry their current state in `value`.
        const on = Number(item.value) === 1;
        return [{ ...action, title: item.title || action.title, icon: on && action.iconOn ? action.iconOn : action.icon, value: on }];
    });
}

type ConvoActionsMenuProps = {
    menu?: ShortMenu;
    onAction: (action: ConvoAction) => void;
    style?: string;
};

/**
 * Gear dropdown with the per-conversation actions. `menu` is the short menu
 * that comes with the conversation (`object` + `params`); its items depend on
 * the viewer's rights in that conversation, so they are requested on the first
 * press (like the comment manage menu). Mount with `key` per conversation.
 */
export function ConvoActionsMenu({ menu, onAction, style = 'glass' }: ConvoActionsMenuProps) {
    const { t } = useTranslation();
    const [actions, setActions] = useState<ConvoAction[] | null>(null);
    const [loading, setLoading] = useState(false);

    // Older UNA: no menu with the conversation, fixed actions.
    const lazy = !!menu?.object;
    const items = lazy ? actions : getConvoActions(null);

    // The native menu opens from an effect keyed on `items` / `onSelect`: both stay
    // stable across re-renders, or every header re-render would open it again.
    const onActionRef = useRef(onAction);
    useEffect(() => {
        onActionRef.current = onAction;
    }, [onAction]);

    const menuItems = useMemo<DropdownMenuItemData[]>(
        () => (items || []).map((item) => ({ ...item, title: t(item.title) })),
        [items, t]
    );

    const handleSelect = useCallback((item: DropdownMenuItemData) => {
        // Next press asks UNA again: toggles and rights may have changed.
        if (lazy) setActions(null);
        onActionRef.current(item as unknown as ConvoAction);
    }, [lazy]);

    const gear = (props: Record<string, unknown> = {}) => (
        <NeoButton
            style={style}
            controlSize="regular"
            borderShape="circle"
            image="Settings"
            accessibilityLabel={t('Settings')}
            {...props}
        />
    );

    if (!items) {
        return gear({
            loading,
            onPress: async () => {
                setLoading(true);
                try {
                    setActions(getConvoActions(await getDataForMenu(menu)));
                } finally {
                    setLoading(false);
                }
            },
        });
    }

    if (!items.length)
        return gear({ disabled: true });

    return (
        <DropdownMenu defaultOpen={lazy} onSelect={handleSelect} items={menuItems}>
            {gear()}
        </DropdownMenu>
    );
}

type ConvoSearchButtonProps = {
    open?: boolean;
    onPress: () => void;
    style?: string;
};

/** Toggles the search in the conversation's messages (pressed while open). */
export function ConvoSearchButton({ open = false, onPress, style = 'glass' }: ConvoSearchButtonProps) {
    const { t } = useTranslation();
    return (
        <NeoButton
            style={style}
            selected={open}
            selectedState="pressedToggle"
            controlSize="regular"
            borderShape="circle"
            image="Search"
            accessibilityLabel={t('Search')}
            onPress={onPress}
        />
    );
}

/** Search field that replaces the chat title while the search is open; reports the debounced text. */
export function ConvoSearchField({ onSearch }: { onSearch: (term: string) => void }) {
    const search = useDebouncedSearch(onSearch);
    return <SearchInput value={search.value} onChangeText={search.setValue} autoFocus />;
}

/**
 * Small screens, list mode: the conversation search, opened from the header's Search button and shown in the row under
 * it. Kept by the list's page, which passes the button to the header (`MobileListActions`) and the field to the row
 * under it (`MobileListSubHeader`).
 */
export function useMessengerListSearch(onSearch: (term: string) => void) {
    const [open, setOpen] = useState(false);
    const { value, setValue, reset } = useDebouncedSearch(onSearch);
    // Closing the field clears the term, so the list shows every conversation again.
    const toggle = useCallback(() => {
        if (open) reset();
        setOpen(!open);
    }, [open, reset]);
    return { open, toggle, value, setValue };
}

type MobileListActionsProps = {
    searchOpen: boolean;
    onSearchToggle: () => void;
    addButtons?: AddButtons;
};

/**
 * Small screens, list mode: the header's actions (its end), in place of the site's toolbar: Search, which searches the
 * conversations, and the buttons that start one. The header draws the rest as on every other page: the sidebar or menu
 * button, the section's icon and the title.
 */
export function MobileListActions({ searchOpen, onSearchToggle, addButtons }: Readonly<MobileListActionsProps>) {
    const { t } = useTranslation();
    return (
        <Row className="items-center gap-2">
            <NeoButton
                style="glass"
                selected={searchOpen}
                selectedState="pressedToggle"
                controlSize="regular"
                borderShape="circle"
                image="Search"
                accessibilityLabel={t('Search')}
                onPress={onSearchToggle}
            />
            {Array.isArray(addButtons)
                ? addButtons.map((button, i) => (button ? cloneElement(button, { key: button.key ?? i, style: 'glass' } as Record<string, unknown>) : null))
                : addButtons}
        </Row>
    );
}

type MobileListSubHeaderProps = {
    searchOpen: boolean;
    searchValue: string;
    onSearchChange: (value: string) => void;
    menuItems?: MessengerMenuItem[];
    menuIndex: number;
    onMenuChange: (index: number) => void;
};

/**
 * Small screens, list mode: the row under the header, as a section's tab row (the conductor's): the inbox/direct
 * switcher, and the search field while the search is open.
 */
export function MobileListSubHeader({ searchOpen, searchValue, onSearchChange, menuItems, menuIndex, onMenuChange }: Readonly<MobileListSubHeaderProps>) {
    const hasMenu = !!menuItems && menuItems.length > 1;
    if (!searchOpen && !hasMenu) return null;
    return (
        <View className="w-full">
            {searchOpen ? (
                <View className="w-full px-4 pb-2">
                    <SearchInput value={searchValue} onChangeText={onSearchChange} autoFocus />
                </View>
            ) : null}
            {hasMenu ? (
                // Same box as the conductor tab row (web `conductor.menu_cnt`, native-ui TabBar); the pills scroll
                // sideways when they don't fit, so they never widen the page.
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="w-full" contentContainerClassName="items-center px-4 py-1 min-h-14">
                    <MenuSwitcher items={menuItems} index={menuIndex} onChange={onMenuChange} />
                </ScrollView>
            ) : null}
        </View>
    );
}

type MobileChatHeaderProps = {
    title?: string;
    onBack: () => void;
    menu?: ShortMenu;
    menuKey?: string;
    onAction: (action: ConvoAction) => void;
    searchOpen?: boolean;
    onSearchToggle?: () => void;
    onSearch: (term: string) => void;
};

/** Small screens, chat mode: injected page header (back + title + actions). */
export function MobileChatHeader({ title, onBack, menu, menuKey, onAction, searchOpen = false, onSearchToggle, onSearch }: MobileChatHeaderProps) {
    const { t } = useTranslation();
    return (
        <Row className={`${appSetting('layout', 'page_content_width_default')} ${messengerHeaderContentClass()} max-w-full`}>
            <Row className="flex-1 min-w-0 items-center gap-3 px-4 ">
                <View className="shrink-0">
                    <NeoButton
                        style="glass"
                        controlSize="regular"
                        borderShape="circle"
                        image="ArrowLeft"
                        accessibilityLabel={t('Back')}
                        onPress={onBack}
                    />
                </View>
                {searchOpen ? (
                    <View className="flex-1 min-w-0">
                        <ConvoSearchField onSearch={onSearch} />
                    </View>
                ) : (
                    <Text numberOfLines={1} className="flex-1 min-w-0 font-bold text-card-foreground text-lg sm:text-xl tracking-tight">
                        {title}
                    </Text>
                )}
            </Row>
            <Row className="shrink-0 items-center justify-center gap-3 pe-4">
                {onSearchToggle ? <ConvoSearchButton open={searchOpen} onPress={onSearchToggle} style="glass" /> : null}
                <ConvoActionsMenu key={menuKey} menu={menu} onAction={onAction} style="glass" />
            </Row>
        </Row>
    );
}
