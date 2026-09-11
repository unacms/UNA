import { cloneElement, useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { Text } from 'app/design/typography';
import { View, Row } from 'app/design/view';
import { Input, NeoButton } from 'app/design/controls';
import { appSetting } from 'app/lib/util';
import useDebounce from 'app/lib/hooks/use-debounce';
import { getBackButtonWeb } from 'app/lib/common-helpers';
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { getComponent } from 'app/components/registry';
import { useSetHeaderHeight } from 'app/context/jotai/layout';
import { useTranslation } from 'react-i18next';

const isWeb = Platform.OS === 'web';

/** Overlay wash so lists can scroll behind in-panel chrome (agent / comments). */
export const MESSENGER_OVERLAY_HEADER =
    'absolute top-0 inset-x-0 z-10 bg-linear-to-b from-background from-40% to-transparent pb-8';
export const MESSENGER_OVERLAY_COMPOSER_FADE =
    'bg-linear-to-t from-background from-40% to-transparent';

export function MessengerListInset({ height = 0 }) {
    return <View style={{ height, width: '100%', flexShrink: 0 }} />;
}

const SEARCH_DEBOUNCE_MS = 300;

/** Native: `header.content` uses fixed `h-16`; messenger title/actions can paint taller. */
export function messengerHeaderContentClass() {
    const content = appSetting('layout', 'header', 'content');
    return isWeb ? content : String(content || '').replace(/\bh-16\b/g, 'min-h-16');
}

/**
 * Local search field state with debounced notify. Typing stays local to the
 * component that renders the input; the parent only hears the debounced term
 * (skips the initial empty value — the parent loads via menu selection).
 */
export function useDebouncedSearch(onSearch) {
    const [value, setValue] = useState('');
    const debounced = useDebounce(value, SEARCH_DEBOUNCE_MS);
    const lastEmitted = useRef(null);
    const onSearchRef = useRef(onSearch);
    onSearchRef.current = onSearch;

    useEffect(() => {
        if (lastEmitted.current === null && debounced === '') {
            lastEmitted.current = debounced;
            return;
        }
        if (lastEmitted.current === debounced) return;
        lastEmitted.current = debounced;
        onSearchRef.current(debounced);
    }, [debounced]);

    const reset = useCallback(() => {
        setValue('');
        lastEmitted.current = '';
        onSearchRef.current('');
    }, []);

    return { value, setValue, reset };
}

function SearchInput({ value, onChangeText }) {
    const { t } = useTranslation();
    return (
            <Input
                className="w-full min-w-0"
                size="regular"
            rounded="full"
            name="search"
            placeholder={t('Search') + '...'}
            value={value}
            onChangeText={onChangeText}
        />
    );
}

const CONVO_MENU_ITEMS = [
    { id: 'edit', title: 'Edit participants list', icon: 'Users' },
    { id: 'info', title: 'Info', icon: 'Info' },
    { id: 'leave', title: 'Leave chat', icon: 'LogOut' },
    { id: 'delete', title: 'Delete chat', icon: 'Trash' },
];

/** Settings dropdown with the per-conversation actions (edit / info / leave / delete). */
export function ConvoActionsMenu({ onAction, style = 'glass' }) {
    const { t } = useTranslation();
    return (
        <DropdownMenu onSelect={onAction} items={CONVO_MENU_ITEMS.map((item) => ({ ...item, title: t(item.title) }))}>
            <NeoButton
                style={style}
                controlSize="regular"
                borderShape="circle"
                image="Settings"
                accessibilityLabel={t('Settings')}
            />
        </DropdownMenu>
    );
}

/** Inbox / direct tabs — conductor native-glass pills (idle glass, selected tinted). */
export function MenuSwitcher({ items, index, onChange }) {
    const { t } = useTranslation();
    if (!items || items.length < 2) return null;
    return (
        <Row className="items-center gap-2">
            {items.map((item, i) => (
                <NeoButton
                    key={item.name}
                    label={t(item.title)}
                    style="glass"
                    selected={i === index}
                    selectedState="pressedToggle"
                    controlSize="small"
                    borderShape="capsule"
                    haptics="Medium"
                    interactive
                    onPress={() => onChange(i)}
                />
            ))}
        </Row>
    );
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
    const setHeaderHeight = useSetHeaderHeight();
    const ContextSelector = getComponent('molecule', 'context_selector');
    const listTitle = t('Messages');

    // Native: the injected header can paint taller than the fixed h-16 chrome.
    const onHeaderLayout = useCallback((event) => {
        if (isWeb) return;
        const { height } = event.nativeEvent.layout;
        if (height > 0) {
            setHeaderHeight(height);
        }
    }, [setHeaderHeight]);

    return (
        <View onLayout={onHeaderLayout} className="w-full">
            <Row className={`${appSetting('layout', 'page_content_width_default')} ${messengerHeaderContentClass()} max-w-full`}>
                {showSearch ? (
                    <View className="flex-1 min-w-0 px-4">
                        <SearchInput value={search.value} onChangeText={search.setValue} />
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
                <Row className="w-full items-center px-4 pb-2">
                    <MenuSwitcher items={menuItems} index={menuIndex} onChange={onMenuChange} />
                </Row>
            ) : null}
        </View>
    );
}

/** Small screens, chat mode: injected page header (back + title + actions). */
export function MobileChatHeader({ title, onBack, onAction }) {
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
                <Text numberOfLines={1} className="flex-1 min-w-0 font-bold text-card-foreground text-lg sm:text-xl tracking-tight">
                    {title}
                </Text>
            </Row>
            <View className="shrink-0 items-center justify-center pe-4">
                <ConvoActionsMenu onAction={onAction} style="glass" />
            </View>
        </Row>
    );
}

/** Desktop: list title + search/create, with inbox/direct tabs underneath. */
export function ConvosPanelHeader({
    title,
    searchValue,
    onChangeSearch,
    onCloseSearch,
    addButtons,
    menuItems,
    menuIndex,
    onMenuChange,
    onLayout,
}) {
    const { t } = useTranslation();
    const [showSearch, setShowSearch] = useState(false);

    return (
        <View onLayout={onLayout} className="w-full">
            <Row className="min-h-16 items-center gap-2 px-4">
                {showSearch ? (
                    <View className="flex-1 min-w-0">
                        <SearchInput value={searchValue} onChangeText={onChangeSearch} />
                    </View>
                ) : (
                    <Text numberOfLines={1} className="flex-1 min-w-0 font-bold text-card-foreground text-2xl tracking-tight font-main">
                        {title}
                    </Text>
                )}
                <Row className="shrink-0 items-center gap-3">
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
                                if (prev) onCloseSearch?.();
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
                <Row className="items-center px-4 pb-2 pt-1">
                    <MenuSwitcher items={menuItems} index={menuIndex} onChange={onMenuChange} />
                </Row>
            ) : null}
        </View>
    );
}

/** Desktop: conversation title + actions row at the top of the chat panel. */
export function ChatPanelHeader({ title, onAction }) {
    return (
        <Row className="h-16 items-center max-w-full">
            <Row className="flex-1 min-w-0 items-center gap-3 px-4 overflow-hidden">
                <Text numberOfLines={1} className="flex-1 min-w-0 font-bold text-card-foreground text-lg sm:text-xl tracking-tight">
                    {title}
                </Text>
            </Row>
            <View className="shrink-0 items-center justify-center pe-4">
                <ConvoActionsMenu onAction={onAction} style="glass" />
            </View>
        </Row>
    );
}
