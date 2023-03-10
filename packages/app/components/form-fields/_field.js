import React from 'react';
import { View } from 'app/design/view'
import { Text } from 'app/design/typography'

export default function FormField(props) {
    const sClassName = 'form-control w-full  mb-4 form-control-' + props.name ;
    return (
        <View className={sClassName}>
            { props.caption && <View className="label">
                <Text className="label-text capitalize block mb-1 ml-1 text-sm font-medium text-gray-900 dark:text-white">{props.caption}</Text>
            </View> }
            {props.children}
            {props.error &&
                <View className="label">
                    <Text className="label-text-alt mt-2 text-sm text-red-600 dark:text-red-400 font-medium">{props.error}</Text>
                </View>}
        </View>
    );
}
