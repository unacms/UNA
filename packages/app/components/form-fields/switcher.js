import Field from './_field';
import Switch from 'app/ui/atoms/switcher'
import { useFormContext, useController } from 'react-hook-form';
import { View } from 'app/design/view'
import { Text } from 'app/design/typography'
import { appSetting } from 'app/lib/util'

const switcherTheme = appSetting('theme', 'switcher');

export default function FormFieldSwitcher(props) {
    const { name, caption, checked, value } = props;
    const formContext = useFormContext();
    
    const initialValue = checked ? 1 : 0;
    
    const { field } = useController({ 
        name, 
        control: formContext.control,
        defaultValue: initialValue 
    });

    const handleToggle = () => {
        const newValue = field.value ? 0 : 1;
        field.onChange(newValue);
    };

    return (
        <Field {...props}>
            <View className={switcherTheme['u-controls-switcher-container']}>
                <Switch
                    onValueChange={handleToggle}
                    value={!!field.value}
                />
                <Text className={switcherTheme['u-controls-switcher-text']}>
                    {caption}
                </Text>
            </View>
        </Field>
    );
}