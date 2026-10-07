import { useCallback, useState, useEffect, useRef } from 'react';
import { Keyboard, Platform } from 'react-native';
import Field, { FormError } from './_field';
import { useFormContext } from 'react-hook-form';
import { NeoButton, Hidden } from 'app/design/controls';
import { View, Row } from 'app/design/view';
import { appSetting, cn } from 'app/lib/util';
import emitter, { EVENTS } from 'app/context/emitter';
import { useFormInstanceId } from 'app/context/form-instance';
import { useFormUploading } from 'app/lib/form/form-helpers';
import { useFormField } from 'app/lib/form/use-form-field';
import { useTranslation } from 'react-i18next';

const isNative = Platform.OS !== 'web';

const SIZE_TO_CONTROL = {
    xs: 'mini',
    sm: 'small',
    base: 'regular',
    lg: 'large',
};

/** Full-width in narrow form containers; hug content when the form is wider (matches legacy Button). */
const RESPONSIVE_SUBMIT_WIDTH = 'w-full @sm/form-container:w-auto flex-auto web:w-full';
const RESPONSIVE_SUBMIT_CONTAINER = 'w-full @sm/form-container:w-auto';

const VARIANT_TO_STYLE = {
    primary: 'borderedProminent',
    secondary: 'bordered',
    outline: 'bordered',
    default: 'glassProminent',
};

export default function FormFieldSubmit(props) {
    const { t } = useTranslation();
    const {
        value,
        form_name,
        handleSubmit,
        disabled = false,
        icon_only = false,
        rounded = false,
        icon,
        size = 'base',
        variant,
        style: neoStyle,
        alt,
        tooltip,
        notFullWidth = false,
        saveOnChanges = false,
        hide_errors = true,
        bare = false,
    } = props;

    const { name, field, readOnly } = useFormField(props, { returnKey: false });
    const formContext = useFormContext();
    const formInstanceId = useFormInstanceId();
    const { formState } = formContext;
    const [isSumbitting, setIsSumbitting] = useState(false);
    const isUploading = useFormUploading(form_name);
    // Guards against onPressIn + onPress both firing on the same gesture.
    const pressLockRef = useRef(false);

    const formProps = appSetting('forms', form_name) || {};

    const handlePress = useCallback(() => {
        if (formState.isSubmitting || disabled || readOnly || isUploading || isSumbitting || pressLockRef.current) return;
        pressLockRef.current = true;
        if (isNative) Keyboard.dismiss();
        handleSubmit();
        // Unlock after the gesture settles so a failed validation can be retried,
        // but not so fast that the matching onPress double-fires.
        setTimeout(() => {
            pressLockRef.current = false;
        }, 400);
    }, [disabled, readOnly, handleSubmit, formState.isSubmitting, isUploading, isSumbitting]);

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
    const buttonStyle =
        neoStyle ?? (variant ? VARIANT_TO_STYLE[variant] : undefined) ?? 'borderedProminent';
    const borderShape = icon_only && rounded
        ? 'circle'
        : rounded
            ? 'capsule'
            : 'roundedRectangle';

    useEffect(() => {
        let timeoutId;
        const subscription = emitter.addListener(EVENTS.form(form_name), (data) => {
            if (formInstanceId != null && data.formInstanceId !== formInstanceId) return;
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
    }, [form_name, formInstanceId]);

    const rowClassName = cn(
        formProps.button_hide_on_small || props.button_hide_on_small ? 'hidden sm:flex' : '',
        'gap-x-2',
        'items-center',
    );

    const responsiveButtonClassNames = fullWidth && !icon_only
        ? { root: RESPONSIVE_SUBMIT_WIDTH, container: RESPONSIVE_SUBMIT_CONTAINER }
        : undefined;

    const isBusy = isSumbitting || isUploading;

    const submitButton = (
        <NeoButton
            label={icon_only ? undefined : value}
            image={icon}
            loading={isBusy}
            style={buttonStyle}
            controlSize={controlSize}
            borderShape={borderShape}
            width="auto"
            alt={alt}
            tooltip={tooltip}
            classNames={responsiveButtonClassNames}
            onPress={handlePress}
            // Native: fire on press-in so keyboard layout jump cannot cancel onPress.
            {...(isNative ? { onPressIn: handlePress } : {})}
            disabled={isBusy || disabled || readOnly}
        />
    );

    const hiddenField = (
        <Hidden
            name={name}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            value={String(field.value)}
        />
    );

    if (bare) {
        return (
            <>
                {submitButton}
                {hiddenField}
            </>
        );
    }

    return (
        <Field {...props}>
            <Row className={rowClassName}>
                <View className={icon_only || notFullWidth ? '' : RESPONSIVE_SUBMIT_CONTAINER}>
                    {submitButton}
                </View>
                {saveOnChanges && (
                    <NeoButton
                        label={t('Reset')}
                        style="bordered"
                        controlSize={controlSize}
                        borderShape={borderShape}
                        width="auto"
                        classNames={responsiveButtonClassNames}
                        onPress={handleReset}
                    />
                )}
            </Row>
            {hiddenField}
            {showErrors && (
                <View className="mt-2">
                    <FormError errorText={t('Errors:')} />
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
