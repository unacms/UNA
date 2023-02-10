import React from 'react';
import Likes from '../atoms/likes';
import Reactions from '../atoms/reactions';
import { View } from 'app/design/view'

const oComponentsMap = {
    likes: Likes,
    reactions: Reactions
};

export default function MenuItemElement(oProps) {
    if(!oProps.data || !oProps.data.type)
        return;

    const Element = oComponentsMap[oProps.data.type];
    if(!Element)
        return;

    if(oProps.data.params != undefined && oProps.params != undefined)
        oProps.data.params = {...oProps.data.params, ...oProps.params}

    return (
        <View className="menu-item whitespace-nowrap">
            <Element key={oProps.id ? oProps.id : oProps.name} {...oProps.data} />
        </View>
    );
}
