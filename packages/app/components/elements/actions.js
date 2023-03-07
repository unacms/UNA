import { Platform } from 'react-native';
import { A, Text } from 'app/design/typography';
import { View } from 'app/design/view';
import Menu from '../menu';

export default function ElementActions(props) {
    return (
        <View className="relative sm:my-0 bg-card dark:bg-card-dark border-b border-bordercolor/10 dark:border-bordercolor-dark/10 sm:border-x w-full mx-auto max-w-5xl">
            <View className="flex flex-col divide-y divide-gray-500/5 w-full">
                <View className="flex flex-wrap flex-auto p-2">
                    <Menu {...props.data} displayType="element" showMatched="true" params={{show_action: true, show_counter: false}} />
                </View>
            </View>
        </View>
    );
}