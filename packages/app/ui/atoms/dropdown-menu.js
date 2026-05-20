import { Pressable, View, Row } from 'app/design/view';
import { useBottomSheetData } from 'app/context/bottomsheet';
import { Button } from 'app/design/controls'
import { memo, useCallback, useEffect, useRef, useState, isValidElement, cloneElement, createContext } from 'react'
import { clsx } from 'clsx';
import { FeedbackHaptics } from 'app/lib/util';
import { Keyboard, Alert, Platform } from 'react-native'
import Redirect from 'app/ui/atoms/redirect';
import { isEmoji, appSetting } from 'app/lib/util';
import { SafeMenuTrigger } from 'app/ui/atoms/safe-menu-trigger';
import DropdownPopup from 'app/ui/atoms/dropdown-popup'
import emitter from 'app/context/emitter';
import { getComponent } from 'app/components/registry'
import { useOpenModalByUrl, useOpenModalWithContent } from 'app/context/jotai/modal';
import { sanitazeUrl, openExternalLink, isWeb } from 'app/lib/util';

const menuSettings = appSetting('theme', 'dropdown_menu');

export const DropdownMenuOpenContext = createContext(false);

const variantClassMap = {
    vertical: { item: 'item_ver', container: 'content_ver' },
    horizontal: { item: 'item_hor', container: 'content_hor' },
    nopad: { item: 'item_np', container: 'content_ver' },
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
}) {
    const DropdownMenuItem = getComponent('menu-item', 'dropdown');
    const redirectdRef = useRef();
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
    const isControlled = openProp !== undefined;
    const isOpen = isControlled ? openProp : uncontrolledOpen;
    const openModalByUrl = useOpenModalByUrl();
    const openModalWithContent = useOpenModalWithContent();

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

    const handleSelect = useCallback(
        (event, item) => {
            console.log("item", item)
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
                showOnTop={showOnTop}
                minPopupWidth={256}
                openOnFocus={
                    openOnFocus ?? variant === 'tabs-overflow'
                }
                contentClassName={clsx(
                    variant === 'tabs-overflow' && 'overflow-visible p-0.5',
                    contentClassNameProp
                )}
                open={isOpen}
                onOpenChange={setIsOpen}
                trigger={
                    <DropdownMenuOpenContext.Provider value={isOpen}>
                        <SafeMenuTrigger>{children}</SafeMenuTrigger>
                    </DropdownMenuOpenContext.Provider>
                }
            >
                <View className={menuSettings[classes.container]}>
                    {items.map((item, index) => (
                        <DropdownMenuItem
                            key={item.id ?? index}
                            index={index}
                            item={item}
                            handleSelect={handleSelect}
                            classes={classes}
                        />
                    ))}
                </View>
                {footer}
            </DropdownPopup>
        </>
    );
}

const MenuBottomSheet = memo(({ items, onSelect, setBottomSheetData, resolveContent }) => {
    const openModalByUrl = useOpenModalByUrl();
    const openModalWithContent = useOpenModalWithContent();
    const DropdownMenuItem = getComponent('menu-item', 'dropdown');
    const redirectdRef = useRef();
    const handlePressMenu = useCallback(
        (item) => (event) => {
            FeedbackHaptics('Medium');
            setBottomSheetData(false);
            if (onSelect) {
                onSelect(item, event);
                return;
            }
            console.log("item", item)
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

    const classes = variantClassMap.vertical;

    return (
        <View className='w-full mt-0 mb-2'>
            <Redirect ref={redirectdRef} />
            {items.map((item, index) => (
                <View key={item.id} className={' ' + (index != items.length - 1 ? 'py-2 border-b border-border/60  ' : 'py-2 ')}>
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
}) {
    const { setBottomSheetData } = useBottomSheetData();

    const handlePress = useCallback(() => {
        if (mode != "alert") {
            FeedbackHaptics('Medium')
            setBottomSheetData({ showClose: false, snapPoints: ['10%', '50%'], content: <MenuBottomSheet resolveContent={resolveContent} items={items} onSelect={onSelect} setBottomSheetData={setBottomSheetData} /> });
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
                    text: "Cancel",
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
    }, [cancelable, items, mode, onSelect, resolveContent, setBottomSheetData, title]);

    useEffect(() => {
        if (defaultOpen)
            handlePress()
    }, [defaultOpen, handlePress]);

    if (buttonProps) {
        return (
            <Button {...buttonProps} onPress={handlePress} />
        );
    }
    return (
        <Pressable onPress={handlePress}>{children}</Pressable>
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
        />
    );
}