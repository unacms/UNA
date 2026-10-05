import Field from './_field';
import { Input } from 'app/design/controls'
import { useFormField } from 'app/lib/form/use-form-field';

function getTextFieldInputMode(props) {
    const caption = String(props.caption || '');
    const name = String(props.name || '');
    const attrType = String(props.attrs?.type || props.type || '');
    const looksEmail =
        attrType === 'email' ||
        /e-?mail/i.test(caption) ||
        /e-?mail/i.test(name);
    const looksUsername =
        name === 'ID' ||
        name === 'login' ||
        name === 'username' ||
        /user\s*name/i.test(caption);

    if (looksEmail || looksUsername) {
        const useEmail = looksEmail && !looksUsername;
        return {
            keyboardType: 'email-address',
            autoComplete: useEmail ? 'email' : 'username',
            textContentType: useEmail ? 'emailAddress' : 'username',
        };
    }

    return {
        keyboardType: 'default',
        autoComplete: props.attrs?.autocomplete || 'off',
        textContentType: 'none',
    };
}

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
        inputId,
        errorId,
        invalid,
    } = useFormField(props);
    const inputMode = getTextFieldInputMode(props);

    return (
        <Field {...props} value={field.value} focused={focused} isAdaptiveLabel={isAdaptiveLabel}>
            <Input
                ref={inputRef}
                id={inputId}
                nativeID={inputId}
                textContentType={inputMode.textContentType}
                autoComplete={inputMode.autoComplete}
                autoCorrect={false}
                spellCheck={false}
                secureTextEntry={false}
                keyboardType={inputMode.keyboardType}
                autoFocus={props.auto_focus}
                name={name}
                readOnly={readOnly}
                placeholder={placeholder}
                placeholderTextColor={placeholderTextColor}
                onChangeText={field.onChange}
                onFocus={onFocus}
                onBlur={onBlur}
                value={String(field.value)}
                aria-label={props.caption}
                aria-invalid={invalid || undefined}
                aria-describedby={errorId}
                {...(props.checker?.params?.max ? { maxLength: props.checker.params.max } : {})}
                {...returnKeyProps}
            />
        </Field>
    );
}
