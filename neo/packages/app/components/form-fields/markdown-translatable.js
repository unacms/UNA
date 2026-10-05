import Field, { getValidationRules } from './_field';
import { View } from 'app/design/view';
import { lazyComponent } from 'app/lib/lazy-component';

// Same heavy editor as the `markdown` field — code-split (see form-fields/_map.js).
const MarkdownTextInput = lazyComponent(
    () => import('./editor-markdown').then((m) => ({ default: m.MarkdownTextInput })),
    { name: 'MarkdownTextInput' }
);
import {
    useTranslatableField,
    TranslatableFieldLayout,
} from 'app/lib/form/form-fields-helpers';

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
    const {
        formContext,
        entries,
        errorFieldName,
        currentFieldName,
        setActiveFieldName,
    } = useTranslatableField(props);
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

    if (!entries.length) return null;

    return (
        <Field
            {...props}
            error2={
                errorFieldName
                    ? formContext.formState.errors[errorFieldName]
                    : formContext.formState.errors[props.name]
            }
        >
            <TranslatableFieldLayout
                entries={entries}
                currentFieldName={currentFieldName}
                setActiveFieldName={setActiveFieldName}
            >
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
            </TranslatableFieldLayout>
        </Field>
    );
}
