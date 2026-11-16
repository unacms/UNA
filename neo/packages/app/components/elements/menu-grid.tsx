import { Platform } from 'react-native';
import { View } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Icon } from 'app/ui/atoms/icon';
import Link from 'app/ui/atoms/link';
import { MENU_HIGHLIGHT_CLASS, useMenuHighlight } from 'app/ui/atoms/menu-highlight';
import { cueAttributes } from 'app/lib/sound';
import { decodeTextNode } from 'app/lib/util';

/** A UNA menu item as a menu block sends it. */
export type MenuGridItem = {
    id?: string | number;
    name?: string;
    title?: string;
    icon?: string;
    link?: string;
    url?: string;
    target?: string;
};

/** A tile's link: an app path (`/...`) or a full URL; none for an item that only opens something on the site. */
function itemHref(item: MenuGridItem): string {
    const path = String(item?.url || item?.link || '');
    if (!path || path === 'javascript:void(0)') return '';
    if (/^https?:/.test(path) || path.startsWith('/')) return path;
    return `/${path}`;
}

// As UNA's home menu (Artificer menu.css, ul.bx-menu-floating-blocks): as many 6.5rem columns as fit, stretched to
// fill the row. Native has no CSS grid: three columns on phones, four from tablet.
const WEB_GRID_STYLE: any = Platform.OS === 'web'
    ? { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(6.5rem, 1fr))' }
    : undefined;

/**
 * A menu block UNA draws as a grid (the menu's App config says `"view": "grid"`, the home menu), as UNA's site draws
 * it: tiles with a 32px icon over the label, no circle, edge to edge, sitting 8px from the block's edges (the list
 * reaches 8px into the block's 16px padding) with 8px corners, one highlight sliding under the pointer.
 */
export default function MenuGrid({ items }: Readonly<{ items: MenuGridItem[] }>) {
    const highlightRef = useMenuHighlight();

    return (
        <View ref={highlightRef} className={`${MENU_HIGHLIGHT_CLASS} -m-2 flex-row flex-wrap`} style={WEB_GRID_STYLE}>
            {items.map((item, index) => {
                const title = decodeTextNode(item?.title || item?.name || '');
                const href = itemHref(item);
                const tile = (
                    <View className="w-full min-w-0 items-center justify-center rounded-lg p-2">
                        <View className="m-2 size-8 items-center justify-center">
                            <Icon icon={item?.icon || 'Circle'} size={32} className="text-muted-foreground web:group-hover:text-foreground" />
                        </View>
                        {title ? (
                            <Text numberOfLines={1} className="max-w-full text-center text-sm font-medium text-muted-foreground web:group-hover:text-foreground">
                                {title}
                            </Text>
                        ) : null}
                    </View>
                );

                return (
                    <View key={String(item?.id ?? item?.name ?? index)} className="w-1/3 sm:w-1/4 web:w-auto">
                        {href ? (
                            <Link
                                href={href}
                                mode="plain"
                                alt={title || undefined}
                                className="group block w-full rounded-lg"
                                target={item.target === 'blank' ? '_blank' : item.target}
                                asExternal={item.target === '_blank' || item.target === 'blank'}
                                {...cueAttributes('select')}
                            >
                                {tile}
                            </Link>
                        ) : tile}
                    </View>
                );
            })}
        </View>
    );
}
