import { cloneElement, isValidElement, useCallback, useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { Text } from 'app/design/typography';
import { View, Row } from 'app/design/view';
import { Input, NeoButton } from 'app/design/controls';
import useDebounce from 'app/lib/hooks/use-debounce';
import { useTranslation } from 'react-i18next';

/**
 * Overlay chrome so lists can scroll behind it (agent / comments). Position
 * and wash are split so iOS can swap the wash for a native blur (`EdgeBlurView`).
 */
export const CHAT_OVERLAY_HEADER = 'absolute top-0 inset-x-0 z-10 pb-8';
export const CHAT_OVERLAY_HEADER_FADE =
    'bg-linear-to-b from-background from-40% to-transparent';
export const CHAT_OVERLAY_COMPOSER_FADE =
    'bg-linear-to-t from-background from-40% to-transparent';

export function ListInset({ height = 0 }: { height?: number }) {
    return <View style={{ height, width: '100%', flexShrink: 0 }} />;
}

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Local search field state with debounced notify. Typing stays local to the
 * component that renders the input; the parent only hears the debounced term
 * (skips the initial empty value — the parent loads via menu selection).
 */
export function useDebouncedSearch(onSearch?: (term: string) => void) {
    const [value, setValue] = useState('');
    const debounced = useDebounce(value, SEARCH_DEBOUNCE_MS);
    const lastEmitted = useRef<string | null>(null);
    const onSearchRef = useRef(onSearch);
    onSearchRef.current = onSearch;

    useEffect(() => {
        if (lastEmitted.current === null && debounced === '') {
            lastEmitted.current = debounced;
            return;
        }
        if (lastEmitted.current === debounced) return;
        lastEmitted.current = debounced;
        onSearchRef.current?.(debounced);
    }, [debounced]);

    const reset = useCallback(() => {
        setValue('');
        lastEmitted.current = '';
        onSearchRef.current?.('');
    }, []);

    return { value, setValue, reset };
}

export function SearchInput({ value, onChangeText }: { value: string; onChangeText: (text: string) => void }) {
    const { t } = useTranslation();
    return (
        <Input
            className="w-full min-w-0"
            size="regular"
            rounded="full"
            placeholder={t('Search') + '...'}
            value={value}
            onChangeText={onChangeText}
        />
    );
}

/** One tab of `MenuSwitcher`; `title` is translated by the switcher. */
export type MenuItem = { name: string; title: string };

/** Inbox / direct tabs — conductor native-glass pills (idle glass, selected tinted). */
export function MenuSwitcher({ items, index, onChange }: {
    items?: MenuItem[];
    index: number;
    onChange: (index: number) => void;
}) {
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

type ConvosListHeaderProps = {
    title: string;
    searchValue: string;
    onChangeSearch: (text: string) => void;
    onCloseSearch?: () => void;
    /** Buttons right of the title; each gets the glass style. */
    addButtons?: ReactNode;
    menuItems?: MenuItem[];
    menuIndex: number;
    onMenuChange: (index: number) => void;
    onLayout?: (event: LayoutChangeEvent) => void;
    /** false: no search button (the host has nothing to search). */
    searchable?: boolean;
};

/** Desktop: list title + search/create, with inbox/direct tabs underneath. */
export function ConvosListHeader({
    title,
    searchValue,
    onChangeSearch,
    onCloseSearch,
    addButtons,
    menuItems,
    menuIndex,
    onMenuChange,
    onLayout,
    searchable = true,
}: ConvosListHeaderProps) {
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
                    {searchable ? (
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
                    ) : null}
                    {Array.isArray(addButtons)
                        ? addButtons.map((button, i) => (
                            isValidElement(button)
                                ? cloneElement(button as ReactElement<any>, { key: button.key ?? i, style: 'glass' })
                                : null
                        ))
                        : addButtons}
                </Row>
            </Row>
            {menuItems && menuItems.length > 1 ? (
                <Row className="items-center px-4 pb-2 pt-1">
                    <MenuSwitcher items={menuItems} index={menuIndex} onChange={onMenuChange} />
                </Row>
            ) : null}
        </View>
    );
}

/** Height of `PanelHeader` (h-16): the inset a list under it needs. */
export const PANEL_HEADER_HEIGHT = 64;

/** Desktop: title + optional actions row at the top of the content panel (conversation, agents). */
export function PanelHeader({ title, actions }: { title: string; actions?: ReactNode }) {
    return (
        <Row className="h-16 items-center max-w-full">
            <Row className="flex-1 min-w-0 items-center gap-3 px-4 overflow-hidden">
                <Text numberOfLines={1} className="flex-1 min-w-0 font-bold text-card-foreground text-lg sm:text-xl tracking-tight">
                    {title}
                </Text>
            </Row>
            {actions ? (
                <View className="shrink-0 items-center justify-center pe-4">
                    {actions}
                </View>
            ) : null}
        </Row>
    );
}
