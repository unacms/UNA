import { useEffect, useState } from 'react';
import { View, Row } from 'app/design/view';
import { NeoButton, Input } from 'app/design/controls';
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { fetcher } from 'app/lib/fetcher';
import { useCurrentUser } from 'app/context/user';
import { searchFilters, withSearchFilter, withSearchValue, type SearchQuery } from 'app/lib/search-window';
import type { SearchChip, SearchScopeData } from './search-window.types';

type ChipsProps = {
    query: SearchQuery;
    scope: SearchScopeData;
    strings: Record<string, string>;
    onChange: (query: SearchQuery) => void;
};

function fill(text: string | undefined, ...values: Array<string | number>): string {
    return String(text ?? '').replace(/\{(\d)\}/g, (_m, i) => String(values[Number(i)] ?? ''));
}

function ymd(date: Date): string {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
}

/** [from, to] of a date preset: days before today, or days from today on. */
function presetRange(days: number, ahead: boolean): [string, string] {
    const today = new Date();
    const other = new Date(today.getTime() + (ahead ? 1 : -1) * days * 86400000);
    return ahead ? [ymd(today), ymd(other)] : [ymd(other), ymd(today)];
}

function timezone(): string {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    } catch {
        return '';
    }
}

/** A chip with a value: the accent look, and a remove button after it. */
function SetChip({ caption, icon, removeLabel, onRemove }: { caption: string; icon?: string; removeLabel: string; onRemove: () => void }) {
    return (
        <Row className="items-center">
            <NeoButton label={caption} image={icon} controlSize="small" selected interactive={false} />
            <NeoButton image="X" controlSize="small" borderShape="circle" selected accessibilityLabel={removeLabel} onPress={onRemove} classNames={{ root: '-ms-1' }} />
        </Row>
    );
}

/**
 * The window's filter chips under its field, from UNA's scope descriptor: the scope ("In: …", removable), Title only,
 * Created by, Date, and in a module's scope its own search fields (category, gender...). In global search "Filter"
 * picks a module to look in.
 */
export default function SearchChips({ query, scope, strings, onChange }: ChipsProps) {
    const { currentUser } = useCurrentUser();
    const [findPerson, setFindPerson] = useState(false);
    const filters = searchFilters(query);

    const chip = (c: SearchChip) => {
        const remove = (key: keyof SearchQuery) => () => onChange(withSearchValue(query, key, null));

        switch (c.type) {
            case 'scope':
                return (
                    <SetChip
                        key={c.name + String(c.value)}
                        caption={c.caption}
                        icon={c.name === 'context' ? 'UsersRound' : (c.icon || 'Search')}
                        removeLabel={fill(strings.remove, c.caption)}
                        onRemove={c.name === 'context' ? remove('context') : remove('section')}
                    />
                );

            case 'toggle':
                return (
                    <NeoButton
                        key={c.name}
                        label={c.caption}
                        image="Type"
                        controlSize="small"
                        selected={!!c.value}
                        accessibilityState={{ checked: !!c.value }}
                        onPress={() => onChange(withSearchValue(query, c.name as keyof SearchQuery, c.value ? null : '1'))}
                    />
                );

            case 'profile': {
                if (c.value)
                    return <SetChip key={c.name} caption={fill(strings.created_by_value, c.value_title ?? '')} icon="UserRound" removeLabel={fill(strings.remove, c.caption)} onRemove={remove('author')} />;
                const items = [
                    ...(currentUser ? [{ id: 'me', title: strings.me }] : []),
                    { id: 'find', title: strings.find_person },
                ];
                return (
                    <DropdownMenu
                        key={c.name}
                        items={items}
                        onSelect={(item) => {
                            if (item.id === 'me') onChange(withSearchValue(query, 'author', String(currentUser ? currentUser.id : '')));
                            else setFindPerson(true);
                        }}
                        triggerAccessibilityLabel={c.caption}
                    >
                        <NeoButton label={c.caption} image="UserRound" controlSize="small" interactive />
                    </DropdownMenu>
                );
            }

            case 'date_range': {
                const value = c.value as { from: string; to: string; field: string } | null;
                if (value?.from)
                    return (
                        <SetChip
                            key={c.name}
                            caption={value.from + (value.to && value.to !== value.from ? ' – ' + value.to : '')}
                            icon="Calendar"
                            removeLabel={fill(strings.remove, c.caption)}
                            onRemove={() => onChange(withSearchValue(withSearchValue(withSearchValue(query, 'date_from', null), 'date_to', null), 'date_field', null))}
                        />
                    );
                const starts = (c.fields ?? []).some((f) => f.value === 'starts');
                const presets = [
                    { id: 'w', title: strings.past_week, days: 7, ahead: false, field: '' },
                    { id: 'm', title: strings.past_month, days: 30, ahead: false, field: '' },
                    { id: 'y', title: strings.past_year, days: 365, ahead: false, field: '' },
                    ...(starts ? [
                        { id: 'sw', title: strings.starts_week, days: 7, ahead: true, field: 'starts' },
                        { id: 'sm', title: strings.starts_month, days: 30, ahead: true, field: 'starts' },
                    ] : []),
                ];
                return (
                    <DropdownMenu
                        key={c.name}
                        items={presets.map((p) => ({ id: p.id, title: p.title }))}
                        onSelect={(item) => {
                            const preset = presets.find((p) => p.id === item.id);
                            if (!preset) return;
                            const [from, to] = presetRange(preset.days, preset.ahead);
                            let next = withSearchValue(query, 'date_from', from);
                            next = withSearchValue(next, 'date_to', to);
                            next = withSearchValue(next, 'date_field', preset.field || null);
                            onChange(withSearchValue(next, 'timezone', timezone()));
                        }}
                        triggerAccessibilityLabel={c.caption}
                    >
                        <NeoButton label={c.caption} image="Calendar" controlSize="small" interactive />
                    </DropdownMenu>
                );
            }

            case 'options': {
                const values = ([] as string[]).concat((filters[c.name] as string | string[] | undefined) ?? []);
                const titles = (c.options ?? []).filter((o) => values.includes(o.value)).map((o) => o.title);
                return (
                    <Row key={c.name} className="items-center">
                        <DropdownMenu
                            items={(c.options ?? []).map((o) => ({ id: o.value, title: o.title, selected: values.includes(o.value) }))}
                            onSelect={(item) => {
                                const id = String(item.id);
                                const next = c.multiple ? (values.includes(id) ? values.filter((v) => v !== id) : [...values, id]) : (values.includes(id) ? [] : [id]);
                                onChange(withSearchFilter(query, c.name, next));
                            }}
                            triggerAccessibilityLabel={c.caption}
                        >
                            <NeoButton label={titles.length ? c.caption + ': ' + titles.join(', ') : c.caption} image="ListFilter" controlSize="small" selected={titles.length > 0} interactive />
                        </DropdownMenu>
                        {titles.length > 0 && (
                            <NeoButton image="X" controlSize="small" borderShape="circle" selected accessibilityLabel={fill(strings.remove, c.caption)} onPress={() => onChange(withSearchFilter(query, c.name, null))} classNames={{ root: '-ms-1' }} />
                        )}
                    </Row>
                );
            }
        }
        return null;
    };

    return (
        <View className="gap-2 px-3 pt-3">
            <Row className="flex-wrap items-center gap-2" role="group" aria-label={strings.filters}>
                {scope.chips.map(chip)}
                {scope.scope === 'global' && scope.groups.length > 1 && (
                    <DropdownMenu
                        items={scope.groups.map((g) => ({ id: g.name, title: fill(strings.in, g.title), icon: g.icon }))}
                        onSelect={(item) => onChange(withSearchValue(query, 'section', String(item.id)))}
                        triggerAccessibilityLabel={strings.filter}
                    >
                        <NeoButton label={strings.filter} image="Plus" controlSize="small" interactive />
                    </DropdownMenu>
                )}
            </Row>
            {findPerson && <PersonFinder strings={strings} onPick={(id) => { setFindPerson(false); onChange(withSearchValue(query, 'author', id)); }} />}
        </View>
    );
}

/** "Created by": people whose name starts as typed (UNA's author suggestions, as its search forms have). */
function PersonFinder({ strings, onPick }: { strings: Record<string, string>; onPick: (id: string) => void }) {
    const [term, setTerm] = useState('');
    const [people, setPeople] = useState<Array<{ value: string | number; label: string }>>([]);

    useEffect(() => {
        if (term.trim().length < 2) return;
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            try {
                const result = await fetcher('/searchExtended.php?api=1&action=get_authors&term=' + encodeURIComponent(term.trim()), false, { signal: controller.signal });
                if (!controller.signal.aborted) setPeople(Array.isArray(result) ? result.slice(0, 8) : []);
            } catch {
                if (!controller.signal.aborted) setPeople([]);
            }
        }, 300);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [term]);

    return (
        <View className="gap-2">
            <Input value={term} onChangeText={setTerm} placeholder={strings.person_placeholder} accessibilityLabel={strings.find_person} autoFocus />
            <Row className="flex-wrap gap-2">
                {term.trim().length >= 2 && people.map((p) => (
                    <NeoButton key={String(p.value)} label={String(p.label).replace(/<[^>]*>/g, '')} controlSize="small" onPress={() => onPick(String(p.value))} />
                ))}
            </Row>
        </View>
    );
}
