import React, { useCallback, useRef } from 'react';
import Field, { FormError } from './_field';
import { useController, useFormContext } from 'react-hook-form';
import { Button, Hidden } from 'app/design/controls';
import { View, Row } from 'app/design/view';
import { useWindowDimensions, Keyboard, Platform } from 'react-native';
import { appSetting, LAYOUT_BREAKPOINTS } from 'app/lib/util';

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
        saveOnChanges = false,
        hide_errors = false,
        ...restProps
    } = props;

    const formContext = useFormContext();
    const { formState } = formContext;
    const { width } = useWindowDimensions();


    // Initialize controller for form field
    const { field } = useController({ name, rules: {}, defaultValue: value });

    // Get form-specific settings
    const formProps = appSetting('forms', form_name) || {};

    // Memoize handlers to prevent unnecessary re-renders
    const handlePress =  useCallback(async() => {
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



    // Prepare button properties
    const buttonProps = {
        variant,
        rounded,
        size,
        disabled: formState.isSubmitting || disabled,
        fullWidth: formProps.button_full_width || width < LAYOUT_BREAKPOINTS.lg,
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
    const rowClassName = [
        formProps.button_hide_on_small ? 'hidden sm:flex' : '',
        'gap-x-2',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <Field {...restProps}>
            <Row className={rowClassName}>
                <Button
                    title={!icon_only ? value : ''}
                    startDecorator={icon}
                    {...buttonProps}
                    {...buttonHandlers}
                />
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