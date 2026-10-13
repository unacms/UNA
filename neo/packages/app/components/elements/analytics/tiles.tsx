import { useState } from 'react';
import { View } from 'app/design/view';
import { Text } from 'app/design/typography';
import { cn, isWeb } from 'app/lib/util';
import type { Trend } from './format';

export const TREND_TEXT: Record<Trend, string> = {
    good: 'text-trend-good',
    bad: 'text-trend-bad',
    flat: 'text-muted-foreground',
};

// Tiles per row by the block's own width: the block sits in a column, so the viewport
// breakpoints (used until the first measurement) say little about its room.
const TILE_WIDTH: Record<number, string> = { 1: 'w-full', 2: 'w-1/2', 3: 'w-1/3', 4: 'w-1/4', 6: 'w-1/6' };
const TILE_WIDTH_BEFORE_LAYOUT = 'w-1/2 sm:w-1/3 lg:w-1/6';

/** Width class of a tile in a row `width` wide; `count` tiles in all, so a short row isn't left half empty. */
export function getTileWidth(width: number, count = 6): string {
    if (width <= 0) return TILE_WIDTH_BEFORE_LAYOUT;
    let columns = width >= 840 ? 6 : width >= 420 ? 3 : 2;
    if (count > 0 && count < columns && TILE_WIDTH[count]) columns = count;
    return TILE_WIDTH[columns] ?? TILE_WIDTH_BEFORE_LAYOUT;
}

/** The measured width of a tile row, for getTileWidth. */
export function useTileRowWidth() {
    const [width, setWidth] = useState(0);
    const onLayout = (event: { nativeEvent: { layout: { width: number } } }) => setWidth(Math.round(event.nativeEvent.layout.width));
    return { width, onLayout };
}

export type StatTileProps = {
    title: string;
    value: string;
    /** +12%, '' for none. */
    change?: string;
    trend?: Trend;
    sub?: string;
    /** Read instead of the parts, e.g. with the previous period. */
    accessibilityLabel?: string;
    widthClass: string;
};

/** A key figure that is not a switch: title, value, change and a note. */
export function StatTile({ title, value, change, trend = 'flat', sub, accessibilityLabel, widthClass }: StatTileProps) {
    const label = accessibilityLabel ?? [`${title}: ${value}`, change, sub].filter(Boolean).join(', ');
    // One stop on native; web can't name a div without a role, so it reads the label as hidden text.
    const hideOnWeb = isWeb ? { 'aria-hidden': true } : {};
    return (
        <View className={cn('p-1', widthClass)}>
            <View
                className="min-h-11 w-full gap-1 rounded-xl bg-muted-foreground/10 px-3 py-2"
                {...(isWeb ? {} : { accessible: true, accessibilityLabel: label })}
            >
                {isWeb ? <Text className="sr-only">{label}</Text> : null}
                <Text className="text-xs text-muted-foreground" numberOfLines={2} {...hideOnWeb}>{title}</Text>
                <View className="flex-row flex-wrap items-baseline gap-x-2" {...hideOnWeb}>
                    <Text className="text-xl font-semibold text-foreground">{value}</Text>
                    {change ? <Text className={cn('text-xs font-medium', TREND_TEXT[trend])}>{change}</Text> : null}
                </View>
                {sub ? <Text className="text-xs text-muted-foreground" {...hideOnWeb}>{sub}</Text> : null}
            </View>
        </View>
    );
}
