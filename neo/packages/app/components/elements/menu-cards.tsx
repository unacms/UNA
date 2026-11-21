import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Icon } from 'app/ui/atoms/icon';
import Link from 'app/ui/atoms/link';
import { decodeTextNode, findIconFromRemote } from 'app/lib/util';
import { cueAttributes } from 'app/lib/sound';

/** A UNA menu item with its description (`info`, already translated). */
export type MenuCardItem = {
    id?: string | number;
    name?: string;
    title?: string;
    info?: string;
    icon?: string;
    link?: string;
    url?: string;
};

function itemHref(item: MenuCardItem): string {
    const path = String(item?.url || item?.link || '');
    if (!path || path === 'javascript:void(0)') return '';
    if (/^https?:/.test(path) || path.startsWith('/')) return path;
    return `/${path}`;
}

/**
 * A menu UNA draws as cards (its App config says `"view": "cards"`, UNA's "Cards with descriptions" template
 * menu_list_desc_cards.html; the profile types of "Create your profile"), as UNA's site draws it: a bordered card per
 * item with its icon in a 48px circle, the title over the item's `info` and a chevron; the whole card is the link.
 * A lone item is the one action of its block: its card takes the accent border and its circle the accent colour.
 */
export default function MenuCards({ items }: Readonly<{ items: MenuCardItem[] }>) {
    const single = items.length === 1;

    return (
        <View className="w-full gap-2">
            {items.map((item, index) => {
                const title = decodeTextNode(item?.title || item?.name || '');
                return (
                    <Link
                        key={String(item?.id ?? item?.name ?? index)}
                        href={itemHref(item)}
                        mode="plain"
                        haptics="Light"
                        alt={title || undefined}
                        className="w-full rounded-xl"
                        {...cueAttributes('select')}
                    >
                        <Row className={`w-full items-center gap-4 rounded-xl border bg-card p-4 web:transition-colors web:hover:bg-muted/60 ${single ? 'border-primary' : 'border-border'}`}>
                            <View className={`size-12 shrink-0 items-center justify-center rounded-full ${single ? 'bg-primary' : 'bg-muted'}`}>
                                <Icon icon={findIconFromRemote(item?.icon) || 'Circle'} size={22} className={single ? 'text-primary-foreground' : 'text-foreground'} />
                            </View>
                            <View className="min-w-0 flex-1 gap-0.5">
                                <Text className="text-base font-semibold text-card-foreground">{title}</Text>
                                {item?.info ? <Text className="text-sm text-muted-foreground">{decodeTextNode(item.info)}</Text> : null}
                            </View>
                            <Icon icon="ChevronRight" size={18} className="shrink-0 text-muted-foreground" />
                        </Row>
                    </Link>
                );
            })}
        </View>
    );
}
