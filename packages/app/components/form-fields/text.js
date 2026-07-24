import Field, { getValidationRules } from './_field';
import AdaptiveLabel from './adaptive-label';
import { useController, useFormContext } from 'react-hook-form';
import { Input } from 'app/design/controls'
import { useEffect } from 'react';
import { lazy } from 'react';
import { Text } from 'app/design/typography'

const PhoneInput = lazy(() => import('app/components/form-fields/phone'));

export default function FormFieldText(props) {
    const name = props.name;
    const defaultValue = props.value ? props.value : '';
    const rules = getValidationRules(props);
    const formContext = useFormContext();
    const { field } = useController({ name, rules, defaultValue });
    const placeholder = props.use_caption_as_placeholder ? props.caption : props.placeholder;

    useEffect(() => {
        if (props.value !== undefined)
            formContext.setValue(props.name, props.value)
    }, [props.name, props.value]);

    if (props.type == "value"){
        return  !field.value ? null : <Field {...props} caption={props.caption+': '+field.value} error2={formContext.formState.errors[name]}/>
    }

    const isPhone = name.includes("phone") || props.type == "phone";

    return (
        <Field {...props} error2={formContext.formState.errors[name]}>
            {isPhone ? <PhoneInput
                autoFocus={props.auto_focus}
                name={name}
                readOnly={props?.attrs?.readonly == 'readonly' || props?.attrs?.disabled == 'disabled'}
                placeholderTextColor="#6b7280"
                value={String(field.value)}
                ariaLabel={props.caption}
                field={field}
            /> : (
                <AdaptiveLabel
                    caption={props.caption}
                    value={field.value}
                    useCaptionAsPlaceholder={props.use_caption_as_placeholder}
                >
                    <Input
                        textContentType="none"
                        autoComplete="off"
                        autoCorrect={false}
                        spellCheck={false}
                        secureTextEntry={false}
                        keyboardType="default"
                        autoFocus={props.auto_focus}
                        name={name}
                        readOnly={props?.attrs?.readonly == 'readonly' || props?.attrs?.disabled == 'disabled' || props.type == "value"}
                        placeholder={placeholder}
                        placeholderTextColor="#6b7280"
                        onChangeText={field.onChange}
                        onBlur={field.onBlur}
                        value={String(field.value)}
                        aria-label={props.caption}
                        {...(props.checker?.params?.max ? { maxLength: props.checker.params.max } : {})}
                    />
                </AdaptiveLabel>
            )}
        </Field>
    );
}
