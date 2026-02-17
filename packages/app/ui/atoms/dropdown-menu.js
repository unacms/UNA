import { Pressable, View, Row } from 'app/design/view';
import { useBottomSheetData } from 'app/context/bottomsheet';
import { Button } from 'app/design/controls'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { FeedbackHaptics } from 'app/lib/util';
import { Keyboard, Alert, Platform } from 'react-native'

import Redirect from 'app/ui/atoms/redirect';
import { isEmoji, appSetting } from 'app/lib/util';
import { SafeMenuTrigger } from 'app/ui/atoms/safe-menu-trigger';
import DropdownPopup from 'app/ui/atoms/dropdown-popup'
import emitter from 'app/context/emitter';
import { getComponent } from 'app/components/registry'
const menuSettings = appSetting('theme', 'dropdown_menu');

const variantClassMap = {
    vertical: { item: 'item_ver', container: 'content_ver' },
    horizontal: { item: 'item_hor', container: 'content_hor' },
    nopad: { item: 'item_np', container: 'content_ver' },
};


function DropdownMenuPopup({ items, onSelect, children, defaultOpen, variant, showOnTop, footer }) {
    const DropdownMenuItem = getComponent('menu-item', 'dropdown');
    const redirectdRef = useRef();
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const classes = variantClassMap[variant] ?? variantClassMap.vertical;

    const handleSelect = useCallback((event, item) => {
        setIsOpen(false);
        onSelect ? onSelect(item) : redirectdRef.current.redirect('' + item.link)
    }, [onSelect]);

    useEffect(() => {
        const subscription = emitter.addListener('dynamic_menu', (data) => {
            if (data.action == 'hide') {
                setIsOpen(false);
            }
           
        })

        return () => {
            subscription.remove()
        }
    }, [])

    return (
        <>
            <Redirect ref={redirectdRef} />
            <DropdownPopup
                showOnTop={showOnTop}
                minPopupWidth={256}
                
                open={isOpen}
                onOpenChange={setIsOpen}
                trigger={<SafeMenuTrigger>{children}</SafeMenuTrigger>}
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

const MenuBottomSheet = memo(({ items, onSelect, setBottomSheetData }) => {
    const DropdownMenuItem = getComponent('menu-item', 'dropdown');
    const redirectdRef = useRef();
    const handlePressMenu = useCallback(
        (item) => (event) => {
            FeedbackHaptics('Medium');
            setBottomSheetData(false);
            console.log('Menu item selected:', item);
            onSelect ? onSelect(item, event) : redirectdRef.current.redirect('' + item.link)
        },
        [onSelect, setBottomSheetData]
    );

    const classes = variantClassMap.vertical;

    return (
        <View className='w-full mt-0 mb-2'>
             <Redirect ref={redirectdRef} />
            {items.map((item, index) => (
                <View key={item.id} className={' ' + (index != items.length - 1 ? 'py-2 border-b border-border  ' : 'py-2 ')}>
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

export default function DropdownMenu({ items, onSelect, children, defaultOpen, mode, title, variant, showOnTop, footer, cancelable = true }) {
    const { setBottomSheetData } = useBottomSheetData();
    const isWeb = Platform.OS === 'web';

    if (isWeb || mode == "popup") {
        return <DropdownMenuPopup
            showOnTop={showOnTop}
            items={items}
            onSelect={onSelect}
            children={children}
            defaultOpen={defaultOpen}
            footer={footer}
            variant={variant} />;
    }

    const handlePress = useCallback(() => {
        if (mode != "alert") {
            FeedbackHaptics('Medium')
            setBottomSheetData({ showClose: false, snapPoints: ['10%', '50%'], content: <MenuBottomSheet items={items} onSelect={onSelect} setBottomSheetData={setBottomSheetData} /> });
            Keyboard.dismiss();
        }
        else {
            const alertOptions = items.map(item => ({
                text: item.title,
                onPress: () => {
                    onSelect(item);
                }
            }));
            if (cancelable){
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
    }, [setBottomSheetData, items, onSelect]);

    useEffect(() => {
        if (defaultOpen)
            handlePress()
    }, []);

    return (
        <Pressable onPress={handlePress}>{children}</Pressable>
    );
}