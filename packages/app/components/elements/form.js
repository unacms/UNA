import Form from '../form';
import { View } from 'app/design/view'

export default function ElementForm(props) {

    let { classContainerName, ...rest } = props

    return (
        <View className = {(props.name? 'form-' + props.name : '') + ' ' + (classContainerName? classContainerName : ' w-full grid place-items-center ')}>
            <Form {...rest} />
        </View>
    );
}
