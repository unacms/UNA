import { Platform } from 'react-native';
import { Text } from 'app/design/typography';
import { View, Row } from 'app/design/view';
import Link from 'app/ui/atoms/link';
import Image from 'app/ui/atoms/image';
import { Icon } from 'app/ui/atoms/icon';
import { stripTags } from 'app/lib/util';
import type { SearchHitData } from './search-window.types';

type SearchHitProps = {
    data: SearchHitData;
    /** The group's icon, for a row without a picture. */
    icon?: string;
    /** Chosen with the arrow keys: the highlight, and "Open ↵" at the row's end (web). */
    active?: boolean;
    openLabel?: string;
    onOpen?: () => void;
};

function hitImage(data: SearchHitData): string {
    if (data.image && typeof data.image === 'object' && data.image.src) return data.image.src;
    if (typeof data.image === 'string') return data.image;
    if (data.search_kind === 'profile' && data.author_data?.url_avatar) return data.author_data.url_avatar;
    return '';
}

/**
 * A search result: its picture (or the person's, or the module's icon), its title (a comment's text) and what it is
 * and who made it. The whole row opens it.
 */
export default function SearchHit({ data, icon = 'Search', active = false, openLabel, onOpen }: SearchHitProps) {
    const title = (data.title ? stripTags(String(data.title)) : stripTags(String(data.text ?? ''))).trim();
    const image = hitImage(data);
    const author = data.search_kind !== 'profile' ? data.author_data?.display_name : '';
    const meta = [data.module_title, author].filter(Boolean).join(' · ');
    const letter = (title || '?').charAt(0).toUpperCase();

    return (
        <Link href={data.url} mode="plain" onPress={onOpen} className="block" aria-current={active ? 'true' : undefined}>
            {/* the menu items' hover colour (theme.menu_item), 12px round */}
            <Row className={'items-center gap-3 rounded-xl p-2 web:hover:bg-muted/80 web:transition-colors web:duration-150 ' + (active ? 'bg-muted/80' : '')}>
                <View className={'size-10 shrink-0 items-center justify-center overflow-hidden bg-button ' + (data.search_kind === 'profile' ? 'rounded-full' : 'rounded-lg')}>
                    {image ? (
                        <Image src={image} alt="" view="cover" className="size-10" sizes="40px" />
                    ) : data.search_kind === 'profile' ? (
                        <Text className="text-base font-semibold text-secondary-foreground">{letter}</Text>
                    ) : (
                        <Icon icon={icon} size={20} className="text-secondary-foreground" />
                    )}
                </View>
                <View className="min-w-0 flex-1">
                    <Text className="text-sm font-medium text-foreground" numberOfLines={1}>{title}</Text>
                    {!!meta && <Text className="text-xs text-muted-foreground" numberOfLines={1}>{meta}</Text>}
                </View>
                {active && !!openLabel && Platform.OS === 'web' && (
                    <Text className="shrink-0 text-xs font-medium text-muted-foreground" aria-hidden>{openLabel + ' ↵'}</Text>
                )}
            </Row>
        </Link>
    );
}
