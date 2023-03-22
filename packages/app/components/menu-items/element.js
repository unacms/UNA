import React from 'react';

import { View } from 'app/design/view'
import Likes from 'app/ui/molecules/likes';
import Reactions from 'app/ui/molecules/reactions';
import Connections from 'app/ui/molecules/connections';

const oComponentsMap = {
    likes: Likes,
    reactions: Reactions,
    connections: Connections
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
        <View className="menu-item android:mr-2 ios:mr-2 whitespace-nowrap">
            <Element key={oProps.id ? oProps.id : oProps.name} {...oProps.data} />
        </View>
    );
}
