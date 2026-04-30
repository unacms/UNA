import Field from './_field';
import { useController, useFormContext } from 'react-hook-form';
import { Button, Hidden } from 'app/design/controls'
import Submit from './submit';

export default function FormFieldControls(props) {
    if (props[0].type == 'submit')
        return <Submit {...props[0]} handleSubmit={props.handleSubmit}/>
    
    if (props[1] && props[1].type == 'submit')
        return <Submit {...props[1]} handleSubmit={props.handleSubmit}/>

    if (props[0].type == 'button')
        return <Submit {...props[0]} handleSubmit={props.handleSubmit}/>
        
    return null
}