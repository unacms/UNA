import Field from './_field';
import { Input, NeoButton } from 'app/design/controls'
import { View } from 'app/design/view'
import { useState } from 'react';
import { appSetting, cn } from 'app/lib/util';
import { useFormField } from 'app/lib/form/use-form-field';
import Link from 'app/ui/atoms/link';
import { useTranslation } from 'react-i18next';

export default function FormFieldPassword(props) {
    const [isVisible, setIsVisible] = useState(true)
    const {
        name,
        field,
        placeholder,
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
        required,
    } = useFormField(props);
    // UNA says which password it is (`new-password` on sign-up and password change), so managers offer to make one.
    const autoComplete = props.attrs?.autocomplete || 'current-password';

    const { t } = useTranslation();
    // The sign-in form's "Forgot password?" (`forms.sys_login.forgot_password_link`), drawn by Field.
    const forgotHref = props.form_name ? appSetting('forms', props.form_name)?.forgot_password_link : '';
    const fieldLink = forgotHref ? (
        <Link variant="accent" size="xs" href={forgotHref} haptics="Medium">
            {t('Forgot password?')}
        </Link>
    ) : null;

    const eyeButton = appSetting('forms', 'password_eye_button');
    const eyeIcon = isVisible ? eyeButton?.image?.visible : eyeButton?.image?.hidden;
    const size = props.size || appSetting('theme', 'inputs', 'default_size') || 'regular';
    const eyePosition = eyeButton?.position?.[size] ?? 'right-1.5';

    return (
        <Field {...props} value={field.value} focused={focused} isAdaptiveLabel={isAdaptiveLabel} fieldLink={fieldLink}>
            <View className="relative w-full">
                <Input
                    ref={inputRef}
                    id={inputId}
                    nativeID={inputId}
                    textContentType={autoComplete === 'new-password' ? 'newPassword' : 'password'}
                    autoComplete={autoComplete}
                    placeholderTextColor={placeholderTextColor}
                    placeholder={placeholder}
                    secureTextEntry={isVisible}
                    name={name}
                    onChangeText={field.onChange}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    value={field.value}
                    aria-label={props.caption}
                    aria-invalid={invalid || undefined}
                    aria-required={required || undefined}
                    aria-describedby={errorId}
                    {...returnKeyProps}
                />
                {eyeIcon ? (
                    <View className={cn('absolute top-1/2 -translate-y-1/2 justify-center items-center z-20', eyePosition)}>
                        <NeoButton
                            image={eyeIcon}
                            style="borderless"
                            controlSize="small"
                            borderShape={eyeButton?.border_shape}
                            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                            accessibilityLabel={isVisible ? 'Show password' : 'Hide password'}
                            onPress={() => { setIsVisible(!isVisible) }}
                        />
                    </View>
                ) : null}
            </View>
        </Field>
    );
}
