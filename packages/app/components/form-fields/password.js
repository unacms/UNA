import React from 'react';
import Field from './_field';
import {Text} from 'app/design/typography'

export default function FormFieldPassword(props) {
    return (
        <Field {...props}>
            <Text>TODO: pwd input</Text>
        </Field>
    );
// <input className="input input-bordered w-full max-w-xs" type="password" {...props.register(props.name)} />
}
