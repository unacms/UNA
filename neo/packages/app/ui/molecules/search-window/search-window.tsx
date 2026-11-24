import { useEffect, useRef, useState } from 'react';
import { Text } from 'app/design/typography';
import { View, Row, ScrollView } from 'app/design/view';
import { NeoButton, NeoButtonLink, TextInputClear } from 'app/design/controls';
import { Icon } from 'app/ui/atoms/icon';
import { appStatic } from 'app/lib/app-static';
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import Redirect, { type RedirectHandle } from 'app/ui/atoms/redirect';
import { hasSearchQuery, searchResultsHref, withSearchValue, type SearchQuery } from 'app/lib/search-window';
import { useSearchWindowData, fetchSearchWindow } from './use-search-window';
import SearchChips from './search-chips';
import SearchHit from './search-hit';
import type { SearchGroupData, SearchHitData, SearchWindowProps } from './search-window.types';

/** `{0}`, `{1}` in a string UNA sent. */
export function fillString(text: string | undefined, ...values: Array<string | number>): string {
    return String(text ?? '').replace(/\{(\d)\}/g, (_m, i) => String(values[Number(i)] ?? ''));
}

function countText(count: number, more: boolean): string {
    return String(count) + (more ? '+' : '');
}

/**
 * The search window (UNA's BxDolSearchUnified, as the site's): the field, the filter chips under it (the scope it was
 * opened with, removable; Title only, Created by, Date; a module's own search fields), and the results with their
 * count, sort and a tab per module, then the full results page. The header's Search, a section's or context's Search
 * and Cmd/Ctrl+K open it in a dialog (SearchWindowHost); the results page and Explore have it in the page.
 */
export default function SearchWindow({ initialQuery = {}, mode = 'modal', autoFocus = true, onClose, onQueryChange }: SearchWindowProps) {
    const [query, setQuery] = useState<SearchQuery>(initialQuery);
    const [keyword, setKeyword] = useState<string>(initialQuery.keyword ?? '');
    const [aiToken, setAiToken] = useState(0);
    const [active, setActive] = useState(-1);
    const aiKeyword = useRef('');
    const inputRef = useRef<any>(null);
    const redirectRef = useRef<RedirectHandle | null>(null);
    const { data, loading, error, allGroups } = useSearchWindowData(query, aiToken, (next) => {
        setQuery(next);
        setKeyword(next.keyword ?? '');
    });

    // pages of a module after its first ("Show more"): appended under the group, reset with the query
    const [extra, setExtra] = useState<{ key: string; items: SearchHitData[]; cursor: string } | null>(null);
    const [extraLoading, setExtraLoading] = useState(false);
    const queryKey = JSON.stringify(query);


    useEffect(() => {
        onQueryChange?.(query);
    }, [queryKey]); // eslint-disable-line react-hooks/exhaustive-deps

    const strings = (data as any)?.strings ?? {};
    const scope = data?.scope;
    const results = data?.results;
    const hasQuery = hasSearchQuery(query);
    const oneGroup = results && 'group' in results && results.group ? results.group : null;
    const groups: SearchGroupData[] = oneGroup
        // a page with no row the viewer may see can still have more after it (UNA checks a capped number per request)
        ? (oneGroup.items.length || oneGroup.cursor ? [{ ...oneGroup, items: extra?.key === queryKey ? [...oneGroup.items, ...extra.items] : oneGroup.items }] : [])
        : (results?.groups ?? []);
    const cursor = oneGroup ? (extra?.key === queryKey ? extra.cursor : oneGroup.cursor) : '';
    const total = oneGroup ? countText(oneGroup.count, oneGroup.count_more) : countText(results?.total ?? 0, !!results?.total_more);
    const flat = groups.flatMap((group) => group.items.map((item) => ({ item, group })));

    const change = (next: SearchQuery) => {
        setActive(-1);
        setQuery(next);
    };

    const onChangeText = (value: string) => {
        setKeyword(value);
        change(withSearchValue(query, 'keyword', value.trim()));
    };

    const onSubmit = () => {
        const chosen = flat[active];
        if (chosen?.item.url) {
            onClose?.();
            return;
        }
        // with AI on, the first Enter on new words lets it read them (a module, dates)
        const words = keyword.trim();
        if (scope?.ai && words && words !== aiKeyword.current) {
            aiKeyword.current = words;
            setAiToken((n) => n + 1);
        }
    };

    const onKeyPress = (event: any) => {
        // the web sends both keydown and keypress: arrows come as keydown, so take only that there
        if (event?.type === 'keypress') return;
        const key = event?.nativeEvent?.key ?? event?.key;
        if (key === 'ArrowDown' || key === 'ArrowUp') {
            event.preventDefault?.();
            setActive((i) => Math.max(0, Math.min(flat.length - 1, i + (key === 'ArrowDown' ? 1 : -1))));
        }
        else if (key === 'Enter' && flat[active]?.item.url) {
            // the chosen row opens
            event.preventDefault?.();
            redirectRef.current?.redirect(String(flat[active]?.item.url));
            onClose?.();
        }
    };

    const showMore = async () => {
        if (!cursor || extraLoading) return;
        setExtraLoading(true);
        try {
            const tab = oneGroup?.name ?? '';
            const page = await fetchSearchWindow({ ...query, ...(query.section ? {} : { tab }), cursor });
            const group = page?.results && 'group' in page.results ? page.results.group : null;
            if (group)
                setExtra({ key: queryKey, items: [...(extra?.key === queryKey ? extra.items : []), ...group.items], cursor: group.cursor });
        } finally {
            setExtraLoading(false);
        }
    };

    useEffect(() => {
        if (autoFocus) setTimeout(() => inputRef.current?.focus?.(), 50);
    }, [autoFocus]);

    const tabs = scope && scope.scope !== 'module' && allGroups.length > 0 ? allGroups : null;

    return (
        <View className="w-full">
            <Redirect ref={redirectRef} />
            <Row className="items-center gap-2 border-b border-border px-3 py-2">
                <Icon icon="Search" size={20} className="text-muted-foreground" />
                {/* borderless, as UNA's window: the dialog's top row is the field */}
                <TextInputClear
                    ref={inputRef}
                    className="min-w-0 flex-1 bg-transparent border-0 p-0 h-11 text-lg text-foreground placeholder:text-muted-foreground web:outline-none web:focus:outline-none web:focus-visible:outline-none"
                    role="searchbox"
                    accessibilityLabel={strings.title || 'Search'}
                    placeholder={strings.placeholder || ''}
                    value={keyword}
                    onChangeText={onChangeText}
                    onSubmitEditing={onSubmit}
                    onKeyPress={onKeyPress}
                    // the web's arrows come as keydown (a key press has none)
                    {...({ onKeyDown: onKeyPress } as Record<string, unknown>)}
                    returnKeyType="search"
                    autoCorrect={false}
                    autoCapitalize="none"
                    // the caret is the focus, as in UNA's window (no field box to ring)
                    style={{ outline: 'none', boxShadow: 'none' } as Record<string, string>}
                />
                {loading && <View className="size-4 rounded-full border-2 border-border border-t-accent-foreground web:animate-spin" aria-hidden />}
                {mode === 'modal' && (
                    <NeoButton
                        image="X"
                        controlSize="small"
                        borderShape="circle"
                        accessibilityLabel={strings.close || 'Close'}
                        onPress={onClose}
                    />
                )}
            </Row>

            {/* the chips, and the sort at the end of their row once there is something to sort */}
            {scope && (
                <SearchChips
                    query={query}
                    scope={scope}
                    strings={strings}
                    onChange={change}
                    trailing={hasQuery ? (
                                        <DropdownMenu
                                            items={[
                                                { id: 'best', title: strings.sort_best, selected: query.sort !== 'new' },
                                                { id: 'new', title: strings.sort_new, selected: query.sort === 'new' },
                                            ]}
                                            onSelect={(item) => change(withSearchValue(query, 'sort', item.id === 'new' ? 'new' : null))}
                                            triggerAccessibilityLabel={(strings.sort || '') + ': ' + (query.sort === 'new' ? strings.sort_new : strings.sort_best)}
                                        >
                                            <NeoButton
                                                label={query.sort === 'new' ? strings.sort_new : strings.sort_best}
                                                image="ChevronDown"
                                                imagePlacement="trailing"
                                                style="bordered"
                                                controlSize="small"
                                                interactive
                                            />
                                        </DropdownMenu>
                    ) : null}
                />
            )}

            <View className="px-3 pb-3">
                    {!hasQuery ? (mode === 'explore' ? null : (
                        <Text className="py-6 text-center text-sm text-muted-foreground">{strings.hint || ''}</Text>
                    )) : error && !data ? (
                        <Text className="py-6 text-center text-sm text-destructive">{strings.error || ''}</Text>
                    ) : results ? (
                        <>
                            {/* a failed request for new words: the last results stay, dimmed, under the error */}
                            {error && <Text className="pt-3 text-sm text-destructive" role="alert">{strings.error || ''}</Text>}
                            <Row className="items-center justify-between gap-3 pb-2 pt-3">
                                <Text className="text-sm font-medium text-muted-foreground" role="status" aria-live="polite">
                                    {fillString(strings.count, total)}
                                </Text>

                            </Row>

                            {tabs && (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-1 pb-2" accessibilityRole="tablist">
                                    <NeoButton
                                        label={strings.tab_all}
                                        controlSize="small"
                                        selected={!query.tab}
                                        accessibilityRole="tab"
                                        onPress={() => change(withSearchValue(query, 'tab', null))}
                                    />
                                    {tabs.map((group) => (
                                        <NeoButton
                                            key={group.name}
                                            label={group.title + ' ' + countText(group.count, group.count_more)}
                                            controlSize="small"
                                            selected={query.tab === group.name}
                                            accessibilityRole="tab"
                                            onPress={() => change(withSearchValue(query, 'tab', group.name))}
                                        />
                                    ))}
                                </ScrollView>
                            )}

                            {groups.map((group) => (
                                <View key={group.name} className={'py-1' + (error ? ' opacity-50' : '')}>
                                    <Row className="items-center gap-2 py-2">
                                        <Icon icon={group.icon} size={16} className="text-foreground" />
                                        <Text className="text-sm font-semibold text-foreground" role="heading" aria-level={3}>{group.title}</Text>
                                    </Row>
                                    {group.items.map((item, index) => {
                                        const at = flat.findIndex((f) => f.item === item);
                                        return <SearchHit key={String(item.id ?? index) + (item.search_kind ?? '')} data={item} icon={group.icon} active={at === active} onOpen={onClose} />;
                                    })}
                                    {!oneGroup && (group.count > group.items.length || group.count_more) && (
                                        <NeoButton
                                            label={group.count ? fillString(strings.show_all, countText(group.count, group.count_more), group.title) : strings.more}
                                            style="borderless"
                                            controlSize="small"
                                            classNames={{ root: 'self-start' }}
                                            onPress={() => change(withSearchValue(query, 'tab', group.name))}
                                        />
                                    )}
                                </View>
                            ))}

                            {!!cursor && (
                                <NeoButton
                                    label={strings.more}
                                    controlSize="small"
                                    loading={extraLoading}
                                    classNames={{ root: 'self-start mt-2' }}
                                    onPress={showMore}
                                />
                            )}

                            {!groups.length && !loading && (
                                <View className="py-6">
                                    {appStatic('components_content_empty', {})}
                                    <Text className="text-center text-sm text-muted-foreground">{strings.empty}</Text>
                                </View>
                            )}
                        </>
                    ) : null}
            </View>

            {mode !== 'page' && hasQuery && (
                <Row className="items-center justify-end border-t border-border px-3 py-2">
                    <NeoButtonLink
                        href={searchResultsHref(query)}
                        label={strings.full}
                        controlSize="small"
                        image="ArrowRight"
                        imagePlacement="trailing"
                        onPress={onClose}
                    />
                </Row>
            )}
        </View>
    );
}
