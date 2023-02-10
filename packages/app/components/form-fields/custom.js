import React from 'react';
import Field from './_field';

import {Text} from 'app/design/typography'

export default function FormFieldCustom(props) {
    return (
        <Field {...props}>
            <Text>TODO: {props.name}</Text>
        </Field>
    );
}
