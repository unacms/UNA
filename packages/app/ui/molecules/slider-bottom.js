import { Modal } from 'react-native';

import { A, Text } from 'app/design/typography'
import { View } from 'app/design/view'

export default function SliderBottom({ isVisible, title, children, onClose }) {
    return (
        <Modal animationType="slide" transparent={true} visible={isVisible}>
            <View className="absolute bottom-0 w-full rounded-t-xl bg-white dark:bg-gray-700 shadow">
                <View className="flex flex-row items-center justify-between p-5 border-b border-gray-200 dark:border-gray-600 rounded-t">
                    <Text className="text-xl font-medium text-gray-900 dark:text-white">{title || 'Choose a reaction'}</Text>
                    <A className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white" onPress={onClose}>
                        <Text className="w-5 h-5 text-center">X</Text>
                    </A>
                </View>
                {children}
            </View>
        </Modal>
    );
}