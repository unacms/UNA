import React, {useState} from 'react';
import Field from './_field';
import { Switch } from 'app/design/controls'

export default function FormFieldSwitcher(props) {

    const [isEnabled, setIsEnabled] = useState(props.checked ? true : false);
    const toggleSwitch = () => setIsEnabled(previousState => !previousState);
    // TODO: improve value
    return (
        <Field {...props}>
            <Switch
                trackColor={{false: '#767577', true: '#81b0ff'}}
                thumbColor={isEnabled ? '#f5dd4b' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={toggleSwitch}
                value={0}
                accessibilityLabel={props.caption}
            />
        </Field>
    );
}

