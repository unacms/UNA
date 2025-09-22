import Form from 'app/components/form';

export default function ElementForm(props) {

    const { classContainerName, ...rest } = props
    return (
        <Form {...rest} />
    );
}

export const renderForm = (formProps, onFormChange) => {
    return (
        <Form {...formProps} key="form" name={formProps.name} onChange={onFormChange} />
    )
}