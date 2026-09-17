import Field from './_field';
import { useFormContext } from 'react-hook-form';
import { View, Row } from 'app/design/view';
import { getFormFieldByData } from 'app/lib/form/form-helpers';
import Submit from './submit';

function getInputSetChildren(props) {
    return Object.keys(props)
        .filter((key) => /^\d+$/.test(key))
        .sort((a, b) => Number(a) - Number(b))
        .map((key) => props[key])
        .filter((child) => child && typeof child === 'object' && child.type);
}

export default function FormFieldControls(props) {
    // Unconditional: hooks must not follow the early returns below.
    const formContext = useFormContext();

    if (props[0].type == 'submit')
        return <Submit {...props[0]} handleSubmit={props.handleSubmit}/>

    if (props[1] && props[1].type == 'submit')
        return <Submit {...props[1]} handleSubmit={props.handleSubmit}/>

    if (props[0].type == 'button')
        return <Submit {...props[0]} handleSubmit={props.handleSubmit}/>

    const children = getInputSetChildren(props);
    if (!children.length) return null;

    const childProps = {
        use_caption_as_placeholder: props.use_caption_as_placeholder,
        form_layout: props.form_layout,
        noPadding: true,
    };

    return (
        <Field {...props} error2={formContext.formState.errors[props.name]}>
            <Row className="items-end gap-2 flex-wrap w-full">
                {children.map((child, index) => {
                    const childKey = `${props.name || 'input_set'}_${child.name || child.type || 'field'}_${index}`
                    return (
                    <View
                        key={childKey}
                        className="flex-1 min-w-16"
                    >
                        {getFormFieldByData(child, props.handleSubmit, 'notitle', childProps, childKey)}
                    </View>
                    )
                })}
            </Row>
        </Field>
    );
}
