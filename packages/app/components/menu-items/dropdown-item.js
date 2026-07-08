import { useState } from 'react';
import { Platform } from 'react-native';
import { Pressable, View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Icon } from 'app/ui/atoms/icon';
import { isEmoji, appSetting } from 'app/lib/util';
import Link from 'app/ui/atoms/link'
const menuSettings = appSetting('theme', 'dropdown_menu');

const getIcon = (oItem, iconSize = 20, rowHovered) => {
    if (!oItem?.icon) return null;

    const className = [oItem?.class_item_icon, oItem?.addClassName]
        .filter(Boolean)
        .join(' ');

    if (isEmoji(oItem.icon)) {
        return <Text className={className}>{oItem.icon}</Text>;
    } else {
        const useAnimated = oItem.animated === true;
        return (
            <Icon
                className={className}
                icon={oItem.icon}
                size={oItem?.icon_size || iconSize}
                animated={useAnimated}
                active={useAnimated ? oItem.selected : undefined}
                hovered={useAnimated && Platform.OS === 'web' ? rowHovered : undefined}
            />
        );
    }
};

export default function DropdownMenuItem({ item, index, link, handleSelect, classes, className,  counter, handleCounter, mode }) {
    const key = item.id ?? index;
    const iconSize = menuSettings.icon_size || 16;
    const [rowHovered, setRowHovered] = useState(false);
    const rowHoverProps =
        item.animated && Platform.OS === 'web'
            ? {
                  onMouseEnter: () => setRowHovered(true),
                  onMouseLeave: () => setRowHovered(false),
              }
            : {};

    if (typeof item.title !== 'string') {
       /* if (item.noAction && typeof handleSelect === 'function') {
            return <Pressable onPress={(event) => handleSelect(event, item)}>{item.title}</Pressable>;
        }*/
            if (typeof item.title !== 'string') {
                return item.title;  // без внешнего Pressable — onPress уже внутри MenuItemEx
            }
        return item.title;
    }

    if (item.type === 'separator') {
        return <View key={key}>{item.title}</View>;
    }

    if (item.type === 'group_header') {
        return (
            <View key={key} className="px-1 pt-3 pb-1">
                <Text className="text-base  font-semibold text-foreground">{item.title}</Text>
            </View>
        );
    }

    const icon = getIcon(item, iconSize, rowHovered);

    const itemTextKey = classes?.item_text_key || 'item_text';
    const itemTextClass =
        menuSettings[itemTextKey] ?? menuSettings.item_text;
    const itemCntKey = classes?.item_cnt_key ?? 'item_cnt';
    const itemCntClass =
        menuSettings[itemCntKey] ?? menuSettings.item_cnt;
    const rowClassName = classes?.item_row ?? 'justify-between items-center';

    const Wrapper = handleSelect ? Pressable : View;
    const pressProps =
        typeof handleSelect === 'function'
            ? { onPress: (event) => handleSelect(event, item) }
            : {};
    const Content = (
        <Wrapper
            className={`web:group ${className} ${menuSettings[classes?.item || 'item_ver']}${item.selected ? ' bg-primary/10 text-foreground' : ''}`}
            key={key}
            {...pressProps}
            {...rowHoverProps}
        >
            <Row className={rowClassName}>
                <View className={itemCntClass}>
                {(!!icon && !!menuSettings.item_icon) && <View className={menuSettings.item_icon}>{icon}</View>}
                {!!item?.title &&
                    (typeof item.title === 'string' ? (
                        <Text className={itemTextClass}>{item.title}</Text>
                    ) : (
                        item.title
                    ))
                }
                </View>
                {!!counter && typeof handleCounter === 'function' && (
                    <Pressable className='mr-1'  onPress={(event) => handleCounter(event, item)}>
                        <Text className={menuSettings.item_text}>{counter}</Text>
                    </Pressable>
                )}
            </Row>
        </Wrapper>
    );

    return (

        link ? (
            <Link href={link}>
                {Content}
            </Link>
        ) : (
            Content
        )


    );
}
