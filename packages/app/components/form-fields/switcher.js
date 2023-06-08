import {useState} from 'react';
import Field from './_field';
import { Switch } from 'app/design/controls'
import { Theme } from 'app/design/theme';

export default function FormFieldSwitcher(props) {

    const [isEnabled, setIsEnabled] = useState(props.checked ? true : false);
    const toggleSwitch = () => setIsEnabled(previousState => !previousState);
    const { colors } = Theme();

    // TODO: improve value
    return (
        <Field {...props}>
            <Switch
                trackColor={{false: colors.background, true: colors.background}}
                thumbColor={isEnabled ? colors.primary : colors.primary}
                ios_backgroundColor="#3e3e3e"
                onValueChange={toggleSwitch}
                value={isEnabled}
                accessibilityLabel={props.caption}
            />
        </Field>
    );
}

