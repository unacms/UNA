import { Platform } from 'react-native';
import { A, Text } from 'app/design/typography';
import { View } from 'app/design/view';
import Menu from '../menu';

export default function ElementEntityActions(props) {
    return (
        <View className="relative p-4 sm:my-0 bg-card dark:bg-card-dark border-t border-neoborder/40 dark:border-neoborder-dark/40 sm:border-x w-full mx-auto max-w-5xl">
            <View className="flex flex-col divide-y divide-gray-500/5 w-full">
                <View className='flex-none flex flex-wrap flex-row items-center h-min my-auto p-2'>
                    <Menu {...props.data} displayType="element" showMatched="true" params={{show_action: false, show_counter: true}} />
                </View>
                <View className="flex flex-wrap flex-auto p-2">
                    <Menu {...props.data} displayType="element" showMatched="true" params={{show_action: true, show_counter: false}} />
                </View>
            </View>
        </View>
    );
}