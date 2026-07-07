import Field from './_field';
import { useFormContext } from 'react-hook-form';
import { View, Row } from 'app/design/view';
import { getFormFieldByData } from 'app/lib/form-helpers';
import Submit from './submit';

function getInputSetChildren(props) {
    return Object.keys(props)
        .filter((key) => /^\d+$/.test(key))
        .sort((a, b) => Number(a) - Number(b))
        .map((key) => props[key])
        .filter((child) => child && typeof child === 'object' && child.type);
}

export default function FormFieldControls(props) {
    if (props[0].type == 'submit')
        return <Submit {...props[0]} handleSubmit={props.handleSubmit}/>

    if (props[1] && props[1].type == 'submit')
        return <Submit {...props[1]} handleSubmit={props.handleSubmit}/>

    if (props[0].type == 'button')
        return <Submit {...props[0]} handleSubmit={props.handleSubmit}/>

    const children = getInputSetChildren(props);
    if (!children.length) return null;

    const formContext = useFormContext();
    const childProps = {
        use_caption_as_placeholder: props.use_caption_as_placeholder,
        form_layout: props.form_layout,
        noPadding: true,
    };

    return (
        <Field {...props} error2={formContext.formState.errors[props.name]}>
            <Row className="items-end gap-2 flex-wrap w-full">
                {children.map((child, index) => (
                    <View
                        key={child.name || `input_set_${props.name}_${index}`}
                        className="flex-1 min-w-16"
                    >
                        {getFormFieldByData(child, props.handleSubmit, 'notitle', childProps)}
                    </View>
                ))}
            </Row>
        </Field>
    );
}
