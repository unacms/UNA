import { useState } from 'react';
import { Pressable, Modal, Platform } from 'react-native';

import { A, Text } from 'app/design/typography'
import { View } from 'app/design/view'

export default function ElementPopup(oProps) {
    const [popupVisible, setPopupVisible] = [...oProps.visible];

    const onClose = () => {
        setPopupVisible(!popupVisible);
    };

    return (
        <Modal visible={popupVisible} onRequestClose={onClose} presentation="formSheet" animationType="slide" transparent={Platform.OS != 'ios'}>
            <View id={oProps.id} className="flex-row justify-center items-center top-0 left-0 right-0 z-50 w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-modal md:h-full">
                <View className="relative w-full h-full max-w-2xl md:h-auto">
                    <View className="relative bg-white dark:bg-gray-700 rounded-lg shadow">
                        {oProps?.title && 
                        <View className="flex-row items-start justify-between p-4 border-b border-gray-200 dark:border-gray-600 rounded-t">
                            <Text className="text-xl font-semibold text-gray-900 dark:text-white">{oProps?.title}</Text>
                            <A className="" onPress={() => setPopupVisible(!popupVisible)}>
                                <Text>X</Text>
                            </A>
                        </View>
                        }
                        <View className="p-4">
                            {oProps.children}
                        </View>
                        <View className="flex-row items-center p-6 border-t border-gray-200 dark:border-gray-600 rounded-b">
                            <A className="group flex-none shadow-sm hover:shadow active:opacity-80 active:shadow-none items-center p-2 dark:hover:bg-gray-800 dark:active:bg-gray-700 active:bg-gray-200 text-sm focus:outline-none font-medium text-gray-700 bg-white border focus:z-10 focus:ring-4 focus:ring-gray-200  border-gray-200 hover:border-gray-300 rounded-lg hover:bg-gray-100 bg-transparent hover:text-gray-900  focus:text-blue-700 dark:bg-gray-800 dark:border-gray-700/50 dark:hover:border-gray-700 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700/80 dark:focus:text-white hover:no-underline" onPress={() => {setPopupVisible(!popupVisible)}}>
                                <Text>Close</Text>
                            </A>                        
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
