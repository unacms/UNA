import Field, { getValidationRules } from './_field';
import { useFormContext } from 'react-hook-form';
import { Button } from 'app/design/controls';
import { useEffect, useState } from 'react';
import { View, Row } from 'app/design/view';
import { useTranslation } from 'react-i18next';
import { MarkdownTextInput } from './editor-markdown';

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

function LangMarkdownInput({
    fieldName,
    defaultValue,
    rules,
    autoFocus,
    disabled,
    placeholder,
    initialHeight,
    maxHeight,
    showToolbar,
    bg,
    active,
}) {
    return (
        <View
            className={active ? 'w-full' : 'hidden'}
            aria-hidden={!active}
        >
            <MarkdownTextInput
                name={fieldName}
                value={defaultValue}
                placeholder={placeholder}
                autofocus={autoFocus}
                disabled={disabled}
                initialHeight={initialHeight}
                maxHeight={maxHeight}
                showToolbar={showToolbar}
                bg={bg}
                rules={rules}
            />
        </View>
    );
}

export default function FormFieldMarkdownTranslatable(props) {
    const { i18n } = useTranslation();
    const formContext = useFormContext();
    const entries = getTranslatableEntries(props);
    const rules = getValidationRules(props);
    const placeholder = props.use_caption_as_placeholder
        ? props.caption
        : props.placeholder;
    const disabled =
        props?.attrs?.readonly == 'readonly' ||
        props?.attrs?.disabled == 'disabled' ||
        !!props.disabled;
    const isCommentsForm = props.container_class === 'comments';
    const initialHeight = props.height || (isCommentsForm ? 48 : 120);

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
                {entries.length > 0 ? (
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
                    <LangMarkdownInput
                        key={entry.fieldName}
                        fieldName={entry.fieldName}
                        defaultValue={entry.defaultValue}
                        rules={rules}
                        autoFocus={
                            entry.fieldName === currentFieldName
                                ? props.auto_focus || props.autofocus
                                : false
                        }
                        disabled={disabled}
                        placeholder={placeholder}
                        initialHeight={initialHeight}
                        maxHeight={props.maxHeight || 400}
                        showToolbar={props.showToolbar !== false}
                        bg={props.bg}
                        active={entry.fieldName === currentFieldName}
                    />
                ))}
            </View>
        </Field>
    );
}
