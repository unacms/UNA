import Field, { FormError } from './_field';
import { useController, useFormContext } from 'react-hook-form';
import { Button, Hidden } from 'app/design/controls'
import { View } from 'app/design/view'
export default function FormFieldSubmit(props) {
    const formContext = useFormContext();
    const { formState } = formContext;
    let rules = {};
    let name = props.name;
    let defaultValue = props.value;

    const { field } = useController({ name, rules, defaultValue });
    return (
        <Field  {...props}>
            <Button
                title={!props.icon_only ? props.value : ''}
                variant={!!props.variant ? props.variant : 'primary'}
                onPress={props.handleSubmit}
                startDecorator={props.icon}
                size={!!props.size ? props.size : 'base'}
                disabled={props.disabled ? props.disabled : false}
                fullWidth={props.form_name == 'sys_account_create' || props.form_name == 'sys_login'}

            />
            <Hidden
                name={props.name}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                defaultValue={defaultValue}
            />
            {
                Object.keys(formContext.formState.errors).length > 0 &&
                <View className="mt-2"><FormError errorText={"Errors:"} /><View className="ml-4">
                    {
                        Object.keys(formContext.formState.errors).map((fieldName, index) => {
                            const error = formContext.formState.errors[fieldName];
                            return <FormError key={index} errorText={error.message} />
                        })
                    }</View></View>
            }
        </Field>

    );
}