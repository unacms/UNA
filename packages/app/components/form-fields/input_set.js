import Field from './_field';
import { useController, useFormContext } from 'react-hook-form';
import { Button, Hidden } from 'app/design/controls'
import Submit from './submit';

export default function FormFieldControls(props) {
    if (props[0].type == 'submit')
        return <Submit {...props[0]} handleSubmit={props.handleSubmit}/>

    return <>TODO</>
}