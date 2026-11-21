import { View } from 'app/design/view';
import { Text } from 'app/design/typography';
import { NeoButtonLink } from 'app/design/controls';
import { BlockWrapper } from 'app/components/block-wrapper';
import { Icon } from 'app/ui/atoms/icon';
import { cn, decodeTextNode } from 'app/lib/util';

/** One row of usage: storage, number of files, the file size limit. */
export interface MembershipUsage {
    key?: string;
    title?: string;
    /** Formatted for reading: "745.8 KB used", "41 MB of 50 MB", "1 file". */
    value?: string;
    current?: number;
    /** 0 = no limit. */
    limit?: number;
    unlimited?: boolean;
    /** "Unlimited" where there is no limit, in the site's language. */
    badge?: string;
    percent?: number;
}

export interface MembershipStatsData {
    level?: { id?: number; name?: string; icon?: string; info?: string; date_expires?: number };
    usage?: MembershipUsage[];
    /** "See memberships" when the Memberships app sells a level; `url` is a page of the site, relative. */
    action?: { title?: string; url?: string };
}

/** A page of the site as an app path, a full link as it is. */
function appHref(url: string): string {
    if (/^https?:/.test(url) || url.startsWith('/')) return url;
    return `/${url}`;
}

function barClass(percent: number): string {
    if (percent >= 100) return 'bg-destructive';
    if (percent >= 80) return 'bg-amber-500';
    return 'bg-primary';
}

function UsageRow({ item }: Readonly<{ item: MembershipUsage }>) {
    const limited = Number(item.limit) > 0;
    const percent = Math.max(0, Math.min(100, Number(item.percent) || 0));
    const title = decodeTextNode(item.title || '');

    return (
        <View className="gap-2">
            <View className="flex-row items-center justify-between gap-3">
                <Text className="text-sm font-medium text-foreground">{title}</Text>
                <View className="flex-row items-center gap-2">
                    <Text className="text-sm text-muted-foreground">{decodeTextNode(item.value || '')}</Text>
                    {item.unlimited && item.badge ? (
                        <View className="rounded-full bg-emerald-600/15 px-2 py-0.5">
                            <Text className="text-xs font-medium text-emerald-700 dark:text-emerald-300">{decodeTextNode(item.badge)}</Text>
                        </View>
                    ) : null}
                </View>
            </View>
            {limited ? (
                <View
                    role="progressbar"
                    aria-label={title}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percent}
                    className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                >
                    <View className={cn('h-full rounded-full', barClass(percent))} style={{ width: `${percent}%` }} />
                </View>
            ) : null}
        </View>
    );
}

/**
 * UNA's "Your membership" block (system/profile_membership_stats): the level with its icon on a 44px circle, and the
 * storage the profile uses against the level's limits. No limit reads as an "Unlimited" badge, a limit as a bar that
 * turns amber at 80% and red when full. UNA sends the strings, so they follow the site's language.
 */
export default function MembershipStats({ data, blockWrapperProps }: Readonly<{ data?: MembershipStatsData; blockWrapperProps?: any }>) {
    const level = data?.level;
    if (!level?.name)
        return null;

    const usage = Array.isArray(data?.usage) ? data.usage : [];
    const action = data?.action?.url ? data.action : null;

    return (
        <BlockWrapper {...blockWrapperProps}>
            <View className="gap-4">
                <View className="flex-row items-center gap-3">
                    <View aria-hidden className="h-11 w-11 shrink-0 items-center justify-center rounded-full bg-button">
                        <Icon icon={level.icon || 'UserRound'} size={20} className="text-secondary-foreground" />
                    </View>
                    <View className="min-w-0 flex-1">
                        <Text numberOfLines={1} className="text-base font-semibold text-foreground">{decodeTextNode(level.name)}</Text>
                        {level.info ? <Text className="text-sm text-muted-foreground">{decodeTextNode(level.info)}</Text> : null}
                    </View>
                    {action ? (
                        <NeoButtonLink href={appHref(action.url || '')} controlSize="small" label={decodeTextNode(action.title || '')} />
                    ) : null}
                </View>
                {usage.length ? (
                    <View className="gap-3">
                        {usage.map((item, index) => <UsageRow key={item.key || index} item={item} />)}
                    </View>
                ) : null}
            </View>
        </BlockWrapper>
    );
}
