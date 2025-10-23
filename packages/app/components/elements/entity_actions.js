import { View } from 'app/design/view';
import Menu from 'app/components/menu';

export default function ElementEntityActions(props) {

    return (
        <View className="w-full">
            <View className="p-3 sm:px-4 ">
                <Menu {...props.data} displayType="element" showMatched={true} autoFilter={false} params={{show_action: true, show_counter: true, show_combined: true}} />
            </View>
        </View>
    );
}