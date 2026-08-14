import Field from './_field';
import { Input } from 'app/design/controls'
import { useFormField } from 'app/lib/hooks/use-form-field';

export default function FormFieldText(props) {
    
    const {
        name,
        field,
        placeholder,
        readOnly,
        placeholderTextColor,
        focused,
        onFocus,
        onBlur,
        inputRef,
        returnKeyProps,
        isAdaptiveLabel,
    } = useFormField(props);

    if (props.type == 'value') {
        if (!field.value) return null;
        return <Field {...props} caption={`${props.caption}: ${field.value}`} />;
    }

    return (
        <Field {...props} value={field.value} focused={focused} isAdaptiveLabel={isAdaptiveLabel}>
            <Input
                ref={inputRef}
                textContentType="none"
                autoComplete="off"
                autoCorrect={false}
                spellCheck={false}
                secureTextEntry={false}
                keyboardType="default"
                autoFocus={props.auto_focus}
                name={name}
                readOnly={readOnly || props.type == "value"}
                placeholder={placeholder}
                placeholderTextColor={placeholderTextColor}
                onChangeText={field.onChange}
                onFocus={onFocus}
                onBlur={onBlur}
                value={String(field.value)}
                aria-label={props.caption}
                {...(props.checker?.params?.max ? { maxLength: props.checker.params.max } : {})}
                {...returnKeyProps}
            />
        </Field>
    );
}
