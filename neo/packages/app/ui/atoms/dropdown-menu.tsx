import { Pressable, View } from 'app/design/view';
import { useBottomSheetData } from 'app/context/bottomsheet';
import { NeoButton, legacyToNeoButtonProps } from 'app/design/controls'
import { isLegacyButtonProps, stripRoutingKeys } from 'app/design/controls/neo-button/legacy-button-map';
import { memo, useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode, type RefObject } from 'react';
import { cn, groupDropdownItems, splitDropdownColumns, getDropdownSectionsLayout, dropdownLeafItems, getDropdownGridLayout, type DropdownSection, type DropdownSectionsLayout } from 'app/lib/util';
import DropdownGridItem, { type DropdownGridMenuItem } from 'app/ui/atoms/dropdown-grid-item';
import { FeedbackHaptics } from 'app/lib/util';
import { Keyboard, Alert, Platform, type AlertButton, type StyleProp, type ViewStyle } from 'react-native'
import Redirect, { type RedirectHandle } from 'app/ui/atoms/redirect';
import { appSetting } from 'app/lib/util';
import { SafeMenuTrigger } from 'app/ui/atoms/safe-menu-trigger';
import { MENU_HIGHLIGHT_CLASS, useMenuHighlight } from 'app/ui/atoms/menu-highlight';
import DropdownPopup, { DropdownMenuOpenContext, type DropdownButtonProps } from 'app/ui/atoms/dropdown-popup'
import emitter, { EVENTS } from 'app/context/emitter';
import { components } from 'app/components/registry'
import { useOpenModalByUrl, useOpenModalWithContent } from 'app/context/jotai/modal';
import { sanitazeUrl, openExternalLink } from 'app/lib/util';
import { useWindowSize } from 'app/context/measure';
import { useTranslation } from 'react-i18next';

const menuSettings = appSetting('theme', 'dropdown_menu');

/** UNA menu item. `group_header` / `separator` types structure sectioned menus. */
export type DropdownMenuItemData = DropdownGridMenuItem & {
    link?: string;
    /** `modal` opens `content` (or the link) in a modal; `_blank` / `blank` opens externally. */
    target?: string;
    type?: 'group_header' | 'separator' | string;
    /** Modal body for `target: 'modal'` (see `resolveContent`). */
    content?: unknown;
    className?: string;
    /**
     * Popup lists only: the item is a group row that folds these rows (`group_header` titles included) in place
     * under it, with a chevron and `aria-expanded`. One group is open at a time; all start closed, except the
     * only item of a menu, and closing the menu closes them.
     */
    rows?: DropdownMenuItemData[];
};

export type DropdownMenuVariant = 'vertical' | 'horizontal' | 'nopad' | 'grid' | 'tabs-overflow';

export type DropdownMenuProps = {
    items: DropdownMenuItemData[];
    /** Handle selection yourself; otherwise items navigate / open modals. */
    onSelect?: (item: DropdownMenuItemData, event?: unknown) => void;
    /** Trigger content when `buttonProps` is omitted. */
    children?: ReactNode;
    defaultOpen?: boolean;
    /** Native: `popup` (anchored), `alert` (system alert), otherwise a bottom sheet. */
    mode?: 'popup' | 'alert' | string;
    /** Native alert title. */
    title?: string;
    variant?: DropdownMenuVariant;
    showOnTop?: boolean;
    /** Rendered above the items (popup only). */
    header?: ReactNode;
    /** Rendered under the items (popup only). */
    footer?: ReactNode;
    /** Native alert: add a Cancel option. */
    cancelable?: boolean;
    tabsOverflowSize?: 'sm' | 'md' | 'lg';
    openOnFocus?: boolean;
    /** Controlled open state (popup only). */
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    buttonProps?: DropdownButtonProps;
    contentClassName?: string;
    /** Turn an item's `content` into modal content. */
    resolveContent?: (content: unknown, item: DropdownMenuItemData) => ReactNode;
    triggerAccessibilityLabel?: string;
    triggerClassName?: string;
    triggerStyle?: StyleProp<ViewStyle>;
    /** Sectioned menus: one column instead of side-by-side sections. */
    stacked?: boolean;
    /** Popup min width (px) of a plain list menu; 256 by default. */
    minPopupWidth?: number;
    /**
     * Popup width (px) of a plain list menu, instead of `minPopupWidth`: the popup keeps it whatever its rows
     * hold (long labels and descriptions wrap), so a group that opens or closes doesn't resize it. Narrower
     * screens cap it, 16px from each edge.
     */
    popupWidth?: number;
    /** Popup: lay the rows out in this many columns of about the same height. */
    columns?: number;
    /** Row size of a vertical list, the NeoButton heights: mini 28, small 36, regular 44 (default), large 52, xlarge 64.
        Popups and the JS bottom sheet (Android) use it; iOS draws text-only sheet rows natively at the system size. */
    size?: DropdownMenuItemSize;
};

export type DropdownMenuItemSize = 'mini' | 'small' | 'regular' | 'large' | 'xlarge';

type DropdownMenuPopupProps = Omit<DropdownMenuProps, 'mode' | 'title' | 'cancelable'>;

type DropdownMenuNativeProps = Pick<DropdownMenuProps,
    'items' | 'onSelect' | 'children' | 'defaultOpen' | 'mode' | 'title' | 'cancelable'
    | 'resolveContent' | 'buttonProps' | 'triggerAccessibilityLabel' | 'variant' | 'size'>;

type MenuBottomSheetProps = Pick<DropdownMenuProps, 'items' | 'onSelect' | 'resolveContent' | 'variant' | 'size'> & {
    setBottomSheetData: (data: any) => void;
};

/** Menu item renderer from the component registry (JS, so typed loosely here). */
const getDropdownMenuItem = (): ComponentType<any> => (components as any)['menu-item']['dropdown'];

/** getDropdownSectionsLayout result, or the hand-built stacked column (no width limits). */
type SectionsLayout = Omit<DropdownSectionsLayout, 'minWidth' | 'maxWidth' | 'gap'>
    & Partial<Pick<DropdownSectionsLayout, 'minWidth' | 'maxWidth' | 'gap'>>;

export { DropdownMenuOpenContext };

// Mirrors the web trigger logic in dropdown-popup.tsx: legacy buttonProps
// (`legacyButton`, `useNeoButton: false`, or legacy keys such as `variant`)
// go through `legacyToNeoButtonProps`; either way the trigger is a NeoButton.

function isNavigableDropdownItem(item: DropdownMenuItemData | undefined, onSelect: DropdownMenuProps['onSelect']) {
    if (typeof onSelect === 'function') return false;
    if (!item || typeof item.link !== 'string' || !item.link) return false;
    if (item.target === 'modal') return false;
    if (item.type === 'group_header' || item.type === 'separator') return false;
    return true;
}

const variantClassMap: Record<string, Record<string, string>> = {
    vertical: { item: 'item_ver', container: 'content_ver' },
    horizontal: { item: 'item_hor', container: 'content_hor' },
    nopad: { item: 'item_np', container: 'content_ver' },
    grid: { item: 'item_grid', container: 'content_grid' },
    'tabs-overflow': { container: 'content_ver' },
};

function resolveTabsOverflowClasses(tabsOverflowSize?: string) {
    const size =
        tabsOverflowSize === 'sm'
            ? 'sm'
            : tabsOverflowSize === 'lg'
                ? 'lg'
                : 'md';
    return {
        container: 'content_ver',
        item: `item_tabs_overflow_${size}`,
        item_row: 'justify-start items-center w-full',
        item_cnt_key: 'item_cnt_tabs_overflow',
        item_text_key: `item_tabs_overflow_text_${size}`,
    };
}

function DropdownMenuPopup({
    items,
    onSelect,
    children,
    defaultOpen,
    buttonProps,
    variant,
    showOnTop,
    header,
    footer,
    tabsOverflowSize,
    openOnFocus,
    open: openProp,
    onOpenChange: onOpenChangeProp,
    contentClassName: contentClassNameProp,
    resolveContent,
    triggerAccessibilityLabel,
    triggerClassName,
    triggerStyle,
    stacked = false,
    minPopupWidth = 256,
    popupWidth,
    columns = 1,
    size,
}: DropdownMenuPopupProps) {
    const DropdownMenuItem = getDropdownMenuItem();
    const redirectdRef = useRef<RedirectHandle | null>(null);
    // Always a boolean: DropdownPopup takes `open={undefined}` as "manage it yourself" and then
    // never calls `onOpenChange`, so callers that load rows on open (MenuAccount) never would.
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen ?? false);
    const isControlled = openProp !== undefined;
    const isOpen = isControlled ? openProp : uncontrolledOpen;
    const openModalByUrl = useOpenModalByUrl();
    const openModalWithContent = useOpenModalWithContent();
    const isGridLayout = variant === 'grid';

    const setIsOpen = useCallback(
        (next: boolean) => {
            if (!isControlled) {
                setUncontrolledOpen(next);
            }
            onOpenChangeProp?.(next);
        },
        [isControlled, onOpenChangeProp]
    );

    const classes =
        variant === 'tabs-overflow'
            ? resolveTabsOverflowClasses(tabsOverflowSize)
            : (variant && variantClassMap[variant]) ?? variantClassMap.vertical!;

    // Lists of rows share one sliding hover highlight (web); horizontal and grid menus keep their own hover.
    const menuHighlightRef = useMenuHighlight();
    const listClassName = cn(menuSettings[classes.container], classes.container === 'content_ver' && MENU_HIGHLIGHT_CLASS);

    const { width: windowWidth } = useWindowSize();
    const gridItems = useMemo(
        () => (isGridLayout ? dropdownLeafItems(items) : null),
        [isGridLayout, items]
    );
    const gridLayout = useMemo(
        () => (isGridLayout ? getDropdownGridLayout() : null),
        [isGridLayout]
    );
    const useColumns = !isGridLayout && columns > 1 && (items || []).length > 1;
    const useSectionsLayout = useColumns || (!isGridLayout && (items || []).some((item) => item?.type === 'group_header'));
    const sections = useMemo(
        () => (useColumns ? splitDropdownColumns(items, columns) : useSectionsLayout ? groupDropdownItems(items) : null),
        [items, useSectionsLayout, useColumns, columns]
    );
    const sectionsLayout = useMemo<SectionsLayout>(
        () => stacked
            ? { stacked: true, cols: 1, colWidth: null, contentWidth: null, popupWidth: null }
            : getDropdownSectionsLayout(sections?.length || 0, windowWidth),
        [sections?.length, stacked, windowWidth]
    );
    const sectionsMinPopupWidth = sectionsLayout.stacked
        ? 288
        : sectionsLayout.popupWidth ?? undefined;
    // A plain list's fixed width (`popupWidth`): DropdownPopup takes equal min and max widths as the width.
    const listPopupWidth = popupWidth && popupWidth > 0 ? popupWidth : undefined;
    const sectionCount = sections?.length || 0;
    const sectionsWrap = sectionCount > (sectionsLayout.cols || 1);
    // Web uses CSS grid props (`display: 'grid'`) that RN style types don't know.
    const sectionsRowStyle: any = sectionsLayout.stacked
        ? undefined
        : Platform.OS === 'web'
            ? {
                display: 'grid',
                gridTemplateColumns: `repeat(${sectionsLayout.cols}, ${sectionsLayout.colWidth}px)`,
                width: sectionsLayout.contentWidth,
                minWidth: sectionsLayout.contentWidth,
            }
            : {
                flexDirection: 'row',
                flexWrap: sectionsWrap ? 'wrap' : 'nowrap',
                width: sectionsLayout.contentWidth,
            };
    const sectionColStyle: any = sectionsLayout.stacked
        ? { width: '100%' }
        : {
            width: sectionsLayout.colWidth,
            minWidth: sectionsLayout.minWidth,
            maxWidth: sectionsLayout.maxWidth,
            flexGrow: 0,
            flexShrink: 0,
            flexBasis: sectionsLayout.colWidth,
        };
    const gridRowStyle: any = !isGridLayout
        ? undefined
        : Platform.OS === 'web'
            ? {
                display: 'grid',
                gridTemplateColumns: `repeat(${gridLayout!.cols}, minmax(0, 1fr))`,
                width: gridLayout!.contentWidth,
                minWidth: gridLayout!.contentWidth,
                gap: gridLayout!.gap,
            }
            : {
                flexDirection: 'row',
                flexWrap: 'wrap',
                width: '100%',
            };
    const gridCellStyle: any =
        isGridLayout && Platform.OS !== 'web'
            ? { width: `${100 / (gridLayout?.cols || 3)}%` }
            : undefined;

    const handleSelect = useCallback(
        (event: unknown, item: DropdownMenuItemData) => {
            setIsOpen(false);
            onSelect
                ? onSelect(item)
                : item.target == 'modal' ? (item.content ? openModalWithContent({
                    title: item.title as ReactNode,
                    content: resolveContent ? resolveContent(item.content, item) : item.content as ReactNode,
                }) : openModalByUrl(item.link)) : redirectdRef.current?.redirect('' + item.link);
        },
        [onSelect, setIsOpen, resolveContent, openModalWithContent, openModalByUrl]
    );

    useEffect(() => {
        const subscription = emitter.addListener(EVENTS.dynamicMenu, (data: { action?: string }) => {
            if (data.action == 'hide') {
                setIsOpen(false);
            }
        });

        return () => {
            subscription.remove();
        };
    }, [setIsOpen]);
    return (
        <>
            <Redirect ref={redirectdRef} />
            <DropdownPopup
                buttonProps={buttonProps}
                triggerAccessibilityLabel={triggerAccessibilityLabel}
                showOnTop={showOnTop}
                minPopupWidth={
                    isGridLayout
                        ? gridLayout!.popupWidth
                        : useSectionsLayout
                            ? sectionsMinPopupWidth
                            : listPopupWidth ?? minPopupWidth
                }
                maxPopupWidth={
                    isGridLayout
                        ? gridLayout!.popupWidth
                        : useSectionsLayout
                            ? (sectionsLayout.stacked ? undefined : sectionsMinPopupWidth)
                            : listPopupWidth
                }
                openOnFocus={
                    openOnFocus ?? variant === 'tabs-overflow'
                }
                contentClassName={cn(
                    variant === 'tabs-overflow' && 'overflow-visible',
                    contentClassNameProp
                )}
                open={isOpen}
                onOpenChange={setIsOpen}
                triggerClassName={triggerClassName}
                triggerStyle={triggerStyle}
                trigger={
                    buttonProps ? undefined : (
                        <SafeMenuTrigger>{children}</SafeMenuTrigger>
                    )
                }
            >
                {header}
                {isGridLayout ? (
                    <View className={menuSettings.content_grid} style={gridRowStyle}>
                        {gridItems!.map((item: DropdownMenuItemData, index: number) => {
                            const navigable = isNavigableDropdownItem(item, onSelect);
                            return (
                                <View key={item.id ?? index} style={gridCellStyle}>
                                    <DropdownGridItem
                                        index={index}
                                        item={item}
                                        handleSelect={navigable ? undefined : handleSelect}
                                        link={navigable ? item.link : undefined}
                                        className={item.className}
                                    />
                                </View>
                            );
                        })}
                    </View>
                ) : useSectionsLayout ? (
                    <View
                        className={
                            sectionsLayout.stacked
                                ? menuSettings.content_sections_stacked
                                : menuSettings.content_sections
                        }
                        style={sectionsRowStyle}
                    >
                        {sections!.map((section: DropdownSection, sectionIndex: number) => (
                            <View
                                key={section.header?.id ?? `section-${sectionIndex}`}
                                className={menuSettings.section}
                                style={sectionColStyle}
                            >
                                {section.header ? (
                                    <DropdownMenuItem
                                        index={sectionIndex}
                                        item={{ ...section.header, first: true }}
                                        handleSelect={handleSelect}
                                        classes={classes}
                                    />
                                ) : null}
                                <View ref={menuHighlightRef} className={listClassName}>
                                    {section.items.map((item: DropdownMenuItemData, index: number) => {
                                        const navigable = isNavigableDropdownItem(item, onSelect);
                                        return (
                                            <DropdownMenuItem
                                                key={item.id ?? `${sectionIndex}-${index}`}
                                                index={index}
                                                item={item}
                                                handleSelect={navigable ? undefined : handleSelect}
                                                link={navigable ? item.link : undefined}
                                                classes={classes}
                                                className={item.className}
                                                size={size}
                                            />
                                        );
                                    })}
                                </View>
                            </View>
                        ))}
                    </View>
                ) : (
                    <DropdownMenuList
                        items={items}
                        onSelect={onSelect}
                        handleSelect={handleSelect}
                        classes={classes}
                        size={size}
                        listRef={menuHighlightRef}
                        listClassName={listClassName}
                    />
                )}
                {footer}
            </DropdownPopup>
        </>
    );
}

type DropdownMenuListProps = Pick<DropdownMenuProps, 'items' | 'onSelect' | 'size'> & {
    handleSelect: (event: unknown, item: DropdownMenuItemData) => void;
    classes: Record<string, string>;
    listRef: ReturnType<typeof useMenuHighlight>;
    listClassName: string;
};

/**
 * A popup's plain list of rows. An item with `rows` is a group row that folds them in place: they follow it as
 * the list's own children, so the sliding highlight and the focus order treat them as rows of the list. The open
 * group lives here, inside the popup, which unmounts once the menu has closed, so every opening starts closed.
 */
function DropdownMenuList({ items, onSelect, handleSelect, classes, size, listRef, listClassName }: Readonly<DropdownMenuListProps>) {
    const DropdownMenuItem = getDropdownMenuItem();
    const groupKey = (item: DropdownMenuItemData, index: number) => item.id ?? `group-${index}`;
    // A menu that is a single group has nothing else to show: that group starts open.
    const [expanded, setExpanded] = useState<string | number | null>(() =>
        items.length === 1 && items[0]?.rows?.length ? groupKey(items[0], 0) : null
    );

    const row = (item: DropdownMenuItemData, key: string | number, index: number, nested?: boolean) => {
        const navigable = isNavigableDropdownItem(item, onSelect);
        return (
            <DropdownMenuItem
                key={key}
                index={index}
                item={item}
                handleSelect={navigable ? undefined : handleSelect}
                link={navigable ? item.link : undefined}
                classes={classes}
                className={item.className}
                size={size}
                nested={nested}
            />
        );
    };

    return (
        <View ref={listRef} className={listClassName}>
            {items.flatMap((item, index) => {
                if (!item.rows?.length) return [row(item, item.id ?? index, index)];
                const key = groupKey(item, index);
                const open = expanded === key;
                return [
                    <DropdownMenuItem
                        key={key}
                        index={index}
                        item={item}
                        expanded={open}
                        handleSelect={() => setExpanded(open ? null : key)}
                        classes={classes}
                        className={item.className}
                        size={size}
                    />,
                    ...(open ? item.rows.map((sub, i) => row(sub, `${key}/${sub.id ?? i}`, i, true)) : []),
                ];
            })}
        </View>
    );
}

/** A row a native sheet can draw itself: its title is text, not a React element. */
function hasTextTitle(item: DropdownMenuItemData): boolean {
    return item.title == null || typeof item.title === 'string' || typeof item.title === 'number';
}

/**
 * A row chosen in a menu bottom sheet: closes the sheet, then runs `onSelect`, or opens the
 * item's modal, external link or page. Shared by the JS sheet (MenuBottomSheet) and the rows
 * a native sheet draws from the sheet's `menu` (ui/molecules/dialogs/bottomsheet-native.ios.tsx).
 */
function useMenuSheetPress({ onSelect, resolveContent, setBottomSheetData, redirectRef }: Pick<DropdownMenuProps, 'onSelect' | 'resolveContent'> & {
    setBottomSheetData: (data: any) => void;
    redirectRef: RefObject<RedirectHandle | null>;
}) {
    const openModalByUrl = useOpenModalByUrl();
    const openModalWithContent = useOpenModalWithContent();
    return useCallback(
        (item: DropdownMenuItemData, event?: unknown) => {
            FeedbackHaptics('Medium');
            setBottomSheetData(false);
            if (onSelect) {
                onSelect(item, event);
                return;
            }
            if (item?.target === 'modal') {
                if (item?.content) {
                    openModalWithContent({
                        title: item.title as ReactNode,
                        content: resolveContent ? resolveContent(item.content, item) : item.content as ReactNode

                    });
                } else {
                    openModalByUrl(item.link);
                }
                return;
            }
            if (item?.target === '_blank' || item?.target === 'blank') {
                const url = sanitazeUrl(item.link);
                if (!url) return;
                openExternalLink(url);
                return;
            }
            redirectRef.current?.redirect('' + item.link);
        },
        [onSelect, setBottomSheetData, openModalByUrl, openModalWithContent, resolveContent, redirectRef]
    );
}

const MenuBottomSheet = memo(({ items, onSelect, setBottomSheetData, resolveContent, variant, size }: MenuBottomSheetProps) => {
    const DropdownMenuItem = getDropdownMenuItem();
    const redirectdRef = useRef<RedirectHandle | null>(null);
    const isGridLayout = variant === 'grid';
    const pressItem = useMenuSheetPress({ onSelect, resolveContent, setBottomSheetData, redirectRef: redirectdRef });
    const handlePressMenu = (item: DropdownMenuItemData) => (event?: unknown) => pressItem(item, event);

    const classes = isGridLayout ? variantClassMap.grid : variantClassMap.vertical;
    const sheetItems = isGridLayout ? dropdownLeafItems(items) : items;

    if (isGridLayout) {
        return (
            <View className="w-full mt-0 mb-2">
                <Redirect ref={redirectdRef} />
                <View className={`${menuSettings.content_grid} flex-row flex-wrap`}>
                    {sheetItems.map((item, index) => (
                        <View key={item.id ?? index} style={{ width: '33.333%' }}>
                            <DropdownGridItem
                                index={index}
                                item={item}
                                handleSelect={handlePressMenu(item)}
                                className={item.className}
                            />
                        </View>
                    ))}
                </View>
            </View>
        );
    }

    return (
        <View className='w-full mt-0 mb-2'>
            <Redirect ref={redirectdRef} />
            {sheetItems.map((item, index) => (
                <View key={item.id ?? index} className={`${item.className || ''} ${index !== sheetItems.length - 1 ? 'py-2 border-b border-border/60' : 'py-2'}`}>
                    <DropdownMenuItem
                        mode="bottomsheet"
                        key={item.id ?? index}
                        index={index}
                        item={item}
                        handleSelect={handlePressMenu(item)}
                        classes={classes}
                        size={size}
                    />
                </View>
            ))}
        </View>
    );

});

function DropdownMenuNative({
    items,
    onSelect,
    children,
    defaultOpen,
    mode,
    title,
    cancelable = true,
    resolveContent,
    buttonProps,
    triggerAccessibilityLabel,
    variant,
    size,
}: DropdownMenuNativeProps) {
    const { setBottomSheetData } = useBottomSheetData();
    const { t } = useTranslation();
    const redirectRef = useRef<RedirectHandle | null>(null);
    const pressItem = useMenuSheetPress({ onSelect, resolveContent, setBottomSheetData, redirectRef });

    const handlePress = useCallback(() => {
        if (mode != "alert") {
            FeedbackHaptics('Medium')
            setBottomSheetData({
                showClose: false,
                snapPoints: variant === 'grid' ? ['25%', '70%'] : ['10%', '50%'],
                content: (
                    <MenuBottomSheet
                        variant={variant}
                        size={size}
                        resolveContent={resolveContent}
                        items={items}
                        onSelect={onSelect}
                        setBottomSheetData={setBottomSheetData}
                    />
                ),
                // The rows as data, for a sheet that draws them natively (iOS). A grid, or rows that are
                // custom React controls (DynamicMenu's MenuItemEx, MenuAccount's profile switcher), stay `content`.
                ...(variant !== 'grid' && items.every(hasTextTitle) ? { menu: { items, onPress: pressItem } } : {}),
            });
            Keyboard.dismiss();
        }
        else {
            const alertOptions: AlertButton[] = items.map(item => ({
                text: item.title as string,
                onPress: () => {
                    onSelect?.(item);
                }
            }));
            if (cancelable) {
                alertOptions.push({
                    text: t('Cancel'),
                    style: "cancel"
                });
            }
            Alert.alert(
                title ?? '',
                undefined,
                alertOptions,
                { cancelable: cancelable }
            );
        }
    }, [cancelable, items, mode, onSelect, pressItem, resolveContent, setBottomSheetData, size, t, title, variant]);

    useEffect(() => {
        if (defaultOpen)
            handlePress()
    }, [defaultOpen, handlePress]);

    if (buttonProps) {
        const neoButtonProps = (buttonProps.useNeoButton === false || isLegacyButtonProps(buttonProps))
            ? legacyToNeoButtonProps(buttonProps)
            : stripRoutingKeys(buttonProps);
        // `handlePress` fires its own haptics.
        return (
            <>
                <Redirect ref={redirectRef} />
                <NeoButton {...neoButtonProps} haptics={false} onPress={handlePress} />
            </>
        );
    }
    return (
        <>
            <Redirect ref={redirectRef} />
            <Pressable
                onPress={handlePress}
                accessibilityRole="button"
                accessibilityLabel={triggerAccessibilityLabel}
            >
                {children}
            </Pressable>
        </>
    );
}

export default function DropdownMenu({
    items,
    onSelect,
    children,
    defaultOpen,
    mode,
    title,
    variant,
    showOnTop,
    header,
    footer,
    cancelable = true,
    tabsOverflowSize,
    openOnFocus,
    open,
    buttonProps,
    onOpenChange,
    contentClassName,
    resolveContent,
    triggerAccessibilityLabel,
    triggerClassName,
    triggerStyle,
    stacked = false,
    minPopupWidth,
    popupWidth,
    columns,
    size,
}: DropdownMenuProps) {
    const isWeb = Platform.OS === 'web';

    if (isWeb || mode == 'popup') {
        return (
            <DropdownMenuPopup
                showOnTop={showOnTop}
                items={items}
                onSelect={onSelect}
                children={children}
                defaultOpen={defaultOpen}
                header={header}
                footer={footer}
                variant={variant}
                tabsOverflowSize={tabsOverflowSize}
                openOnFocus={openOnFocus}
                open={open}
                onOpenChange={onOpenChange}
                contentClassName={contentClassName}
                resolveContent={resolveContent}
                buttonProps={buttonProps}
                triggerAccessibilityLabel={triggerAccessibilityLabel}
                triggerClassName={triggerClassName}
                triggerStyle={triggerStyle}
                stacked={stacked}
                minPopupWidth={minPopupWidth}
                popupWidth={popupWidth}
                columns={columns}
                size={size}
            />
        );
    }

    return (
        <DropdownMenuNative
            items={items}
            onSelect={onSelect}
            children={children}
            defaultOpen={defaultOpen}
            mode={mode}
            title={title}
            cancelable={cancelable}
            resolveContent={resolveContent}
            buttonProps={buttonProps}
            triggerAccessibilityLabel={triggerAccessibilityLabel}
            variant={variant}
            size={size}
        />
    );
}