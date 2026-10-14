import { cloneElement, useState } from 'react';
import { Platform } from 'react-native';
import { Text } from 'app/design/typography';
import { View, Row } from 'app/design/view';
import { NeoButton } from 'app/design/controls';
import { appSetting } from 'app/lib/util';
import { getBackButtonWeb } from 'app/lib/common-helpers';
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { getDataForMenu } from 'app/lib/util/menu';
import { components } from 'app/components/registry';
import { useTranslation } from 'react-i18next';
import { MenuSwitcher, SearchInput, useDebouncedSearch } from 'app/components/elements/chat/parts/headers';

const isWeb = Platform.OS === 'web';

/** Native: `header.content` uses fixed `h-16`; messenger title/actions can paint taller. */
export function messengerHeaderContentClass() {
    const content = appSetting('layout', 'header', 'content');
    return isWeb ? content : String(content || '').replace(/\bh-16\b/g, 'min-h-16');
}

// Actions NEO can handle, keyed by item name in UNA's `bx_messenger_lot_info_menu`.
const CONVO_ACTIONS = {
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
export function getConvoActions(menu) {
    // Older UNA has no services for clear / settings.
    if (!Array.isArray(menu?.items))
        return ['add_participants', 'info', 'leave', 'delete'].map((name) => CONVO_ACTIONS[name]);

    return menu.items
        .filter((item) => CONVO_ACTIONS[item?.name])
        .map((item) => {
            const action = CONVO_ACTIONS[item.name];
            // Toggles (mute, star) carry their current state in `value`.
            const on = Number(item.value) === 1;
            return { ...action, title: item.title || action.title, icon: on && action.iconOn ? action.iconOn : action.icon, value: on };
        });
}

/**
 * Gear dropdown with the per-conversation actions. `menu` is the short menu
 * that comes with the conversation (`object` + `params`); its items depend on
 * the viewer's rights in that conversation, so they are requested on the first
 * press (like the comment manage menu). Mount with `key` per conversation.
 */
export function ConvoActionsMenu({ menu, onAction, style = 'glass' }) {
    const { t } = useTranslation();
    const [actions, setActions] = useState(null);
    const [loading, setLoading] = useState(false);

    const gear = (props) => (
        <NeoButton
            style={style}
            controlSize="regular"
            borderShape="circle"
            image="Settings"
            accessibilityLabel={t('Settings')}
            {...props}
        />
    );

    // Older UNA: no menu with the conversation, fixed actions.
    const lazy = !!menu?.object;
    const items = lazy ? actions : getConvoActions(null);

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
        <DropdownMenu
            defaultOpen={lazy}
            onSelect={(item) => {
                // Next press asks UNA again: toggles and rights may have changed.
                if (lazy) setActions(null);
                onAction(item);
            }}
            items={items.map((item) => ({ ...item, title: t(item.title) }))}
        >
            {gear()}
        </DropdownMenu>
    );
}

/** Toggles the search in the conversation's messages (pressed while open). */
export function ConvoSearchButton({ open, onPress, style = 'glass' }) {
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
export function ConvoSearchField({ onSearch }) {
    const search = useDebouncedSearch(onSearch);
    return <SearchInput value={search.value} onChangeText={search.setValue} autoFocus />;
}

/**
 * Small screens, list mode: injected page header (stable "Messages" title +
 * search + create, plus the inbox/direct switcher row). The switcher lives
 * inside this component because PageHeader skips the `subHeader` slot when a
 * custom `header` is injected.
 */
export function MobileListHeader({ pageData, onSearch, addButtons, menuItems, menuIndex, onMenuChange }) {
    const { t } = useTranslation();
    const [showSearch, setShowSearch] = useState(false);
    const search = useDebouncedSearch(onSearch);
    const ContextSelector = components['molecule']['context_selector'];
    const listTitle = t('Messages');

    // Header height comes from PageHeader's own onLayout, which also counts the
    // edge-to-edge status bar inset. Measuring here would publish only this
    // content's height and slide the first list row under the inbox/direct row.
    return (
        <View className="w-full">
            <Row className={`${appSetting('layout', 'page_content_width_default')} ${messengerHeaderContentClass()} max-w-full`}>
                {showSearch ? (
                    <View className="flex-1 min-w-0 px-4">
                        <SearchInput value={search.value} onChangeText={search.setValue} autoFocus />
                    </View>
                ) : (
                    <Row className="flex-1 min-w-0 items-center gap-3 px-4 ">
                        {appSetting('messenger', 'back_button') ? getBackButtonWeb() : null}
                        {appSetting('context_selector', 'show_always') ? (
                            <ContextSelector url={pageData?.url} uri={pageData?.uri} data={pageData?.context} />
                        ) : (
                            <Text className="font-bold truncate flex-1 min-w-0 text-card-foreground text-2xl tracking-tight font-main" numberOfLines={1}>
                                {listTitle}
                            </Text>
                        )}
                    </Row>
                )}
                <Row className="my-auto shrink-0 items-center gap-3 pe-4">
                    <NeoButton
                        style="glass"
                        selected={showSearch}
                        selectedState="pressedToggle"
                        controlSize="regular"
                        borderShape="circle"
                        image="Search"
                        accessibilityLabel={t('Search')}
                        onPress={() => {
                            setShowSearch((prev) => {
                                if (prev) search.reset();
                                return !prev;
                            });
                        }}
                    />
                    {Array.isArray(addButtons)
                        ? addButtons.map((button, i) => (button ? cloneElement(button, { key: button.key ?? i, style: 'glass' }) : null))
                        : addButtons}
                </Row>
            </Row>
            {menuItems?.length > 1 ? (
                // Same box as the conductor tab row (web `conductor.menu_cnt`,
                // native-ui TabBar), so pills sit at the same height under the title.
                <Row className="w-full items-center px-4 min-h-13 lg:min-h-14 mb-0.5 lg:mb-0">
                    <MenuSwitcher items={menuItems} index={menuIndex} onChange={onMenuChange} />
                </Row>
            ) : null}
        </View>
    );
}

/** Small screens, chat mode: injected page header (back + title + actions). */
export function MobileChatHeader({ title, onBack, menu, menuKey, onAction, searchOpen, onSearchToggle, onSearch }) {
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
