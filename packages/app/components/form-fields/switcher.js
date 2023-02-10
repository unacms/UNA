import React from 'react';
import Field from './_field';
import {Text} from 'app/design/typography'

export default function FormFieldSwitcher(props) {
    return (
        <Field {...props}>
            <Text>TODO: switcher input</Text>
        </Field>
    );
// <input className="toggle" type="checkbox" {...props.register(props.name)} />
}

