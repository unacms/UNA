import { useState, useEffect } from 'react';
import Field from './_field';
import { Switch } from 'app/design/controls'
import { useFormContext } from 'react-hook-form';
import { View } from 'app/design/view'
import { Text } from 'app/design/typography'
import { appSetting } from 'app/lib/util'
const switcherTheme = appSetting('theme', 'switcher');

export default function FormFieldSwitcher(props) {
    const [isEnabled, setIsEnabled] = useState(props.checked ? true : false);
    const toggleSwitch = () => setIsEnabled(previousState => !previousState);
    const formContext = useFormContext();

    useEffect(() => {
        formContext.setValue(props.name, isEnabled ? 1 : 0)
    }, [props.name, isEnabled]);

    return (
        <Field {...props}>
            <View className={switcherTheme['u-controls-switcher-container']}>
                <Switch
                    onValueChange={toggleSwitch}
                    value={isEnabled}
                />
                <Text className={switcherTheme['u-controls-switcher-text']}>{props.caption}</Text>
            </View>
        </Field>
    );
}

