import { useState, useEffect } from 'react';
import Field from './_field';
import { Switch } from 'app/design/controls'
import { Theme } from 'app/design/theme';
import { useFormContext } from 'react-hook-form';
import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { appSetting } from 'app/lib/util';

const themeSettings = appSetting('theme', 'switcher');

export default function FormFieldSwitcher(props) {
    const [isEnabled, setIsEnabled] = useState(props.checked ? true : false);
    const toggleSwitch = () => setIsEnabled(previousState => !previousState);
    const { colors } = Theme();
    const formContext = useFormContext();

    useEffect(() => {
        formContext.setValue(props.name, isEnabled ? 1 : 0)
    }, [props.name, isEnabled]);

    return (
        <Field {...props}>
            <View className={themeSettings.container}>
                <Switch
                    trackColor={{ false: themeSettings.track, true: themeSettings.active_track }}
                    thumbColor={themeSettings.thumb}
                    activeThumbColor={themeSettings.active_thumb}
                    ios_backgroundColor={colors.background}
                    onValueChange={toggleSwitch}
                    value={isEnabled}
                    aria-label={props.caption}
                />
                <Text className={themeSettings.text}>{props.caption}</Text>
            </View>
        </Field>
    );
}

