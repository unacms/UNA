import type { ReactNode } from 'react';
import { Platform, type GestureResponderEvent } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Icon } from 'app/ui/atoms/icon';
import Image from 'app/ui/atoms/image';
import { isEmoji, appSetting, resolveMenuItemDescription, cn } from 'app/lib/util';
import Link from 'app/ui/atoms/link'
import { cueAttributes, type PressCue } from 'app/lib/sound';
import type { DropdownMenuItemSize } from 'app/ui/atoms/dropdown-menu';

const menuSettings = appSetting('theme', 'dropdown_menu');

/** A UNA menu item as a dropdown row draws it. */
export type DropdownRowItem = {
    id?: string | number;
    /** A string label, or a node (a custom control) that renders itself. */
    title?: ReactNode;
    /** Icon name, emoji, or raw SVG. */
    icon?: string;
    /** Image URL; wins over `icon`. */
    image?: string;
    icon_size?: number;
    class_item_icon?: string;
    addClassName?: string;
    animated?: boolean;
    link?: string;
    target?: string;
    /** `group_header` or `separator` structure sectioned menus; anything else is a row. */
    type?: string;
    /** true or false makes the row a radio option; true marks it current. */
    selected?: boolean;
    /** First group header of a sectioned menu. */
    first?: boolean;
    /** The cue the row plays when pressed (web); false for none. */
    sound?: PressCue;
    [key: string]: unknown;
};

type SelectHandler = (event: GestureResponderEvent, item: DropdownRowItem) => void;

/** Theme keys of `theme.dropdown_menu` (and their `_selected` twins) a variant uses instead of the defaults. */
export type DropdownRowClasses = {
    item?: string;
    item_text_key?: string;
    item_cnt_key?: string;
    item_row?: string;
};

type Presets = Record<string, any>;

export type DropdownMenuItemProps = {
    item: DropdownRowItem;
    index: number;
    /** Wraps the row in a Link. */
    link?: string;
    handleSelect?: SelectHandler;
    classes?: DropdownRowClasses;
    className?: string;
    counter?: ReactNode;
    handleCounter?: SelectHandler;
    mode?: string;
    /** Row size of a vertical list (`theme.dropdown_menu.item_sizes`); regular by default. */
    size?: DropdownMenuItemSize;
};

const getIcon = (oItem: DropdownRowItem, iconSize: number, imageClass = 'h-8 w-8 rounded-full') => {
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
            />
        );
    }
};

/**
 * Classes for a vertical row of `size` (`theme.dropdown_menu.item_sizes`): the size-free base plus that size.
 * Regular, or a size the theme doesn't have, keeps the plain presets (`item_ver`, `item_icon`, `item_text`, ...).
 */
const sizedPresets = (size?: DropdownMenuItemSize): Presets | null => {
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

function GroupHeader({ item }: Readonly<{ item: DropdownRowItem }>) {
    const headerClass = item.first
        ? (menuSettings.item_group_header_first ?? menuSettings.item_group_header)
        : menuSettings.item_group_header;
    return (
        <View className={headerClass || 'px-2 pt-3 pb-1'}>
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

/** Press handler, plus the radio role when the item is a pickable option (`selected` true or false). */
const getPressProps = (item: DropdownRowItem, handleSelect?: SelectHandler) => {
    if (typeof handleSelect !== 'function')
        return {};
    const props = { onPress: (event: GestureResponderEvent) => handleSelect(event, item) };
    if (item.selected !== true && item.selected !== false)
        return props;
    return {
        ...props,
        accessibilityRole: 'radio' as const,
        accessibilityState: { selected: !!item.selected, checked: !!item.selected },
        'aria-checked': !!item.selected,
    };
};

/** Label classes: the variant's text preset (`classes.item_text_key`), its `_selected` twin for the picked item. */
const getTextClass = (presets: Presets, item: DropdownRowItem, classes?: DropdownRowClasses): string => {
    const itemTextKey = classes?.item_text_key || 'item_text';
    const selectedClass = item.selected ? presets[`${itemTextKey}_selected`] : null;
    return selectedClass ?? presets[itemTextKey] ?? presets.item_text;
};

/** Web: rows with an animated icon play it while the pointer is over the row. */
/** A string title with its description under it (`resolveMenuItemDescription`). */
function ItemLabel({ item, textClass }: Readonly<{ item: DropdownRowItem; textClass: string }>) {
    const { t } = useTranslation();
    const description = resolveMenuItemDescription(item);
    return (
        <View className={menuSettings.item_text_cnt ?? 'min-w-0 flex-1 flex flex-col self-center justify-center overflow-hidden'}>
            <Text numberOfLines={2} className={`${textClass} line-clamp-2`}>{item.title}</Text>
            {!!description && (
                <Text className={menuSettings.item_description ?? 'text-xs font-normal leading-tight text-pretty text-muted-foreground px-2'}>{t(description)}</Text>
            )}
        </View>
    );
}

export default function DropdownMenuItem({ item, index, link, handleSelect, classes, className, counter, handleCounter, size }: Readonly<DropdownMenuItemProps>) {
    const key = item.id ?? index;
    const presets: Presets = { ...menuSettings, ...sizedPresets(size) };
    const iconSize = presets.icon_size || 16;

    // A node title renders itself; its onPress is already handled inside MenuItemEx, so no outer Pressable.
    if (typeof item.title !== 'string')
        return <>{item.title}</>;

    if (item.type === 'separator') {
        return <View key={key}>{item.title}</View>;
    }

    if (item.type === 'group_header')
        return <GroupHeader key={key} item={item} />;

    const icon = getIcon(item, iconSize, presets.item_image);
    const iconWrapClass = item.selected
        ? (presets.item_icon_active ?? presets.item_icon)
        : presets.item_icon;

    const itemCntClass = menuSettings[classes?.item_cnt_key ?? 'item_cnt'] ?? menuSettings.item_cnt;
    const rowClassName = classes?.item_row ?? 'justify-between items-start';

    // A link row is the child of `<Link asChild>` (below). Web wraps it in an anchor; on
    // native the Link hands its onPress to the child, so the row has to be pressable.
    const Wrapper = handleSelect || (link && Platform.OS !== 'web') ? Pressable : View;
    const pressProps = getPressProps(item, handleSelect);
    const rowClass = cn('group', className, presets[classes?.item || 'item_ver'], item.selected && (menuSettings.item_selected ?? 'bg-accent'));
    const Content = (
        <Wrapper
            className={rowClass}
            key={key}
            {...pressProps}
            // A menu option (web; native menus are bottom sheets and stay quiet). `item.sound` changes it; false for
            // an option whose choice answers itself (the Sounds level).
            {...(handleSelect || link ? cueAttributes(item.sound ?? 'select') : {})}
        >
            <Row className={`${rowClassName} w-full min-w-0`}>
                <View className={itemCntClass}>
                {(!!icon && !!menuSettings.item_icon) && <View className={iconWrapClass}>{icon}</View>}
                {!!item.title && <ItemLabel item={item} textClass={getTextClass(presets, item, classes)} />}
                </View>
                {!!counter && typeof handleCounter === 'function' && (
                    <Pressable className='mr-1' onPress={(event: GestureResponderEvent) => handleCounter(event, item)}>
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
