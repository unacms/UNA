import Field from './_field';
import { Text } from 'app/design/typography'
import { RangeSlider } from '@react-native-assets/slider'
import { useResolveClassNames } from 'uniwind';
import { useThemeName } from 'app/design/theme';
import { View, Row } from 'app/design/view'
import { appSetting, isWeb } from 'app/lib/util';
import { useFormField } from 'app/lib/form/use-form-field';
import { doubleRangeInitialValue } from 'app/lib/form/field-initial-values';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

const themeSettings = appSetting('theme', 'doublerange');

/**
 * A colour value for the slider from a colour class (`bg-border`). Native uses Uniwind's
 * resolved style. On web that style keeps the light value after a switch to dark, and React
 * Native Web drops `var()` colours, so the colour is read from a hidden probe instead, again
 * whenever the theme changes.
 */
function useClassColor(className) {
    const resolved = useResolveClassNames(className || '');
    const themeName = useThemeName();
    const [webColor, setWebColor] = useState(undefined);

    useEffect(() => {
        if (!isWeb || !className) return;
        // Next frame: the theme's class or attribute on the document is set by then.
        const frame = requestAnimationFrame(() => {
            const probe = document.createElement('div');
            probe.className = className;
            probe.style.display = 'none';
            document.body.appendChild(probe);
            setWebColor(getComputedStyle(probe).backgroundColor);
            probe.remove();
        });
        return () => cancelAnimationFrame(frame);
    }, [className, themeName]);

    return webColor ?? resolved?.backgroundColor;
}

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

    // The slider takes colour values; an explicit per-theme colour setting wins over the class.
    const trackColor = useClassColor(themeSettings.track_class);
    const rangeColor = useClassColor(themeSettings.range_class);
    const thumbColor = useClassColor(themeSettings.thumb_class);

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
                    outboundColor={themeSettings.outbound_color?.[themeName] ?? trackColor}
                    inboundColor={themeSettings.inbound_color?.[themeName] ?? rangeColor}
                    thumbTintColor={themeSettings.thumb_tint_color?.[themeName] ?? thumbColor}
                />
            </View>
            <Row className={themeSettings.container}>
                <Row className={themeSettings.value_container}>
                    <Text className={themeSettings.text_info}>{t('From')}</Text>
                    <Text className={themeSettings.text_value}>{range[0]}</Text>
                </Row>
                <Row className={themeSettings.value_container}>
                    <Text className={themeSettings.text_info}>{t('To')}</Text>
                    <Text className={themeSettings.text_value}>{range[1]}</Text>
                </Row>
            </Row>
        </Field>
    );
}
