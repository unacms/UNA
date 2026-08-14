import Field, { getValidationRules } from './_field';
import { useFormContext } from 'react-hook-form';
import { InputWithIcons } from 'app/design/controls';
import { useEffect } from 'react';
import { Text } from 'app/design/typography';
import { useTranslation } from 'react-i18next';
import { useFormField } from 'app/lib/hooks/use-form-field';

/** UNA may send `null`, a scalar, or `{ value, currency }`. Form submits a scalar string. */
function normalizePriceValue(value) {
    if (value == null || value === '') return '';
    if (typeof value === 'object') {
        const amount = value.value;
        if (amount == null || amount === '') return '';
        return String(amount);
    }
    return String(value);
}

function resolveCurrency(props, fieldValue) {
    if (props.value_currency) return props.value_currency;
    if (fieldValue && typeof fieldValue === 'object' && fieldValue.currency) {
        return fieldValue.currency;
    }
    if (props.value && typeof props.value === 'object' && props.value.currency) {
        return props.value.currency;
    }
    return 'USD';
}

export default function FormFieldPrice(props) {
    const { t } = useTranslation();
    const name = props.name;
    const { setValue } = useFormContext();
    const {
        field,
        placeholder,
        readOnly,
        placeholderTextColor,
        focused,
        onFocus,
        onBlur,
        isAdaptiveLabel,
    } = useFormField(props, {
        defaultValue: normalizePriceValue(props.value),
        rules: getValidationRules(props),
        syncValue: false,
    });
    // Keep RHF scalar even if form reset/draft injects the raw UNA object.
    useEffect(() => {
        if (props.value !== undefined) {
            setValue(name, normalizePriceValue(props.value), { shouldDirty: false });
        }
    }, [name, props.value, setValue]);

    useEffect(() => {
        if (field.value != null && typeof field.value === 'object') {
            setValue(name, normalizePriceValue(field.value), { shouldDirty: false });
        }
    }, [name, field.value, setValue]);

    const displayValue = normalizePriceValue(field.value);
    const currency = resolveCurrency(props, field.value);

    return (
        <Field {...props} value={displayValue} focused={focused} isAdaptiveLabel={isAdaptiveLabel}>
            <InputWithIcons
                rounded="default"
                startDecorator={
                    <Text className="text-muted-foreground text-sm font-medium">{t(currency)}</Text>
                }
                textContentType="none"
                autoComplete="off"
                autoCorrect={false}
                spellCheck={false}
                keyboardType="decimal-pad"
                autoFocus={props.auto_focus}
                name={name}
                readOnly={readOnly}
                editable={!readOnly}
                placeholder={placeholder}
                placeholderTextColor={placeholderTextColor}
                onChangeText={field.onChange}
                onFocus={onFocus}
                onBlur={onBlur}
                value={displayValue}
                aria-label={props.caption}
                {...(props.checker?.params?.max
                    ? { maxLength: props.checker.params.max }
                    : {})}
            />
        </Field>
    );
}
