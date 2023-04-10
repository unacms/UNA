import { Modal } from 'react-native';

import { Button } from 'app/design/controls';
import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'

export default function SliderBottom({ isVisible, title, children, onClose }) {
    return (
        <Modal animationType="slide" transparent={true} visible={isVisible}>
            <View className="absolute bottom-0 w-full bg-white dark:bg-gray-700 rounded-t-lg shadow">
                {(!!title || !!onClose) && 
                <View className={"flex flex-row items-center" + (!!title ? " justify-between" : " justify-end") + " p-2 border-b border-gray-200 dark:border-gray-600 rounded-t-lg"}>
                    {!!title && <Text className="text-xl font-medium text-gray-900 dark:text-white">{title}</Text>}
                    {!!onClose && <View className=""><Button variant="default" size="xs" startDecorator="x" onPress={onClose}/></View>}
                </View>
                }
                <View className="space-y-4 overflow-y-auto text-gray-700 dark:text-gray-200">{children}</View>
            </View>
        </Modal>
    );
}