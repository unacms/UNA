import { View } from 'app/design/view';
import Menu from 'app/components/menu';

export default function ElementEntityActions(props) {

    return (
        <View>
            <View className="flex flex-col w-full">
                <View className="flex p-3 sm:p-4 flex-row">
                    <Menu {...props.data} displayType="element" showMatched={true} autoFilter={false} params={{show_action: true, show_counter: true, show_combined: true}} />
                </View>
            </View>
        </View>
    );
}