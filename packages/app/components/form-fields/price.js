import Field, { getValidationRules } from './_field';
import { useController, useFormContext } from 'react-hook-form';
import { TextInputClear } from 'app/design/controls';
import { useEffect } from 'react';
import { Text } from 'app/design/typography';
import { Row, View } from 'app/design/view';
import { appSetting } from 'app/lib/util';
import { useTranslation } from 'react-i18next';

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
    const defaultValue = normalizePriceValue(props.value);
    const rules = getValidationRules(props);
    const formContext = useFormContext();
    const { field } = useController({ name, rules, defaultValue });
    const placeholder = props.use_caption_as_placeholder ? props.caption : props.placeholder;
    const inputSettings = appSetting('theme', 'inputs');
    const readOnly =
        props?.attrs?.readonly == 'readonly' || props?.attrs?.disabled == 'disabled';

    // Keep RHF scalar even if form reset/draft injects the raw UNA object.
    useEffect(() => {
        if (props.value !== undefined) {
            formContext.setValue(name, normalizePriceValue(props.value), { shouldDirty: false });
        }
    }, [name, props.value]);

    useEffect(() => {
        if (field.value != null && typeof field.value === 'object') {
            formContext.setValue(name, normalizePriceValue(field.value), { shouldDirty: false });
        }
    }, [name, field.value]);

    const displayValue = normalizePriceValue(field.value);
    const currency = resolveCurrency(props, field.value);

    return (
        <Field {...props} error2={formContext.formState.errors[name]}>
            <Row
                className={`${inputSettings.base} ${inputSettings.rounded.default} overflow-hidden items-stretch p-0`}
            >
                <View className="px-3.5 justify-center bg-muted/50 border-r border-border/60">
                    <Text className="text-muted-foreground text-base">{t(currency)}</Text>
                </View>
                <TextInputClear
                    className={`flex-1 bg-transparent text-card-foreground placeholder:text-muted-foreground ${inputSettings.size.regular}`}
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
                    placeholderTextColor="#6b7280"
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    value={displayValue}
                    aria-label={props.caption}
                    {...(props.checker?.params?.max
                        ? { maxLength: props.checker.params.max }
                        : {})}
                />
            </Row>
        </Field>
    );
}
