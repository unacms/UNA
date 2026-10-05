import { cloneElement, useState } from 'react';
import { Platform } from 'react-native';
import { Text } from 'app/design/typography';
import { View, Row } from 'app/design/view';
import { NeoButton } from 'app/design/controls';
import { appSetting } from 'app/lib/util';
import { getBackButtonWeb } from 'app/lib/common-helpers';
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { components } from 'app/components/registry';
import { useTranslation } from 'react-i18next';
import { MenuSwitcher, SearchInput, useDebouncedSearch } from 'app/components/elements/chat/parts/headers';

const isWeb = Platform.OS === 'web';

/** Native: `header.content` uses fixed `h-16`; messenger title/actions can paint taller. */
export function messengerHeaderContentClass() {
    const content = appSetting('layout', 'header', 'content');
    return isWeb ? content : String(content || '').replace(/\bh-16\b/g, 'min-h-16');
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
                // Same box as the conductor tab row (web `conductor.menu_cnt`,
                // native-ui TabBar), so pills sit at the same height under the title.
                <Row className="w-full items-center px-4 min-h-12 lg:min-h-14">
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
