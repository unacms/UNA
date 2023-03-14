import Form from '../form';
import { View } from 'app/design/view'

export default function ElementForm(props) {

    let { classContainerName, ...rest } = props

    return (
        <View className = {(props.name? 'form-' + props.name : '') + ' ' + (classContainerName? classContainerName : 'px-4 first:pt-4 w-full grid place-items-center px-4 first:pt-4')}>
            <Form {...rest} />
        </View>
    );
}
