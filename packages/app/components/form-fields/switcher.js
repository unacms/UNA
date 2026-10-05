import Field from './_field';
import Switch, { resolveControlSize } from 'app/ui/atoms/switcher'
import { View } from 'app/design/view'
import { Text } from 'app/design/typography'
import { appSetting } from 'app/lib/util'
import { useFormField } from 'app/lib/form/use-form-field';
import { switcherInitialValue } from 'app/lib/form/field-initial-values';

const switcherTheme = appSetting('theme', 'switcher');

export default function FormFieldSwitcher(props) {
    const { caption, size } = props;
    const resolvedSize = resolveControlSize(size);
    const sizeClass = switcherTheme.size?.[resolvedSize] ?? switcherTheme.size?.regular ?? '';

    const { field } = useFormField(props, {
        defaultValue: switcherInitialValue(props),
        syncValue: false,
    });

    const handleToggle = () => {
        field.onChange(field.value ? 0 : 1);
    };

    return (
        <Field {...props}>
            <View className={`${switcherTheme['u-controls-switcher-container']} ${sizeClass}`}>
                <Switch
                    onValueChange={handleToggle}
                    value={!!field.value}
                    size={resolvedSize}
                />
                <Text className={switcherTheme['u-controls-switcher-text']}>
                    {caption}
                </Text>
            </View>
        </Field>
    );
}
