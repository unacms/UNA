import { useState } from 'react';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Icon } from 'app/ui/atoms/icon';
import Image from 'app/ui/atoms/image';
import { isEmoji, appSetting, resolveMenuItemDescription } from 'app/lib/util';
import Link from 'app/ui/atoms/link'
import { cueAttributes } from 'app/lib/sound';
const menuSettings = appSetting('theme', 'dropdown_menu');

const getIcon = (oItem, iconSize = 20, rowHovered, imageClass = 'h-8 w-8 rounded-full') => {
    const image = oItem?.image
    if (typeof image === 'string' && image && /^(https?:|file:|content:|data:)/i.test(image)) {
        return (
            <Image
                src={image}
                className={imageClass}
                view="cover"
                sizes="auto"
            />
        )
    }
    if (!oItem?.icon) return null;

    const selected = !!oItem.selected;
    // In the item's icon circle the glyph takes the label's colour; the selected one is the circle's foreground.
    let glyphClass = menuSettings.item_icon ? menuSettings.item_icon_glyph : null;
    if (selected)
        glyphClass = menuSettings.item_icon_selected ?? 'text-accent-foreground';
    const className = [oItem?.class_item_icon, oItem?.addClassName, glyphClass]
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

/**
 * Classes for a vertical row of `size` (`theme.dropdown_menu.item_sizes`): the size-free base plus that size.
 * Regular, or a size the theme doesn't have, keeps the plain presets (`item_ver`, `item_icon`, `item_text`, ...).
 */
const sizedPresets = (size) => {
    const sz = size && size !== 'regular' ? menuSettings.item_sizes?.[size] : null;
    if (!sz)
        return null;
    return {
        item_ver: `${menuSettings.item_ver_base} ${sz.item}`,
        item_icon: `${menuSettings.item_icon_base} ${sz.icon}`,
        item_icon_active: `${menuSettings.item_icon_active_base} ${sz.icon}`,
        item_text: `${menuSettings.item_text_base} ${sz.text}`,
        item_text_selected: `${menuSettings.item_text_selected_base} ${sz.text}`,
        item_image: `rounded-full ${sz.icon}`,
        icon_size: sz.icon_size,
    };
};

export default function DropdownMenuItem({ item, index, link, handleSelect, classes, className,  counter, handleCounter, mode, size }) {
    const { t } = useTranslation();
    const key = item.id ?? index;
    const presets = { ...menuSettings, ...sizedPresets(size) };
    const iconSize = presets.icon_size || 16;
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

    const icon = getIcon(item, iconSize, rowHovered, presets.item_image);
    const iconWrapClass = item.selected
        ? (presets.item_icon_active ?? presets.item_icon)
        : presets.item_icon;

    const itemTextKey = classes?.item_text_key || 'item_text';
    const itemTextClass =
        (item.selected ? presets[`${itemTextKey}_selected`] : null) ?? presets[itemTextKey] ?? presets.item_text;
    const itemDescriptionClass =
        menuSettings.item_description ?? 'text-xs font-normal leading-tight text-pretty text-muted-foreground px-2';
    const itemCntKey = classes?.item_cnt_key ?? 'item_cnt';
    const itemCntClass =
        menuSettings[itemCntKey] ?? menuSettings.item_cnt;
    const rowClassName = classes?.item_row ?? 'justify-between items-start';
    const description = resolveMenuItemDescription(item);
    const descriptionText = description ? t(description) : '';

    // A link row is the child of `<Link asChild>` (below). Web wraps it in an anchor; on
    // native the Link hands its onPress to the child, so the row has to be pressable.
    const Wrapper = handleSelect || (link && Platform.OS !== 'web') ? Pressable : View;
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
            className={`group ${className} ${presets[classes?.item || 'item_ver']}${item.selected ? ` ${menuSettings.item_selected ?? 'bg-accent'}` : ''}`}
            key={key}
            {...pressProps}
            {...rowHoverProps}
            // A menu option (web; native menus are bottom sheets and stay quiet). `item.sound` changes it; false for
            // an option whose choice answers itself (the Sounds level).
            {...(handleSelect || link ? cueAttributes(item.sound ?? 'select') : {})}
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
                        <Text className={presets.item_text}>{counter}</Text>
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
