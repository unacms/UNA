import { View } from 'app/design/view';
import Menu from '../menu';

export default function ElementEntityActions(props) {
    //relative  sm:my-0 bg-neocard dark:bg-neocard-dark  border-neoborder dark:border-neoborder-dark sm:border-x w-full mx-auto max-w-5xl

    return (
        <View className="">
            <View className="flex flex-col w-full">
                <View className="flex p-2 flex-row  border-t border-neoborder dark:border-neoborder-dark ">
                    <Menu {...props.data} displayType="element" showMatched="true" params={{show_action: true, show_counter: true, show_combined: true}} />
                </View>
            </View>
        </View>
    );
}