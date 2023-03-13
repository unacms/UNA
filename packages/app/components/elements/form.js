import Form from '../form';
import { View } from 'app/design/view'

export default function ElementForm(props) {
    return (
        <View className = {props.name? 'px-4 first:pt-4 form-' + props.name: 'w-full grid place-items-center px-4 first:pt-4'}>
            <Form {...props} />
        </View>
    );
}
