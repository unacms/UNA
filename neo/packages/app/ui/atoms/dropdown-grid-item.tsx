import type { GestureResponderEvent } from 'react-native';
import { Pressable, View } from 'app/design/view';
import { cueAttributes } from 'app/lib/sound';
import { Text } from 'app/design/typography';
import { Icon } from 'app/ui/atoms/icon';
import Image from 'app/ui/atoms/image';
import { isEmoji, appSetting, decodeTextNode } from 'app/lib/util';
import Link from 'app/ui/atoms/link';

const menuSettings = appSetting('theme', 'dropdown_menu');

/** UNA menu item as used by the dropdown grid. */
export type DropdownGridMenuItem = {
    id?: string | number;
    title?: unknown;
    /** Icon name, emoji, or raw SVG. */
    icon?: string;
    /** Image URL; wins over `icon`. */
    image?: string;
    icon_size?: number;
    class_item_icon?: string;
    addClassName?: string;
    animated?: boolean;
    target?: string;
    [key: string]: unknown;
};

function GridIcon({ item }: Readonly<{ item: DropdownGridMenuItem }>) {
    const image = item?.image;
    if (typeof image === 'string' && image && /^(https?:|file:|content:|data:)/i.test(image)) {
        return (
            <Image
                src={image}
                className="h-12 w-12 rounded-full"
                view="cover"
                sizes="auto"
            />
        );
    }
    if (!item?.icon) return null;

    const iconClass = item?.class_item_icon || item?.addClassName || menuSettings.item_icon_glyph || '';
    if (typeof item.icon === 'string' && isEmoji(item.icon)) {
        return <Text className={iconClass}>{item.icon}</Text>;
    }

    const useAnimated = item.animated === true;
    return (
        <Icon
            className={iconClass}
            icon={item.icon}
            size={item?.icon_size || menuSettings.icon_size_grid || 24}
            animated={useAnimated}
        />
    );
}

type DropdownGridItemProps = {
    item: DropdownGridMenuItem;
    index: number;
    /** When set, the tile is wrapped in a Link. */
    link?: string;
    handleSelect?: (event: GestureResponderEvent, item: DropdownGridMenuItem) => void;
    className?: string;
};

export default function DropdownGridItem({ item, index, link, handleSelect, className }: DropdownGridItemProps) {
    const key = item.id ?? index;
    const title = typeof item.title === 'string' ? item.title : '';
    // The icon's hover motion is CSS, keyed on the tile's `group` class (`item_grid`).
    const icon = <GridIcon item={item} />;
    const Wrapper = handleSelect ? Pressable : View;
    const pressProps =
        typeof handleSelect === 'function'
            ? { onPress: (event: GestureResponderEvent) => handleSelect(event, item) }
            : {};

    const Content = (
        <Wrapper
            className={`${className || ''} ${menuSettings.item_grid || ''}`}
            key={key}
            accessibilityRole={handleSelect ? 'button' : undefined}
            accessibilityLabel={decodeTextNode(title) || undefined}
            {...pressProps}
            {...(handleSelect || link ? cueAttributes('select') : {})}
        >
            {icon ? <View className={menuSettings.item_icon_grid}>{icon}</View> : null}
            {title ? (
                <Text numberOfLines={2} className={menuSettings.item_text_grid}>
                    {title}
                </Text>
            ) : null}
        </Wrapper>
    );

    if (!link) return Content;

    return (
        <Link
            href={link}
            mode="plain"
            className="block w-full"
            target={item.target === 'blank' ? '_blank' : item.target}
            asExternal={item.target === '_blank' || item.target === 'blank'}
            alt={title || undefined}
        >
            {Content}
        </Link>
    );
}
