import Field, { FormError } from './_field';
import { useController, useFormContext } from 'react-hook-form';
import { Button, Hidden } from 'app/design/controls'
import { View, Row } from 'app/design/view'
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


    const handleReset = () => {
        console.log(formContext.formState.isDirty ,formContext.getValues());
        const keys = Object.keys(formContext.getValues());
        keys.forEach((sKey) => {
            if (name !='key')
                formContext.setValue(sKey, '');
        });
        props.handleSubmit();
    };

    return (
        <Field  {...props}>
            <Row className={(formProps?.button_hide_on_small ? 'hidden sm:flex' : '' ) + ' gap-x-2'}>
            <Button
                title={!props.icon_only ? props.value : ''}
                variant={!!props.variant ? props.variant : 'primary'}
                rounded={!!props.variant ? props.rounded : false}
                {...(Platform.OS === 'web'
                    ? { onPress: handlePress }
                    : { onTouchStart: handlePress })}
                startDecorator={props.icon}
                size={!!props.size ? props.size : 'base'}
                disabled={props.disabled ? props.disabled : false}
                fullWidth={formProps?.button_full_width == true || width < 1024}

            />
            {props.saveOnChanges && <Button
                 variant="default"
                 title ="Reset"
                 {...(Platform.OS === 'web'
                    ? { onPress: handleReset }
                    : { onTouchStart: handlePress })}
                 />
            }
            </Row>
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