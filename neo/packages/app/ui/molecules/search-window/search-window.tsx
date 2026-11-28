import { useEffect, useRef, useState } from 'react';
import { Text } from 'app/design/typography';
import { View, Row, ScrollView } from 'app/design/view';
import { InputWithIcons, ModalHeaderBar, NeoButton, NeoButtonLink, TextInputClear } from 'app/design/controls';
import { Icon } from 'app/ui/atoms/icon';
import EmptyState from 'app/ui/molecules/misc/empty-state';
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
/** The hint, an error and the first load: one short line, so the window before a search is only its field and chips. */
const STATE_LINE = 'px-2 py-3';

/** Inside a block (Explore, the results page) the block's padding is the edge: the field and chips line up with its title. */
const INSET = { modal: 'px-4', page: '', explore: '' } as const;

/**
 * The results as a command palette's list: rows sit 8px from the window's edge and pad 8px, so pictures line up with the
 * group labels and the search icon (16px in) and a row's highlight reaches 8px past them. In a block (Explore, the results
 * page) the list reaches 8px past the block's content for the same.
 */
const LIST = { modal: 'px-2', page: '-mx-2', explore: '-mx-2' } as const;

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
    // words or a filter: the scope the window opened with (a context, a module, a person's author) is not a search yet
    const tried = !!(query.keyword || query.date_from || query.date_to || query.filters || query.title_only);
    const noResults = query.keyword ? fillString(strings.no_results_for, query.keyword) : (strings.no_results || '');
    const oneGroup = results && 'group' in results && results.group ? results.group : null;
    const groups: SearchGroupData[] = oneGroup
        // a page with no row the viewer may see can still have more after it (UNA checks a capped number per request)
        ? (oneGroup.items.length || oneGroup.cursor ? [{ ...oneGroup, items: extra?.key === queryKey ? [...oneGroup.items, ...extra.items] : oneGroup.items }] : [])
        : (results?.groups ?? []);
    const cursor = oneGroup ? (extra?.key === queryKey ? extra.cursor : oneGroup.cursor) : '';
    const total = oneGroup ? countText(oneGroup.count, oneGroup.count_more) : countText(results?.total ?? 0, !!results?.total_more);
    const allTotal = oneGroup && allGroups.length
        ? countText(allGroups.reduce((sum, group) => sum + group.count, 0), allGroups.some((group) => group.count_more))
        : total;
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

    const focusedRef = useRef(false);
    const hasField = mode === 'modal' || !!scope;
    useEffect(() => {
        if (!autoFocus || !hasField || focusedRef.current) return;
        focusedRef.current = true;
        const id = setTimeout(() => inputRef.current?.focus?.(), 50);
        return () => clearTimeout(id);
    }, [autoFocus, hasField]);

    // a tab per module only where there is more than one: "All" counts them all, so no count row of its own
    const tabs = scope && scope.scope !== 'module' && allGroups.length > 1 ? allGroups : null;

    // the field: the search icon in a 36px slot (a small icon button's), so the slot's edge lines up with the chips and
    // results below and the text starts after it
    const field = (
        <>
            <View className="h-9 w-7 shrink-0 justify-center" aria-hidden>
                <Icon icon="Search" size={20} className="text-muted-foreground" />
            </View>
            {/* borderless, as UNA's window: the dialog's top row is the field */}
            <TextInputClear
                ref={inputRef}
                className="min-w-0 flex-1 bg-transparent border-0 p-0 h-9 text-lg text-foreground placeholder:text-muted-foreground web:outline-none web:focus:outline-none web:focus-visible:outline-none"
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
            {loading && <View className="ms-2 size-4 rounded-full border-2 border-border border-t-accent-foreground web:animate-spin" aria-hidden />}
        </>
    );

    // in a block (Explore, the results page): the standard field, filled and round with the search icon inside, as tall
    // as the feed's "Create new update" (44px); "+ Filter" sits at its side (SearchChips, `field`)
    const blockField = (
        <View className="min-w-0 flex-1">
            <InputWithIcons
                ref={inputRef}
                size="regular"
                startDecorator="Search"
                role="searchbox"
                accessibilityLabel={strings.title || 'Search'}
                placeholder={strings.placeholder || ''}
                value={keyword}
                onChangeText={onChangeText}
                onSubmitEditing={onSubmit}
                onKeyPress={onKeyPress}
                {...({ onKeyDown: onKeyPress } as Record<string, unknown>)}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
            />
        </View>
    );

    return (
        <View className="w-full">
            <Redirect ref={redirectRef} />
            {mode === 'modal' && (
                // the modal's own header bar, its Close where every modal has it
                <ModalHeaderBar onClose={onClose}>{field}</ModalHeaderBar>
            )}

            {/* the chips, and the sort at the end of their row once there is something to sort */}
            {scope && (
                <SearchChips
                    field={mode === 'modal' ? undefined : blockField}
                    inset={INSET[mode]}
                    query={query}
                    scope={scope}
                    strings={strings}
                    onChange={change}
                    // the sort: always in the window; in a block once there is something to sort
                    trailing={hasQuery || mode === 'modal' ? (
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

            <View className={'pb-2 ' + LIST[mode]}>
                    {/* the result count for screen readers (the tabs show it): one region, mounted before its text changes */}
                    <Text className="sr-only" role="status" aria-live="polite">{hasQuery && results ? (tried && !groups.length ? noResults : fillString(strings.count, total)) : ''}</Text>
                    {!hasQuery ? (mode === 'explore' ? null : (
                        <View className={STATE_LINE}><Text className="text-sm text-muted-foreground">{strings.hint || ''}</Text></View>
                    )) : error && !results ? (
                        <View className={STATE_LINE}><Text className="text-sm text-destructive">{strings.error || ''}</Text></View>
                    ) : !results ? (
                        // the first answer for the words: the box the hint had, so nothing moves while it loads
                        <View className={STATE_LINE + ' h-11'} aria-busy />
                    ) : results ? (
                        <>
                            {/* a failed request for new words: the last results stay, dimmed, under the error */}
                            {error && <Text className="pt-3 text-sm text-destructive" role="alert">{strings.error || ''}</Text>}
                            {tabs && (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-1 px-2 pt-3" accessibilityRole="tablist">
                                    <NeoButton
                                        label={strings.tab_all + ' ' + allTotal}
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
                                <View key={group.name} className={'pt-4 web:transition-opacity' + (error || loading ? ' opacity-50' : '')}>
                                    {/* a tab names the module it shows; without tabs the heading says how many */}
                                    {!(oneGroup && tabs) && (
                                        <Text className="px-2 pb-1 text-xs font-medium text-muted-foreground" role="heading" aria-level={3}>
                                            {group.title}
                                            {!tabs && ' ' + countText(group.count, group.count_more)}
                                        </Text>
                                    )}
                                    {group.items.map((item, index) => {
                                        const at = flat.findIndex((f) => f.item === item);
                                        return <SearchHit key={String(item.id ?? index) + (item.search_kind ?? '')} data={item} icon={group.icon} active={at === active} openLabel={strings.open} onOpen={onClose} />;
                                    })}
                                    {!oneGroup && (group.count > group.items.length || group.count_more) && (
                                        <NeoButton
                                            label={group.count ? fillString(strings.show_all, countText(group.count, group.count_more), group.title) : strings.more}
                                            style="borderless"
                                            controlSize="small"
                                            classNames={{ root: 'self-start ms-2' }}
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
                                    classNames={{ root: 'self-start mt-2 ms-2' }}
                                    onPress={showMore}
                                />
                            )}

                            {/* kept while new words load (dimmed), so the window does not shrink and grow back */}
                            {/* nothing found: after words or a filter of the member's own, the list says so in its own rows (the
                                shared EmptyState, `rows`); a window only opened with a scope shows its hint, no empty state */}
                            {!groups.length && (tried ? (
                                <View className={'pt-3' + (loading ? ' opacity-50' : '')}>
                                    <EmptyState layout="rows" fallbackTitle={noResults} state={{ icon: 'SearchX', title: noResults, text: strings.empty }} />
                                </View>
                            ) : (
                                <View className={STATE_LINE}><Text className="text-sm text-muted-foreground">{strings.hint || ''}</Text></View>
                            ))}
                        </>
                    ) : null}
            </View>

            {mode !== 'page' && hasQuery && (
                <Row className={'items-center justify-end border-t border-border py-2 ' + INSET[mode]}>
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
