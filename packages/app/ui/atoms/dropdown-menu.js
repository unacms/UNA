import { Pressable, View, Row } from 'app/design/view';
import { useBottomSheetData } from 'app/context/bottomsheet';
import { Button } from 'app/design/controls'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { FeedbackHaptics } from 'app/lib/util';
import { Keyboard, Alert, Platform } from 'react-native'
import { Text } from 'app/design/typography';
import { Icon } from 'app/ui/atoms/icon';
import Redirect from 'app/ui/atoms/redirect';
import { isEmoji, appSetting } from 'app/lib/util';
import { SafeMenuTrigger } from 'app/ui/atoms/safe-menu-trigger';
import DropdownPopup from 'app/ui/atoms/dropdown-popup'

const menuSettings = appSetting('theme', 'dropdown_menu');

const getIcon = (oItem, iconSize = 20) => {
    if (!oItem?.icon) return null;

    const className = oItem?.class_item_icon;

    if (isEmoji(oItem.icon)) {
        return <Text className={className}>{oItem.icon}</Text>;
    } else {
        return (
            <Icon
                className={className}
                icon={oItem.icon}
                size={oItem?.icon_size || iconSize}
            />
        );
    }
};

function DropdownMenuPopup({ items, onSelect, children, defaultOpen, variant }) {
    const redirectdRef = useRef();
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const variantClassMap = {
        vertical: { item: 'item_ver', container: 'content_ver' },
        horizontal: { item: 'item_hor', container: 'content_hor' },
        nopad: { item: 'item_np', container: 'content_hor' },
    };

    const classes = variantClassMap[variant] ?? variantClassMap.vertical;

    const handleSelect = useCallback((oItem) => {
        setIsOpen(false);
        onSelect ? onSelect(oItem) : redirectdRef.current.redirect('' + oItem.link)
    }, [onSelect]);

    const iconSize = menuSettings.icon_size || 16;

    const renderItem = useCallback(
        (item, index) => {
            const key = item.id ?? index;

            if (item.type === 'separator') {
                return <View key={key}>{item.title}</View>;
            }

            const icon = getIcon(item, iconSize);

            return (
                <Pressable
                    className={menuSettings[classes.item]}
                    key={key}
                    onPress={() => handleSelect(item)}
                >
                    <Row className={menuSettings.item_cnt}>
                        {!!icon && <View className={menuSettings.item_icon}>{icon}</View>}
                        {!!item?.title &&
                            (typeof item.title === 'string' ? (
                                <Text className={menuSettings.item_text}>{item.title}</Text>
                            ) : (
                                item.title
                            ))}
                    </Row>
                </Pressable>
            );
        },
        [handleSelect, classes, iconSize]
    );

    return (
        <>
            <Redirect ref={redirectdRef} />
            <DropdownPopup
                popupWidth={200}
                open={isOpen}
                onOpenChange={setIsOpen}
                trigger={<SafeMenuTrigger>{children}</SafeMenuTrigger>}
            >
                <View className={menuSettings[classes.container]}>
                    {items.map(renderItem)}
                </View>
            </DropdownPopup>
        </>
    );
}

const MenuBottomSheet = memo(({ items, onSelect, setBottomSheetData }) => {

    const handlePressMenu = useCallback(
        (item) => (event) => {
            FeedbackHaptics('Medium');
            setBottomSheetData(false);
            onSelect(item, event);
        },
        [onSelect, setBottomSheetData]
    );

    return (
        <View className='w-full mt-0 mb-2'>
            {items.map(
                (item, index) =>
                    <View key={item.id} className={' ' + (index != items.length - 1 ? 'mb-1 border-b border-bdr dark:border-bdr-d ' : '')}>
                        <Button
                            variant="text"
                            size="base"
                            fullWidth
                            onPress={handlePressMenu(item)}
                            align="start"
                            title={item.title}
                        />
                    </View>
            )}
        </View>
    );
});

export default function DropdownMenu({ items, onSelect, children, defaultOpen, mode, title, variant }) {
    const { setBottomSheetData } = useBottomSheetData();
    const isWeb = Platform.OS === 'web';

    if (isWeb || mode == "popup") {
        return <DropdownMenuPopup
            items={items}
            onSelect={onSelect}
            children={children}
            defaultOpen={defaultOpen}
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
            alertOptions.push({
                text: "Cancel",
                style: "cancel"
            });
            Alert.alert(
                title,
                null,
                alertOptions,
                { cancelable: true }
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


