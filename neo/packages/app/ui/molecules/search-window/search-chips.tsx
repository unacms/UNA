import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { View, Row, Pressable } from 'app/design/view';
import { Text } from 'app/design/typography';
import { NeoButton, NeoButtonGroup, Input } from 'app/design/controls';
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { fetcher } from 'app/lib/fetcher';
import { cn } from 'app/lib/util';
import { useCurrentUser } from 'app/context/user';
import {
    applyFilterChoice,
    fillString as fill,
    filterMenuItems,
    isChipSet,
    optionValues,
    withSearchFilter,
    withSearchValue,
    withoutChip,
    type SearchQuery,
} from 'app/lib/search-window';
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

/**
 * The window's filter chips under its field, from UNA's scope descriptor. Only what is set shows as a chip, a button
 * group with its remove button: the scope ("In: …", chosen by where the window was opened), and the filters the member
 * picked. "+ Filter" holds the others (lib/search-window.ts `filterMenuItems`): Title only, Created by, Date, in a
 * module's scope its own search fields, and in global search the modules to look in. "Created by: Find someone…" puts
 * a small name field in the row, where its chip will be.
 */
export default function SearchChips({ query, scope, strings, onChange, trailing, inset = 'px-3' }: ChipsProps) {
    const { currentUser } = useCurrentUser();
    const [findPerson, setFindPerson] = useState(false);
    const rowRef = useRef<any>(null);

    // after a chip is removed or the name field closes, the keyboard goes on from "+ Filter" (web)
    const focusFilter = () => {
        if (Platform.OS !== 'web') return;
        setTimeout(() => {
            const buttons = Array.from(rowRef.current?.querySelectorAll?.('[aria-haspopup]') ?? []) as HTMLElement[];
            buttons.find((el) => (el.textContent ?? '').trim() === strings.filter)?.focus();
        }, 50);
    };

    const change = (next: SearchQuery) => onChange(next);
    const remove = (c: SearchChip) => () => {
        change(withoutChip(query, c));
        focusFilter();
    };

    const chip = (c: SearchChip) => {
        switch (c.type) {
            case 'scope':
                return <SetChip key={c.name + String(c.value)} caption={c.caption} icon={c.name === 'context' ? 'UsersRound' : (c.icon || 'Search')} removeLabel={fill(strings.remove, c.caption)} onRemove={remove(c)} />;

            case 'toggle':
                return <SetChip key={c.name} caption={c.caption} icon="Type" removeLabel={fill(strings.remove, c.caption)} onRemove={remove(c)} />;

            case 'profile':
                return <SetChip key={c.name} caption={fill(strings.created_by_value, c.value_title ?? '')} icon="UserRound" removeLabel={fill(strings.remove, c.caption)} onRemove={remove(c)} />;

            case 'date_range': {
                const value = c.value as { from: string; to: string };
                return <SetChip key={c.name} caption={value.from + (value.to && value.to !== value.from ? ' – ' + value.to : '')} icon="Calendar" removeLabel={fill(strings.remove, c.caption)} onRemove={remove(c)} />;
            }

            case 'options': {
                const values = optionValues(c, query);
                const titles = (c.options ?? []).filter((o) => values.includes(o.value)).map((o) => o.title);
                return (
                    <NeoButtonGroup key={c.name} controlSize="small" accessibilityLabel={c.caption}>
                        <DropdownMenu
                            items={(c.options ?? []).map((o) => ({ id: o.value, title: o.title, selected: values.includes(o.value) }))}
                            onSelect={(item) => {
                                const id = String(item.id);
                                const next = c.multiple ? (values.includes(id) ? values.filter((v) => v !== id) : [...values, id]) : (values.includes(id) ? [] : [id]);
                                change(withSearchValue(withSearchFilter(query, c.name, next), 'tab', null));
                            }}
                            triggerAccessibilityLabel={c.caption}
                        >
                            <NeoButton label={c.caption + ': ' + titles.join(', ')} image="ListFilter" selected interactive />
                        </DropdownMenu>
                        <NeoButton image="X" selected accessibilityLabel={fill(strings.remove, c.caption)} onPress={remove(c)} />
                    </NeoButtonGroup>
                );
            }
        }
        return null;
    };

    const menu = filterMenuItems(scope.chips, query, strings, {
        global: scope.scope === 'global',
        groups: scope.groups,
        signedIn: !!currentUser,
    });

    const onFilter = (id: string) => {
        const result = applyFilterChoice(query, id, scope.chips, {
            viewerId: currentUser ? currentUser.id : null,
            timezone: timezone(),
            strings,
        });
        if (result.find) setFindPerson(true);
        else change(result.query);
    };

    return (
        // above the results: the name field's suggestions open over them
        <View className={'relative z-10 pt-3 ' + inset}>
            <Row ref={rowRef} className="flex-wrap items-center gap-2" role="group" aria-label={strings.filters}>
                {scope.chips.filter((c) => isChipSet(c, query)).map(chip)}
                {findPerson && (
                    <PersonPicker
                        strings={strings}
                        onPick={(id) => { setFindPerson(false); change(withSearchValue(withSearchValue(query, 'author', id), 'tab', null)); focusFilter(); }}
                        onCancel={() => { setFindPerson(false); focusFilter(); }}
                    />
                )}
                {menu.length > 0 && !findPerson && (
                    <DropdownMenu items={menu} onSelect={(item) => onFilter(String(item.id))} triggerAccessibilityLabel={strings.filter}>
                        <NeoButton label={strings.filter} image="ListFilterPlus" controlSize="small" interactive />
                    </DropdownMenu>
                )}
                {!!trailing && <View className="ms-auto">{trailing}</View>}
            </Row>
        </View>
    );
}

/** UNA's author suggestions: `id` and `display_name` in the apps' format (`api=1`), `value` and `label` on the site. */
type Person = { id?: string | number; value?: string | number; display_name?: string; label?: string };

const personId = (p: Person) => String(p.id ?? p.value ?? '');

/**
 * "Created by": a small name field (36px, as the chips) with people whose name starts as typed under it (UNA's author
 * suggestions, as its search forms have). A combobox: the arrows move through the names, Enter takes one, Escape or
 * leaving the field closes it without a filter.
 */
function PersonPicker({ strings, onPick, onCancel }: { strings: Record<string, string>; onPick: (id: string) => void; onCancel: () => void }) {
    const [term, setTerm] = useState('');
    const [people, setPeople] = useState<Person[]>([]);
    const [active, setActive] = useState(0);
    const inputRef = useRef<any>(null);
    const picking = useRef(false);
    const listId = useId();

    // the menu that opened it gives focus back to its trigger as it closes: take it after that
    useEffect(() => {
        const timer = setTimeout(() => inputRef.current?.focus?.(), 120);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (term.trim().length < 2) return;
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            try {
                const result = await fetcher('/searchExtended.php?api=1&action=get_authors&term=' + encodeURIComponent(term.trim()), false, { signal: controller.signal });
                if (controller.signal.aborted) return;
                setPeople(Array.isArray(result) ? (result as Person[]).filter((p) => personId(p) !== '').slice(0, 8) : []);
                setActive(0);
            } catch {
                if (!controller.signal.aborted) setPeople([]);
            }
        }, 250);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [term]);

    const shown = term.trim().length >= 2 ? people : [];
    const name = (p: Person) => String(p.display_name ?? p.label ?? '').replace(/<[^>]*>/g, '');
    const pick = (p: Person | undefined) => { if (p && personId(p)) onPick(personId(p)); };

    const onKey = (e: any) => {
        const key = e?.nativeEvent?.key ?? e?.key;
        if (key === 'ArrowDown' || key === 'ArrowUp') {
            e.preventDefault?.();
            if (shown.length) setActive((a) => (a + (key === 'ArrowDown' ? 1 : shown.length - 1)) % shown.length);
        }
        else if (key === 'Enter') {
            e.preventDefault?.();
            pick(shown[active]);
        }
        else if (key === 'Escape') {
            // closes the field, not the window: the modal also closes on Escape's keyup (React Native Web), which
            // comes after this field is gone, so that one keyup is stopped before it reaches the modal
            e.preventDefault?.();
            e.stopPropagation?.();
            if (Platform.OS === 'web' && typeof document !== 'undefined') {
                const swallow = (event: KeyboardEvent) => {
                    if (event.key !== 'Escape') return;
                    event.stopPropagation();
                    document.removeEventListener('keyup', swallow, true);
                };
                document.addEventListener('keyup', swallow, true);
            }
            onCancel();
        }
    };

    return (
        <View className="relative z-10">
            <Input
                ref={inputRef}
                size="small"
                className="w-56"
                value={term}
                onChangeText={setTerm}
                placeholder={strings.person_placeholder}
                accessibilityLabel={strings.find_person}
                role="combobox"
                aria-expanded={shown.length > 0}
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={shown.length ? listId + '-' + active : undefined}
                onKeyPress={onKey}
                {...({ onKeyDown: onKey } as Record<string, unknown>)}
                // leaving the field closes it, unless a name is being pressed
                onBlur={() => setTimeout(() => { if (!picking.current) onCancel(); }, 150)}
                autoCorrect={false}
                autoCapitalize="words"
            />
            {shown.length > 0 && (
                <View
                    nativeID={listId}
                    role="listbox"
                    aria-label={strings.find_person}
                    className="absolute start-0 top-full mt-1 w-64 gap-0.5 rounded-2xl bg-popover p-1 shadow-popover dark:shadow-popover-deep"
                >
                    {shown.map((p, i) => (
                        <Pressable
                            key={personId(p)}
                            nativeID={listId + '-' + i}
                            role="option"
                            aria-selected={i === active}
                            onPressIn={() => { picking.current = true; }}
                            onPress={() => pick(p)}
                            className={cn('h-9 justify-center rounded-xl px-3 web:hover:bg-button-hover', i === active && 'bg-button-hover')}
                        >
                            <Text className="text-sm font-medium text-foreground" numberOfLines={1}>{name(p)}</Text>
                        </Pressable>
                    ))}
                </View>
            )}
        </View>
    );
}
