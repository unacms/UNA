import { useController, useFormContext } from 'react-hook-form';
import { Hidden } from 'app/design/controls'
import Field from './_field';

export default function FormFieldBlockHeader(props) {
    return (
        <Field {...props}/>
    );
}
