'use client'
import React, { useState } from 'react';
import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import { appSetting } from 'app/lib/util';


export default function Tooltip(props) {
    const [visible, setVisible] = useState(false);

    const eventHandlers = {
        onMouseEnter: () => setVisible(true),
        onMouseLeave: () => setVisible(false),
    }

    if (!appSetting('layout', 'tooltips')){
        return props.children;
    }

    return (
        <View  {...eventHandlers}>
            {props.children}
            {visible && (
                <View className='absolute top-full bg-green-500 rounded-full p-3'>
                    <Text className="text-red-500">{props.content}</Text>
                </View>
            )}
        </View>
    );
};


