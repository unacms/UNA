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
                trackColor={{false: colors.border, true: colors.primary}}
                thumbColor={'#ffffff'}
                activeThumbColor={'#ffffff'}
                ios_backgroundColor={colors.background}
                onValueChange={toggleSwitch}
                value={isEnabled}
                ariaLabel={props.caption}
            />
        </Field>
    );
}

