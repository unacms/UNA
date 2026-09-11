import Field, { getValidationRules } from './_field';
import { Input } from 'app/design/controls';
import { View } from 'app/design/view';
import { useFormField } from 'app/lib/form/use-form-field';
import {
    getMaxLength,
    useTranslatableField,
    TranslatableFieldLayout,
} from 'app/lib/form/form-fields-helpers';

function LangInput({
    fieldName,
    defaultValue,
    rules,
    autoFocus,
    maxLength,
    lang,
    active,
    caption,
    placeholder: placeholderProp,
    use_caption_as_placeholder,
    attrs,
    handleSubmit,
    type,
}) {
    const {
        field,
        placeholder,
        readOnly,
        placeholderTextColor,
        onFocus,
        onBlur,
        inputRef,
        returnKeyProps,
    } = useFormField(
        {
            name: fieldName,
            value: defaultValue,
            caption,
            placeholder: placeholderProp,
            use_caption_as_placeholder,
            attrs,
            handleSubmit,
            type,
        },
        {
            defaultValue: defaultValue ?? '',
            rules,
            syncValue: false,
            returnKey: !!active,
        }
    );

    return (
        <View
            className={active ? 'w-full' : 'hidden'}
            aria-hidden={!active}
        >
            <Input
                ref={inputRef}
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
                placeholderTextColor={placeholderTextColor}
                onChangeText={field.onChange}
                onFocus={onFocus}
                onBlur={onBlur}
                value={String(field.value ?? '')}
                aria-label={lang ? `${caption} (${lang})` : caption}
                {...(maxLength ? { maxLength } : {})}
                {...returnKeyProps}
            />
        </View>
    );
}

export default function FormFieldTextTranslatable(props) {
    const { entries, currentFieldName, setActiveFieldName } =
        useTranslatableField(props);
    const rules = getValidationRules(props);
    const maxLength = getMaxLength(props.checker);

    if (!entries.length) return null;

    return (
        <Field {...props}>
            <TranslatableFieldLayout
                entries={entries}
                currentFieldName={currentFieldName}
                setActiveFieldName={setActiveFieldName}
            >
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
                        maxLength={maxLength}
                        active={entry.fieldName === currentFieldName}
                        caption={props.caption}
                        placeholder={props.placeholder}
                        use_caption_as_placeholder={
                            props.use_caption_as_placeholder
                        }
                        attrs={props.attrs}
                        handleSubmit={props.handleSubmit}
                        type={props.type}
                    />
                ))}
            </TranslatableFieldLayout>
        </Field>
    );
}
