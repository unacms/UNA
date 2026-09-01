import { useState } from 'react';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Icon } from 'app/ui/atoms/icon';
import Image from 'app/ui/atoms/image';
import { isEmoji, appSetting, resolveMenuItemDescription } from 'app/lib/util';
import { useTheme } from 'app/design/theme';
import Link from 'app/ui/atoms/link'
const menuSettings = appSetting('theme', 'dropdown_menu');

const getIcon = (oItem, iconSize = 20, rowHovered, colors) => {
    const image = oItem?.image
    if (typeof image === 'string' && image && /^(https?:|file:|content:|data:)/i.test(image)) {
        return (
            <Image
                src={image}
                className="h-9 w-9 rounded-full"
                view="cover"
                sizes="auto"
            />
        )
    }
    if (!oItem?.icon) return null;

    const selected = !!oItem.selected;
    const className = [oItem?.class_item_icon, oItem?.addClassName, selected ? 'text-primary' : null]
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
                color={selected ? colors.primary : undefined}
                animated={useAnimated}
                hovered={useAnimated && Platform.OS === 'web' ? rowHovered : undefined}
            />
        );
    }
};

export default function DropdownMenuItem({ item, index, link, handleSelect, classes, className,  counter, handleCounter, mode }) {
    const { t } = useTranslation();
    const { colors } = useTheme();
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
                return item.title;  // no outer Pressable — onPress is already handled inside MenuItemEx
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

    const icon = getIcon(item, iconSize, rowHovered, colors);
    const iconWrapClass = item.selected
        ? (menuSettings.item_icon_active ?? menuSettings.item_icon)
        : menuSettings.item_icon;

    const itemTextKey = classes?.item_text_key || 'item_text';
    const itemTextClass =
        menuSettings[itemTextKey] ?? menuSettings.item_text;
    const itemDescriptionClass =
        menuSettings.item_description ?? 'text-xs font-normal leading-tight text-pretty text-muted-foreground px-2';
    const itemCntKey = classes?.item_cnt_key ?? 'item_cnt';
    const itemCntClass =
        menuSettings[itemCntKey] ?? menuSettings.item_cnt;
    const rowClassName = classes?.item_row ?? 'justify-between items-center';
    const description = resolveMenuItemDescription(item);
    const descriptionText = description ? t(description) : '';

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
                {(!!icon && !!menuSettings.item_icon) && <View className={iconWrapClass}>{icon}</View>}
                {!!item?.title &&
                    (typeof item.title === 'string' ? (
                        <View className="min-w-0 flex-1 flex flex-col justify-center">
                            <Text numberOfLines={2} className={`${itemTextClass} line-clamp-2`}>{item.title}</Text>
                            {!!descriptionText && (
                                <Text numberOfLines={2} className={`${itemDescriptionClass} line-clamp-2`}>{descriptionText}</Text>
                            )}
                        </View>
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
