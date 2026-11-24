import { useEffect, useState, type ReactNode } from 'react';
import { View, Row } from 'app/design/view';
import { NeoButton, NeoButtonGroup, Input } from 'app/design/controls';
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
    /** At the row's end (the sort), the row wrapping on phones. */
    trailing?: ReactNode;
    /** The window's side padding (none inside a block). */
    inset?: string;
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

/** A chip with a value: one button group in the accent look, its value and a remove button. */
function SetChip({ caption, icon, removeLabel, onRemove }: { caption: string; icon?: string; removeLabel: string; onRemove: () => void }) {
    return (
        <NeoButtonGroup controlSize="small" accessibilityLabel={caption}>
            <NeoButton label={caption} image={icon} selected interactive={false} />
            <NeoButton image="X" selected accessibilityLabel={removeLabel} onPress={onRemove} />
        </NeoButtonGroup>
    );
}

type DatePreset = { id: string; title: string; days: number; ahead: boolean; field: string };

/** Date presets: the past week, month and year, and for a module with start dates the coming week and month. */
function datePresets(c: SearchChip, strings: Record<string, string>): DatePreset[] {
    const starts = (c.fields ?? []).some((f) => f.value === 'starts');
    return [
        { id: 'w', title: strings.past_week ?? '', days: 7, ahead: false, field: '' },
        { id: 'm', title: strings.past_month ?? '', days: 30, ahead: false, field: '' },
        { id: 'y', title: strings.past_year ?? '', days: 365, ahead: false, field: '' },
        ...(starts ? [
            { id: 'sw', title: strings.starts_week ?? '', days: 7, ahead: true, field: 'starts' },
            { id: 'sm', title: strings.starts_month ?? '', days: 30, ahead: true, field: 'starts' },
        ] : []),
    ];
}

type FilterMenuItem = { id: string; title: string; icon?: string; type?: string };

/**
 * The window's filter chips under its field, from UNA's scope descriptor. Only what is set shows as a chip, a button
 * group with its remove button: the scope ("In: …", chosen by where the window was opened), and the filters the member
 * picked. "+ Filter" holds the others: Title only, Created by, Date, in a module's scope its own search fields
 * (category, gender...), and in global search the modules to look in.
 */
export default function SearchChips({ query, scope, strings, onChange, trailing, inset = 'px-3' }: ChipsProps) {
    const { currentUser } = useCurrentUser();
    const [findPerson, setFindPerson] = useState(false);
    const filters = searchFilters(query);

    const optionValues = (c: SearchChip) => ([] as string[]).concat((filters[c.name] as string | string[] | undefined) ?? []);
    const isSet = (c: SearchChip) => {
        if (c.type === 'scope') return true;
        if (c.type === 'options') return optionValues(c).length > 0;
        if (c.type === 'date_range') return !!(c.value as { from?: string } | null)?.from;
        return !!c.value;
    };

    const setDate = (preset: DatePreset) => {
        const [from, to] = presetRange(preset.days, preset.ahead);
        let next = withSearchValue(query, 'date_from', from);
        next = withSearchValue(next, 'date_to', to);
        next = withSearchValue(next, 'date_field', preset.field || null);
        onChange(withSearchValue(next, 'timezone', timezone()));
    };

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
                return <SetChip key={c.name} caption={c.caption} icon="Type" removeLabel={fill(strings.remove, c.caption)} onRemove={remove(c.name as keyof SearchQuery)} />;

            case 'profile':
                return <SetChip key={c.name} caption={fill(strings.created_by_value, c.value_title ?? '')} icon="UserRound" removeLabel={fill(strings.remove, c.caption)} onRemove={remove('author')} />;

            case 'date_range': {
                const value = c.value as { from: string; to: string; field: string };
                return (
                    <SetChip
                        key={c.name}
                        caption={value.from + (value.to && value.to !== value.from ? ' – ' + value.to : '')}
                        icon="Calendar"
                        removeLabel={fill(strings.remove, c.caption)}
                        onRemove={() => onChange(withSearchValue(withSearchValue(withSearchValue(query, 'date_from', null), 'date_to', null), 'date_field', null))}
                    />
                );
            }

            case 'options': {
                const values = optionValues(c);
                const titles = (c.options ?? []).filter((o) => values.includes(o.value)).map((o) => o.title);
                return (
                    <NeoButtonGroup key={c.name} controlSize="small" accessibilityLabel={c.caption}>
                        <DropdownMenu
                            items={(c.options ?? []).map((o) => ({ id: o.value, title: o.title, selected: values.includes(o.value) }))}
                            onSelect={(item) => {
                                const id = String(item.id);
                                const next = c.multiple ? (values.includes(id) ? values.filter((v) => v !== id) : [...values, id]) : (values.includes(id) ? [] : [id]);
                                onChange(withSearchFilter(query, c.name, next));
                            }}
                            triggerAccessibilityLabel={c.caption}
                        >
                            <NeoButton label={c.caption + ': ' + titles.join(', ')} image="ListFilter" selected interactive />
                        </DropdownMenu>
                        <NeoButton image="X" selected accessibilityLabel={fill(strings.remove, c.caption)} onPress={() => onChange(withSearchFilter(query, c.name, null))} />
                    </NeoButtonGroup>
                );
            }
        }
        return null;
    };

    // "+ Filter": the filters not set, each under its name, then the modules to look in
    const menu: FilterMenuItem[] = [];
    // one list (no column of sections), each filter's rows after a separator and naming their filter
    const separate = () => { if (menu.length) menu.push({ id: 'sep' + menu.length, title: '', type: 'separator' }); };
    for (const c of scope.chips) {
        if (isSet(c)) continue;
        switch (c.type) {
            case 'toggle':
                menu.push({ id: 't:' + c.name, title: c.caption, icon: 'Type' });
                break;
            case 'profile':
                separate();
                if (currentUser) menu.push({ id: 'p:me', title: fill(strings.created_by_value, strings.me ?? ''), icon: 'UserRound' });
                menu.push({ id: 'p:find', title: fill(strings.created_by_value, strings.find_person ?? ''), icon: 'UserRoundSearch' });
                break;
            case 'date_range':
                separate();
                for (const preset of datePresets(c, strings)) menu.push({ id: 'd:' + preset.id, title: preset.title, icon: 'Calendar' });
                break;
            case 'options':
                separate();
                for (const o of c.options ?? []) menu.push({ id: 'o:' + c.name + ':' + o.value, title: c.caption + ': ' + o.title, icon: 'ListFilter' });
                break;
        }
    }
    if (scope.scope === 'global' && scope.groups.length > 1) {
        separate();
        for (const g of scope.groups) menu.push({ id: 's:' + g.name, title: fill(strings.in, g.title), icon: g.icon });
    }

    const onFilter = (id: string) => {
        const [kind, name = '', ...rest] = id.split(':');
        const value = rest.join(':');
        if (kind === 't') onChange(withSearchValue(query, name as keyof SearchQuery, '1'));
        else if (kind === 'p' && name === 'me') onChange(withSearchValue(query, 'author', String(currentUser ? currentUser.id : '')));
        else if (kind === 'p') setFindPerson(true);
        else if (kind === 'd') {
            const c = scope.chips.find((x) => x.type === 'date_range');
            const preset = c ? datePresets(c, strings).find((p) => p.id === name) : undefined;
            if (preset) setDate(preset);
        }
        else if (kind === 'o') onChange(withSearchFilter(query, name, [value]));
        else if (kind === 's') onChange(withSearchValue(query, 'section', name));
    };

    return (
        <View className={'gap-2 pt-3 ' + inset}>
            <Row className="flex-wrap items-center gap-2" role="group" aria-label={strings.filters}>
                {scope.chips.filter(isSet).map(chip)}
                {menu.length > 0 && (
                    <DropdownMenu
                        items={menu}
                        onSelect={(item) => onFilter(String(item.id))}
                        triggerAccessibilityLabel={strings.filter}
                    >
                        <NeoButton label={strings.filter} image="Plus" controlSize="small" interactive />
                    </DropdownMenu>
                )}
                {!!trailing && <View className="ms-auto">{trailing}</View>}
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
