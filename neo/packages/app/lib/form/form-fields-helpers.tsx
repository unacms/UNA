import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { NeoButton } from 'app/design/controls';
import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';

/** Resolve per-language entries from UNA `translations` (+ `values` for content). */
export function getTranslatableEntries({
    name,
    translations,
    names,
    values,
    value,
}: { name: string; translations: any; names: any; values: any; value: any }) {
    const prefix = name ? `${name}-` : '';

    const langFromFieldName = (fieldName: string) =>
        prefix && fieldName.startsWith(prefix)
            ? fieldName.slice(prefix.length)
            : fieldName;

    const valueForLang = (lang: string) => {
        const v = values?.[lang];
        return v != null && v !== '' ? String(v) : '';
    };

    if (Array.isArray(translations) && translations.length) {
        return translations
            .filter((item) => item?.name)
            .map((item) => {
                const fieldName = item.name;
                const lang = langFromFieldName(fieldName);
                return {
                    fieldName,
                    lang,
                    title: item.title || String(lang).toUpperCase(),
                    defaultValue: valueForLang(lang),
                };
            });
    }

    // Legacy fallback: `names` array
    if (Array.isArray(names) && names.length) {
        return names.map((fieldName) => {
            const lang = langFromFieldName(fieldName);
            return {
                fieldName,
                lang,
                title: String(lang).toUpperCase(),
                defaultValue: valueForLang(lang),
            };
        });
    }

    // Last resort: keys present in values only
    if (values && typeof values === 'object') {
        return Object.keys(values).map((lang) => ({
            fieldName: name ? `${name}-${lang}` : lang,
            lang,
            title: String(lang).toUpperCase(),
            defaultValue: valueForLang(lang),
        }));
    }

    return [
        {
            fieldName: name,
            lang: '',
            title: '',
            defaultValue: value != null ? String(value) : '',
        },
    ];
}

export function getMaxLength(checker: any) {
    if (!checker?.params) return undefined;
    if (Array.isArray(checker.params)) return checker.params[1];
    return checker.params.max;
}

export function pickPrimaryFieldName(entries: any, language: string | null | undefined) {
    if (!entries.length) return null;
    const code = String(language || '')
        .split('-')[0]!
        .toLowerCase();
    if (code) {
        const match = entries.find(
            (e: any) => String(e.lang).toLowerCase() === code
        );
        if (match) return match.fieldName;
    }
    return entries[0].fieldName;
}

/**
 * Shared state for *-translatable form fields: language tabs, error focus,
 * and syncing per-lang values from UNA props into react-hook-form.
 */
export function useTranslatableField(props: any) {
    const { i18n } = useTranslation();
    const formContext = useFormContext();
    const entries = getTranslatableEntries(props);

    const initialFieldName = pickPrimaryFieldName(entries, i18n.language);
    const [activeFieldName, setActiveFieldName] = useState(initialFieldName);

    const errorFieldName = entries.find(
        (e) => formContext.formState.errors[e.fieldName]
    )?.fieldName;

    useEffect(() => {
        if (errorFieldName) setActiveFieldName(errorFieldName);
    }, [errorFieldName]);

    const valuesKey = JSON.stringify(props.values ?? null);
    const translationsKey = JSON.stringify(props.translations ?? null);

    useEffect(() => {
        entries.forEach(({ fieldName, defaultValue }) => {
            formContext.setValue(fieldName, defaultValue);
        });
        // Sync when server reloads values / language list.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.name, valuesKey, translationsKey]);

    const activeExists = entries.some((e) => e.fieldName === activeFieldName);
    const currentFieldName = activeExists
        ? activeFieldName
        : initialFieldName;

    return {
        formContext,
        entries,
        errorFieldName,
        currentFieldName,
        setActiveFieldName,
    };
}

/** Language switcher for *-translatable fields. Hidden when only one entry. */
export function TranslatableLangTabs({
    entries,
    currentFieldName,
    onSelect,
}: { entries: any; currentFieldName?: any; onSelect: (item: any) => void }) {
    if (entries.length < 2) return null;

    return (
        <Row className="flex-wrap gap-2">
            {entries.map((entry: any) => {
                const selected = entry.fieldName === currentFieldName;
                return (
                    <NeoButton
                        key={entry.fieldName}
                        label={entry.title}
                        controlSize="mini"
                        style={selected ? 'borderedProminent' : undefined}
                        selected={!!selected}
                        selectedState="default"
                        onPress={() => onSelect(entry.fieldName)}
                    />
                );
            })}
        </Row>
    );
}

/** Lang tabs + per-language field children. */
export function TranslatableFieldLayout({
    entries,
    currentFieldName,
    setActiveFieldName,
    children,
}: { entries: any; currentFieldName?: any; setActiveFieldName?: any; children?: ReactNode }) {
    return (
        <View className="gap-y-2 w-full">
            <TranslatableLangTabs
                entries={entries}
                currentFieldName={currentFieldName}
                onSelect={setActiveFieldName}
            />
            {children}
        </View>
    );
}

export function LocationSuggest({ searchError, selectionMade, locationResults, onSelect }: { searchError: any; selectionMade?: boolean; locationResults: any[]; onSelect: (item: any) => void }) {
    const { t } = useTranslation();
    return (
        <>
            {searchError ? <Text>{t('Error')}</Text> : null}
            {!selectionMade && locationResults.length > 0 ? (
                <View className="absolute z-50 w-full max-w-md top-14 rounded-xl border-border border bg-card backdrop-blur-xl p-1 gap-y-1">
                    {locationResults.slice(0, 5).map((item) => (
                        <NeoButton
                            key={item.place_id}
                            image="MapPin"
                            style="borderless"
                            width="fill"
                            align="start"
                            controlSize="small"
                            label={item.description}
                            onPress={() => onSelect(item.place_id)}
                        />
                    ))}
                </View>
            ) : null}
        </>
    );
}
