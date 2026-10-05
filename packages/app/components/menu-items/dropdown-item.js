import { useState } from 'react';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Icon } from 'app/ui/atoms/icon';
import Image from 'app/ui/atoms/image';
import { isEmoji, appSetting, resolveMenuItemDescription } from 'app/lib/util';
import Link from 'app/ui/atoms/link'
const menuSettings = appSetting('theme', 'dropdown_menu');

const getIcon = (oItem, iconSize = 20, rowHovered) => {
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
    const className = [oItem?.class_item_icon, oItem?.addClassName, selected ? (menuSettings.item_icon_selected ?? 'text-accent-foreground') : null]
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
                hovered={useAnimated && Platform.OS === 'web' ? rowHovered : undefined}
            />
        );
    }
};

export default function DropdownMenuItem({ item, index, link, handleSelect, classes, className,  counter, handleCounter, mode }) {
    const { t } = useTranslation();
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
        const headerClass = item.first
            ? (menuSettings.item_group_header_first ?? menuSettings.item_group_header)
            : menuSettings.item_group_header;
        return (
            <View key={key} className={headerClass || 'px-2 pt-3 pb-1'}>
                <Text
                    role="heading"
                    aria-level={2}
                    className={menuSettings.item_group_header_text || 'text-xs font-semibold uppercase tracking-wide text-muted-foreground'}
                >
                    {item.title}
                </Text>
            </View>
        );
    }

    const icon = getIcon(item, iconSize, rowHovered);
    const iconWrapClass = item.selected
        ? (menuSettings.item_icon_active ?? menuSettings.item_icon)
        : menuSettings.item_icon;

    const itemTextKey = classes?.item_text_key || 'item_text';
    const itemTextClass =
        (item.selected ? menuSettings[`${itemTextKey}_selected`] : null) ?? menuSettings[itemTextKey] ?? menuSettings.item_text;
    const itemDescriptionClass =
        menuSettings.item_description ?? 'text-xs font-normal leading-tight text-pretty text-muted-foreground px-2';
    const itemCntKey = classes?.item_cnt_key ?? 'item_cnt';
    const itemCntClass =
        menuSettings[itemCntKey] ?? menuSettings.item_cnt;
    const rowClassName = classes?.item_row ?? 'justify-between items-start';
    const description = resolveMenuItemDescription(item);
    const descriptionText = description ? t(description) : '';

    const Wrapper = handleSelect ? Pressable : View;
    const isSelectableAction =
        typeof handleSelect === 'function' &&
        (item.selected === true || item.selected === false);
    const pressProps =
        typeof handleSelect === 'function'
            ? {
                  onPress: (event) => handleSelect(event, item),
                  ...(isSelectableAction
                      ? {
                            accessibilityRole: 'radio',
                            accessibilityState: { selected: !!item.selected, checked: !!item.selected },
                            'aria-checked': !!item.selected,
                        }
                      : {}),
              }
            : {};
    const Content = (
        <Wrapper
            className={`group ${className} ${menuSettings[classes?.item || 'item_ver']}${item.selected ? ` ${menuSettings.item_selected ?? 'bg-accent'}` : ''}`}
            key={key}
            {...pressProps}
            {...rowHoverProps}
        >
            <Row className={`${rowClassName} w-full min-w-0`}>
                <View className={itemCntClass}>
                {(!!icon && !!menuSettings.item_icon) && <View className={iconWrapClass}>{icon}</View>}
                {!!item?.title &&
                    (typeof item.title === 'string' ? (
                        <View className={menuSettings.item_text_cnt ?? 'min-w-0 flex-1 flex flex-col self-center justify-center overflow-hidden'}>
                            <Text numberOfLines={2} className={`${itemTextClass} line-clamp-2`}>{item.title}</Text>
                            {!!descriptionText && (
                                <Text className={itemDescriptionClass}>{descriptionText}</Text>
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
            <Link
                href={link}
                mode="plain"
                className="block"
                target={item.target === 'blank' ? '_blank' : item.target}
                asExternal={item.target === '_blank' || item.target === 'blank'}
                aria-current={item.selected ? 'page' : undefined}
            >
                {Content}
            </Link>
        ) : (
            Content
        )


    );
}
