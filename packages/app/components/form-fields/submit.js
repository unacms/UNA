import Field, { FormError } from './_field';
import { useController, useFormContext } from 'react-hook-form';
import { Button, Hidden } from 'app/design/controls'
import { View } from 'app/design/view'
import { useWindowDimensions } from 'react-native'
import { appSetting } from 'app/lib/util'
import { Keyboard, Platform } from 'react-native';
export default function FormFieldSubmit(props) {
    const formContext = useFormContext();
    const { formState } = formContext;
    let rules = {};
    let name = props.name;
    let defaultValue = props.value;
    let { width } = useWindowDimensions();
    const { field } = useController({ name, rules, defaultValue });

    const formProps = appSetting('forms', props.form_name);

    const handlePress = () => {
        if (!props.disabled) {
            //Keyboard.dismiss();
            props.handleSubmit();
        }
    };

    return (
        <Field  {...props}>
            <Button
                title={!props.icon_only ? props.value : ''}
                variant={!!props.variant ? props.variant : 'primary'}
                {...(Platform.OS === 'web'
                    ? { onPress: handlePress }
                    : { onTouchStart: handlePress })}
                startDecorator={props.icon}
                size={!!props.size ? props.size : 'base'}
                disabled={props.disabled ? props.disabled : false}
                fullWidth={formProps?.button_full_width == true || width < 1024}

            />
            <Hidden
                name={props.name}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                defaultValue={defaultValue}
            />
            {
                (Object.keys(formContext.formState.errors).length > 0 && props.hide_errors !== true && formProps?.hide_errors !== true) &&
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