import Form from 'app/components/form';
import { View } from 'app/design/view'

export default function ElementForm(props) {

    let { classContainerName, ...rest } = props
    return (
        <Form {...rest} />
    );
}
