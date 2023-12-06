import Field from './_field';

import {Text} from 'app/design/typography'

export default function FormFieldCustom(props) {
    if (props.name != 'source')
        return <></>
    return (
        <Field {...props}>
            <Text>TODO: {props.name}</Text>
        </Field>
    );
}
