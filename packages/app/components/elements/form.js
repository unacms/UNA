import Form from '../form';
import { View } from 'app/design/view'

export default function ElementForm(props) {
    return (
        <View className = {props.name? ' static form-' + props.name: ''}>
            <Form {...props} />
        </View>
    );
}
