import Field, { getValidationRules } from './_field';
import { useController, useFormContext } from 'react-hook-form';
import { Input } from 'app/design/controls'
import { useEffect } from 'react';
import { lazy } from 'react';

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

    return (
        <Field {...props} error2={formContext.formState.errors[name]}>
            {name.includes("phone") || props.type == "phone" ? <PhoneInput
                autoFocus={props.auto_focus}
                name={name}
                readOnly={props?.attrs?.readonly == 'readonly'}
                placeholderTextColor="#6b7280"
                value={String(field.value)}
                ariaLabel={props.caption}
                field={field}
            /> : (props.type == "value" && !field.value ? null : <Input
                textContentType="none"

                /* experiment */
                
                autoComplete="off"
                autoCorrect={false}
                spellCheck={false}
                secureTextEntry={false}
                keyboardType="default"
                /* experiment */

                autoFocus={props.auto_focus}
                name={name}
                readOnly={props?.attrs?.readonly == 'readonly' || props.type == "value"}
                placeholder={placeholder}
                placeholderTextColor="#6b7280"
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                value={String(field.value)}
                aria-label={props.caption}
            />)
            }
        </Field>
    );
}
