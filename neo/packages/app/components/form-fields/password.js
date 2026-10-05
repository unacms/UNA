import Field from './_field';
import { Input, NeoButton } from 'app/design/controls'
import { View } from 'app/design/view'
import { useState } from 'react';
import { appSetting } from 'app/lib/util';
import { useFormField } from 'app/lib/form/use-form-field';

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
    } = useFormField(props);

    const eyeIcons = appSetting('forms', 'password_eye_button')?.image;
    const eyeIcon = isVisible ? eyeIcons?.visible : eyeIcons?.hidden;

    return (
        <Field {...props} value={field.value} focused={focused} isAdaptiveLabel={isAdaptiveLabel}>
            <View className="relative w-full">
                <Input
                    ref={inputRef}
                    id={inputId}
                    nativeID={inputId}
                    textContentType="password"
                    autoComplete="current-password"
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
                    aria-describedby={errorId}
                    {...returnKeyProps}
                />
                {eyeIcon ? (
                    <View className="absolute right-1.5 top-1/2 -translate-y-1/2 justify-center items-center z-20">
                        <NeoButton
                            image={eyeIcon}
                            style="borderless"
                            controlSize="small"
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
