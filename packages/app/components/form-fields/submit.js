import { useCallback, useState, useEffect } from 'react';
import Field, { FormError } from './_field';
import { useController, useFormContext } from 'react-hook-form';
import { NeoButton, Hidden } from 'app/design/controls';
import { View, Row } from 'app/design/view';
import { appSetting, cn } from 'app/lib/util';
import emitter from 'app/context/emitter';

const SIZE_TO_CONTROL = {
    xs: 'mini',
    sm: 'small',
    base: 'regular',
    lg: 'large',
};

/** Full-width in narrow form containers; hug content when the form is wider (matches legacy Button). */
const RESPONSIVE_SUBMIT_WIDTH = 'w-full @sm/block:w-auto flex-auto web:w-full';
const RESPONSIVE_SUBMIT_CONTAINER = 'w-full @sm/block:w-auto';

export default function FormFieldSubmit(props) {
    const {
        name,
        value,
        form_name,
        handleSubmit,
        disabled = false,
        icon_only = false,
        rounded = false,
        icon,
        size = 'base',
        notFullWidth = false,
        saveOnChanges = false,
        hide_errors = true,
    } = props;

    const formContext = useFormContext();
    const { formState } = formContext;
    const [isSumbitting, setIsSumbitting] = useState(false);
    const { field } = useController({ name, rules: {}, defaultValue: value });

    const formProps = appSetting('forms', form_name) || {};

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

    const errors = formState.errors;
    const errorKeys = Object.keys(errors);
    const showErrors =
        errorKeys.length > 0 && !hide_errors && !formProps.hide_errors;

    const fullWidth = !notFullWidth;
    const controlSize = SIZE_TO_CONTROL[size] || 'regular';
    const borderShape = icon_only && rounded
        ? 'circle'
        : rounded
            ? 'capsule'
            : 'roundedRectangle';

    useEffect(() => {
        let timeoutId;
        const subscription = emitter.addListener(`form_${form_name}`, (data) => {
            if (data.action == 'submited') {
                setIsSumbitting(true);
            }
            if (data.action == 'received') {
                timeoutId = setTimeout(() => {
                    setIsSumbitting(false);
                }, 1000);
            }
        });

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            subscription.remove();
        };
    }, [form_name]);

    const rowClassName = cn(
        formProps.button_hide_on_small || props.button_hide_on_small ? 'hidden sm:flex' : '',
        'gap-x-2',
        'items-center',
    );

    const responsiveButtonClassNames = fullWidth && !icon_only
        ? { root: RESPONSIVE_SUBMIT_WIDTH, container: RESPONSIVE_SUBMIT_CONTAINER }
        : undefined;

    return (
        <Field {...props}>
            <Row className={rowClassName}>
                <View className={icon_only ? '' : RESPONSIVE_SUBMIT_CONTAINER}>
                    <NeoButton
                        label={icon_only ? undefined : value}
                        image={icon}
                        loading={isSumbitting}
                        style="glassProminent"
                        controlSize={controlSize}
                        borderShape={borderShape}
                        width="auto"
                        classNames={responsiveButtonClassNames}
                        onPress={handlePress}
                        disabled={isSumbitting || disabled}
                    />
                </View>
                {saveOnChanges && (
                    <NeoButton
                        label="Reset"
                        style="bordered"
                        controlSize={controlSize}
                        borderShape={borderShape}
                        width="auto"
                        classNames={responsiveButtonClassNames}
                        onPress={handleReset}
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
