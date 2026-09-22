import { Pressable, View } from 'app/design/view';
import { useBottomSheetData } from 'app/context/bottomsheet';
import { Button, NeoButton } from 'app/design/controls'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn, groupDropdownItems, getDropdownSectionsLayout, dropdownLeafItems, getDropdownGridLayout } from 'app/lib/util';
import DropdownGridItem from 'app/ui/atoms/dropdown-grid-item';
import { FeedbackHaptics } from 'app/lib/util';
import { Keyboard, Alert, Platform } from 'react-native'
import Redirect from 'app/ui/atoms/redirect';
import { appSetting } from 'app/lib/util';
import { SafeMenuTrigger } from 'app/ui/atoms/safe-menu-trigger';
import DropdownPopup, { DropdownMenuOpenContext } from 'app/ui/atoms/dropdown-popup'
import emitter from 'app/context/emitter';
import { components } from 'app/components/registry'
import { useOpenModalByUrl, useOpenModalWithContent } from 'app/context/jotai/modal';
import { sanitazeUrl, openExternalLink } from 'app/lib/util';
import { useWindowSize } from 'app/context/measure';
import { useTranslation } from 'react-i18next';

const menuSettings = appSetting('theme', 'dropdown_menu');

export { DropdownMenuOpenContext };

// Mirrors the web trigger logic in dropdown-popup.js: legacy buttonProps drive
// the classic `Button` (variant-based), otherwise we render `NeoButton`
// (style/borderShape/image-based) so triggers look identical on both platforms.
const isLegacyButtonProps = (props) =>
    props?.legacyButton === true || props?.variant != null;

function isNavigableDropdownItem(item, onSelect) {
    if (typeof onSelect === 'function') return false;
    if (!item || typeof item.link !== 'string' || !item.link) return false;
    if (item.target === 'modal') return false;
    if (item.type === 'group_header' || item.type === 'separator') return false;
    return true;
}

const variantClassMap = {
    vertical: { item: 'item_ver', container: 'content_ver' },
    horizontal: { item: 'item_hor', container: 'content_hor' },
    nopad: { item: 'item_np', container: 'content_ver' },
    grid: { item: 'item_grid', container: 'content_grid' },
    'tabs-overflow': { container: 'content_ver' },
};

function resolveTabsOverflowClasses(tabsOverflowSize) {
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
}) {
    const DropdownMenuItem = components['menu-item']['dropdown'];
    const redirectdRef = useRef();
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
    const isControlled = openProp !== undefined;
    const isOpen = isControlled ? openProp : uncontrolledOpen;
    const openModalByUrl = useOpenModalByUrl();
    const openModalWithContent = useOpenModalWithContent();
    const isGridLayout = variant === 'grid';

    const setIsOpen = useCallback(
        (next) => {
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
            : variantClassMap[variant] ?? variantClassMap.vertical;

    const { width: windowWidth } = useWindowSize();
    const gridItems = useMemo(
        () => (isGridLayout ? dropdownLeafItems(items) : null),
        [isGridLayout, items]
    );
    const gridLayout = useMemo(
        () => (isGridLayout ? getDropdownGridLayout() : null),
        [isGridLayout]
    );
    const useSectionsLayout = !isGridLayout && (items || []).some((item) => item?.type === 'group_header');
    const sections = useMemo(
        () => (useSectionsLayout ? groupDropdownItems(items) : null),
        [items, useSectionsLayout]
    );
    const sectionsLayout = useMemo(
        () => stacked
            ? { stacked: true, cols: 1, colWidth: null, contentWidth: null, popupWidth: null }
            : getDropdownSectionsLayout(sections?.length || 0, windowWidth),
        [sections?.length, stacked, windowWidth]
    );
    const sectionsMinPopupWidth = sectionsLayout.stacked
        ? 288
        : sectionsLayout.popupWidth;
    const sectionCount = sections?.length || 0;
    const sectionsWrap = sectionCount > (sectionsLayout.cols || 1);
    const sectionsRowStyle = sectionsLayout.stacked
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
    const sectionColStyle = sectionsLayout.stacked
        ? { width: '100%' }
        : {
            width: sectionsLayout.colWidth,
            minWidth: sectionsLayout.minWidth,
            maxWidth: sectionsLayout.maxWidth,
            flexGrow: 0,
            flexShrink: 0,
            flexBasis: sectionsLayout.colWidth,
        };
    const gridRowStyle = !isGridLayout
        ? undefined
        : Platform.OS === 'web'
            ? {
                display: 'grid',
                gridTemplateColumns: `repeat(${gridLayout.cols}, minmax(0, 1fr))`,
                width: gridLayout.contentWidth,
                minWidth: gridLayout.contentWidth,
                gap: gridLayout.gap,
            }
            : {
                flexDirection: 'row',
                flexWrap: 'wrap',
                width: '100%',
            };
    const gridCellStyle =
        isGridLayout && Platform.OS !== 'web'
            ? { width: `${100 / (gridLayout?.cols || 3)}%` }
            : undefined;

    const handleSelect = useCallback(
        (event, item) => {
            setIsOpen(false);
            onSelect
                ? onSelect(item)
                : item.target == 'modal' ? (item.content ? openModalWithContent({
                    title: item.title,
                    content: resolveContent ? resolveContent(item.content, item) : item.content,
                }) : openModalByUrl(item.link)) : redirectdRef.current.redirect('' + item.link);
        },
        [onSelect, setIsOpen, resolveContent]
    );

    useEffect(() => {
        const subscription = emitter.addListener('dynamic_menu', (data) => {
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
                        ? gridLayout.popupWidth
                        : useSectionsLayout
                            ? sectionsMinPopupWidth
                            : 256
                }
                maxPopupWidth={
                    isGridLayout
                        ? gridLayout.popupWidth
                        : useSectionsLayout && !sectionsLayout.stacked
                            ? sectionsMinPopupWidth
                            : undefined
                }
                openOnFocus={
                    openOnFocus ?? variant === 'tabs-overflow'
                }
                contentClassName={cn(
                    variant === 'tabs-overflow' && 'overflow-visible p-1',
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
                {isGridLayout ? (
                    <View className={menuSettings.content_grid} style={gridRowStyle}>
                        {gridItems.map((item, index) => {
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
                        {sections.map((section, sectionIndex) => (
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
                                <View className={menuSettings[classes.container]}>
                                    {section.items.map((item, index) => {
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
                                            />
                                        );
                                    })}
                                </View>
                            </View>
                        ))}
                    </View>
                ) : (
                    <View className={menuSettings[classes.container]}>
                        {items.map((item, index) => {
                            const navigable = isNavigableDropdownItem(item, onSelect);
                            return (
                                <DropdownMenuItem
                                    key={item.id ?? index}
                                    index={index}
                                    item={item}
                                    handleSelect={navigable ? undefined : handleSelect}
                                    link={navigable ? item.link : undefined}
                                    classes={classes}
                                    className={item.className}
                                />
                            );
                        })}
                    </View>
                )}
                {footer}
            </DropdownPopup>
        </>
    );
}

const MenuBottomSheet = memo(({ items, onSelect, setBottomSheetData, resolveContent, variant }) => {
    const openModalByUrl = useOpenModalByUrl();
    const openModalWithContent = useOpenModalWithContent();
    const DropdownMenuItem = components['menu-item']['dropdown'];
    const redirectdRef = useRef();
    const isGridLayout = variant === 'grid';
    const handlePressMenu = useCallback(
        (item) => (event) => {
            FeedbackHaptics('Medium');
            setBottomSheetData(false);
            if (onSelect) {
                onSelect(item, event);
                return;
            }
            if (item?.target === 'modal') {
                if (item?.content) {
                    openModalWithContent({
                        title: item.title,
                        content: resolveContent ? resolveContent(item.content, item) : item.content

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
            redirectdRef.current.redirect('' + item.link);
        },
        [onSelect, setBottomSheetData, openModalByUrl, openModalWithContent]
    );

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
}) {
    const { setBottomSheetData } = useBottomSheetData();
    const { t } = useTranslation();

    const handlePress = useCallback(() => {
        if (mode != "alert") {
            FeedbackHaptics('Medium')
            setBottomSheetData({
                showClose: false,
                snapPoints: variant === 'grid' ? ['25%', '70%'] : ['10%', '50%'],
                content: (
                    <MenuBottomSheet
                        variant={variant}
                        resolveContent={resolveContent}
                        items={items}
                        onSelect={onSelect}
                        setBottomSheetData={setBottomSheetData}
                    />
                ),
            });
            Keyboard.dismiss();
        }
        else {
            const alertOptions = items.map(item => ({
                text: item.title,
                onPress: () => {
                    onSelect(item);
                }
            }));
            if (cancelable) {
                alertOptions.push({
                    text: t('Cancel'),
                    style: "cancel"
                });
            }
            Alert.alert(
                title,
                null,
                alertOptions,
                { cancelable: cancelable }
            );
        }
    }, [cancelable, items, mode, onSelect, resolveContent, setBottomSheetData, t, title, variant]);

    useEffect(() => {
        if (defaultOpen)
            handlePress()
    }, [defaultOpen, handlePress]);

    if (buttonProps) {
        const useLegacyButton =
            buttonProps.useNeoButton === false || isLegacyButtonProps(buttonProps);
        if (useLegacyButton) {
            return <Button {...buttonProps} onPress={handlePress} />;
        }
        const { legacyButton: _legacy, neoButton: _neo, useNeoButton: _useNeo, ...neoButtonProps } = buttonProps;
        return <NeoButton {...neoButtonProps} onPress={handlePress} />;
    }   
    return (
        <Pressable
            onPress={handlePress}
            accessibilityRole="button"
            accessibilityLabel={triggerAccessibilityLabel}
        >
            {children}
        </Pressable>
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
}) {
    const isWeb = Platform.OS === 'web';

    if (isWeb || mode == 'popup') {
        return (
            <DropdownMenuPopup
                showOnTop={showOnTop}
                items={items}
                onSelect={onSelect}
                children={children}
                defaultOpen={defaultOpen}
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
        />
    );
}