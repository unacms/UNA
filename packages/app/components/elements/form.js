import Form from 'app/components/form';
import { BlockWrapper } from 'app/components/block-wrapper'
export default function ElementForm(props) {

    const { classContainerName, ...rest } = props
    return (
        <BlockWrapper {...props.blockWrapperProps}>
            <Form {...rest} />
        </BlockWrapper>
    );
}

export const renderForm = (formProps, onFormChange) => {
    return (
        <Form {...formProps} key="form" name={formProps.name} onChange={onFormChange} />
    )
}