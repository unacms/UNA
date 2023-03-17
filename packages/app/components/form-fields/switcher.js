import React, {useState} from 'react';
import Field from './_field';
import { Text } from 'app/design/typography'
import { Switch } from 'app/design/controls'

export default function FormFieldSwitcher(props) {

    console.log(props);
    const [isEnabled, setIsEnabled] = useState(false);
    const toggleSwitch = () => setIsEnabled(previousState => !previousState);

    return (
        <Field {...props}>
            <Switch
                trackColor={{false: '#767577', true: '#81b0ff'}}
                thumbColor={isEnabled ? '#f5dd4b' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={toggleSwitch}
                value={isEnabled}
            />
        </Field>
    );
// <input className="toggle" type="checkbox" {...props.register(props.name)} />
}

