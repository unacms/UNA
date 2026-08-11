import Field, { getValidationRules } from './_field';
import { useController, useFormContext } from 'react-hook-form';
import { Input, Button } from 'app/design/controls';
import { useEffect, useState } from 'react';
import { View, Row } from 'app/design/view';
import { useTranslation } from 'react-i18next';

/** Resolve per-language entries from UNA `translations` (+ `values` for content). */
function getTranslatableEntries({ name, translations, names, values, value }) {
    const prefix = name ? `${name}-` : '';

    const langFromFieldName = (fieldName) =>
        prefix && fieldName.startsWith(prefix)
            ? fieldName.slice(prefix.length)
            : fieldName;

    const valueForLang = (lang) => {
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

function getMaxLength(checker) {
    if (!checker?.params) return undefined;
    if (Array.isArray(checker.params)) return checker.params[1];
    return checker.params.max;
}

function pickPrimaryFieldName(entries, language) {
    if (!entries.length) return null;
    const code = String(language || '')
        .split('-')[0]
        .toLowerCase();
    if (code) {
        const match = entries.find(
            (e) => String(e.lang).toLowerCase() === code
        );
        if (match) return match.fieldName;
    }
    return entries[0].fieldName;
}

function LangInput({
    fieldName,
    defaultValue,
    rules,
    autoFocus,
    readOnly,
    placeholder,
    caption,
    maxLength,
    lang,
    active,
}) {
    const { field } = useController({
        name: fieldName,
        rules,
        defaultValue: defaultValue ?? '',
    });

    return (
        <View
            className={active ? 'w-full' : 'hidden'}
            aria-hidden={!active}
        >
            <Input
                textContentType="none"
                autoComplete="off"
                autoCorrect={false}
                spellCheck={false}
                secureTextEntry={false}
                keyboardType="default"
                autoFocus={autoFocus}
                name={fieldName}
                readOnly={readOnly}
                placeholder={placeholder}
                placeholderTextColor="#6b7280"
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                value={String(field.value ?? '')}
                aria-label={lang ? `${caption} (${lang})` : caption}
                {...(maxLength ? { maxLength } : {})}
            />
        </View>
    );
}

export default function FormFieldTextTranslatable(props) {
    const { i18n } = useTranslation();
    const formContext = useFormContext();
    const entries = getTranslatableEntries(props);
    const rules = getValidationRules(props);
    const placeholder = props.use_caption_as_placeholder
        ? props.caption
        : props.placeholder;
    const readOnly =
        props?.attrs?.readonly == 'readonly' ||
        props?.attrs?.disabled == 'disabled';
    const maxLength = getMaxLength(props.checker);

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

    if (!entries.length) return null;

    const activeExists = entries.some((e) => e.fieldName === activeFieldName);
    const currentFieldName = activeExists
        ? activeFieldName
        : initialFieldName;

    return (
        <Field
            {...props}
            error2={
                errorFieldName
                    ? formContext.formState.errors[errorFieldName]
                    : formContext.formState.errors[props.name]
            }
        >
            <View className="gap-y-2 w-full">
                {entries.length > 1 ? (
                    <Row className="flex-wrap gap-1.5">
                        {entries.map((entry) => {
                            const selected =
                                entry.fieldName === currentFieldName;
                            return (
                                <Button
                                    key={entry.fieldName}
                                    title={entry.title}
                                    size="xs"
                                    variant={selected ? 'primary' : 'default'}
                                    onPress={() =>
                                        setActiveFieldName(entry.fieldName)
                                    }
                                />
                            );
                        })}
                    </Row>
                ) : null}

                {entries.map((entry) => (
                    <LangInput
                        key={entry.fieldName}
                        fieldName={entry.fieldName}
                        lang={entry.title || entry.lang}
                        defaultValue={entry.defaultValue}
                        rules={rules}
                        autoFocus={
                            entry.fieldName === currentFieldName
                                ? props.auto_focus
                                : false
                        }
                        readOnly={readOnly}
                        placeholder={placeholder}
                        caption={props.caption}
                        maxLength={maxLength}
                        active={entry.fieldName === currentFieldName}
                    />
                ))}
            </View>
        </Field>
    );
}
