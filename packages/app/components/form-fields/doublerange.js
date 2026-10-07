import Field from './_field';
import { Text } from 'app/design/typography'
import { RangeSlider } from '@react-native-assets/slider'
import { useThemeName } from 'app/design/theme';
import { View, Row } from 'app/design/view'
import { appSetting } from 'app/lib/util';
import { useFormField } from 'app/lib/form/use-form-field';
import { doubleRangeInitialValue } from 'app/lib/form/field-initial-values';
import { useTranslation } from 'react-i18next';

const themeSettings = appSetting('theme', 'doublerange');

function toRange(value, min, max) {
    if (typeof value === 'string' && value.includes('-')) {
        const parts = value.split('-').map((str) => parseInt(str, 10));
        if (parts.length === 2 && parts.every((n) => !Number.isNaN(n))) return parts;
    }
    return [Number(min), Number(max)];
}

export default function FormFieldDoubleRange(props) {
    const { t } = useTranslation();
    const themeName = useThemeName();
    const min = props.attrs.min;
    const max = props.attrs.max;
    const defaultValue = doubleRangeInitialValue(props);

    const { field } = useFormField(props, {
        defaultValue,
        syncValue: false,
    });

    const range = toRange(field.value, min, max);

    return (
        <Field {...props}>
            <View className="flex-auto px-2">
                <RangeSlider
                    onSlidingComplete={(val) => field.onChange(val.join('-'))}
                    trackHeight={themeSettings.track_height}
                    thumbSize={themeSettings.thumb_size}
                    slideOnTap={true}
                    range={range}
                    minimumValue={min}
                    maximumValue={max}
                    step={1}
                    minimumRange={0}
                    crossingAllowed={false}
                    outboundColor={themeSettings.outbound_color[themeName]}
                    inboundColor={themeSettings.inbound_color[themeName]}
                    thumbTintColor={themeSettings.thumb_tint_color[themeName]}
                />
            </View>
            <Row className={themeSettings.container}>
                <Row className={themeSettings.value_container}>
                    <Text className={themeSettings.text_info}>{t('From')}</Text>
                    <Text className={themeSettings.text_value}>{range[0]}</Text>
                </Row>
                <Row className={themeSettings.value_container}>
                    <Text className={themeSettings.text_info}>{t('To')}</Text>
                    <Text className={themeSettings.text_value}>{range[1]} </Text>
                </Row>
            </Row>
        </Field>
    );
}
