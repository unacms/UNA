import { useCallback, useState } from 'react';
import Field, { FormError } from './_field';
import { useController, useFormContext } from 'react-hook-form';
import { Button, Hidden } from 'app/design/controls';
import { View, Row } from 'app/design/view';
import { Platform } from 'react-native';
import { appSetting, cn } from 'app/lib/util';
import { useIsDesktop } from 'app/context/measure';
import emitter from 'app/context/emitter';
import { useEffect } from 'react';
import Loading from 'app/ui/atoms/loading';

export default function FormFieldSubmit(props) {
    // Destructure props with default values
    const {
        name,
        value,
        form_name,
        handleSubmit,
        disabled = false,
        icon_only = false,
        variant = 'primary',
        rounded = false,
        icon,
        size = 'lg',
        notFullWidth = false,
        saveOnChanges = false,
        hide_errors = true,
    } = props;

    const formContext = useFormContext();
    const { formState } = formContext;
    const isDesktop = useIsDesktop();
    const [isSumbitting, setIsSumbitting] = useState(false);
    // Initialize controller for form field
    const { field } = useController({ name, rules: {}, defaultValue: value });

    // Get form-specific settings
    const formProps = appSetting('forms', form_name) || {};

    // Memoize handlers to prevent unnecessary re-renders
    const handlePress = useCallback(async () => {
        if (formState.isSubmitting || disabled) return;
        handleSubmit();
    }, [disabled, handleSubmit, formState.isSubmitting]);

    const handleReset = useCallback(() => {
        const values = formContext.getValues();
        Object.keys(values).forEach((key) => {
            if (key !== 'key') {
                formContext.setValue(key, '');
            }
        });
        handleSubmit();
    }, [formContext, handleSubmit]);

    // Prepare error display
    const errors = formState.errors;
    const errorKeys = Object.keys(errors);
    const showErrors =
        errorKeys.length > 0 && !hide_errors && !formProps.hide_errors;

    //let fb = formProps.button_full_width || props.button_full_width || !isDesktop
    const fullWidth = !notFullWidth;// ? false : (formProps.button_full_width || props.button_full_width);
    useEffect(() => {
        const subscription = emitter.addListener(`form_${form_name}`, (data) => {
            if (data.action == 'submited') {
                setIsSumbitting(true);
            }
            if (data.action == 'received') {
                setTimeout(() => {
					 setIsSumbitting(false);
				}, 1000);
               
            }
        })

        return () => {
            subscription.remove()
        }
    }, [])

   /* if (notFullWidth) {
        fb = false;
    }*/
    // Prepare button properties
    const buttonProps = {
        variant,
        rounded,
        size,
        fullWidth: fullWidth
    };

    const buttonHandlers = Platform.select({
        web: { onPress: handlePress },
        default: { onTouchStart: handlePress },
    });

    const resetHandlers = Platform.select({
        web: { onPress: handleReset },
        default: { onTouchStart: handleReset },
    });

    // Prepare row className
    const rowClassName = cn(
        formProps.button_hide_on_small || props.button_hide_on_small ? 'hidden sm:flex' : '',
        'gap-x-2',
        '',
        'items-center',
    );

    const serverErrorKeys = errorKeys.filter(
        key => errors[key]?.type === 'server'
    );


    return (
        <Field {...props}>
            <Row className={rowClassName}>
                <View className="w-full @sm/block:w-auto">
                    <Button
                    title={!icon_only ? value : ''}
                    startDecorator={isSumbitting ? <Loading size="small" color="#fff"/> : icon}
                    {...buttonProps}
                    {...buttonHandlers}
                    disabled={isSumbitting || disabled}
                />
                </View>
                {saveOnChanges && (
                    <Button
                        {...buttonProps}
                        {...resetHandlers}
                        variant="default"
                        title="Reset"
                    />
                )}
                
            </Row>
            <Hidden
                name={name}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                defaultValue={value}
            />
            {/*serverErrorKeys.length > 0 && (
                <View className="mt-2">
                    <FormError errorText="Incorrect info. Please, check your inputs and try again" />
                </View>
            )*/}
            {showErrors && (
                <View className="mt-2">
                    <FormError errorText="Errors:" />
                    <View className="ml-4">
                        {errorKeys.map((fieldName) => (
                            <FormError
                                key={fieldName}
                                errorText={errors[fieldName].message}
                            />
                        ))}
                    </View>
                </View>
            )}
        </Field>
    );
}