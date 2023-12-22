import Field from './_field';
import FormFieldSuggestion from './suggestion';
import {Text} from 'app/design/typography'

export default function FormFieldCustom(props) {
    
    if (props.name == 'source')
        return <FormFieldSuggestion {...props}/>

    return (
        <Field {...props}>
            <Text>TODO: {props.name}</Text>
        </Field>
    );
}
