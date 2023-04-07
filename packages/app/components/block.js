import String from './blocks-content/string';
import ObjectDataObject from './blocks-content/object-data-object';
import ObjectDataArray from './blocks-content/object-data-array';
import React, { useState } from 'react';
import { View } from 'app/design/view'
import { H1 } from 'app/design/typography'
//import { NavBottomTabs } from 'app/components/nav/bottomtabs'

const componentsMap = {
    object: ObjectDataObject,
    array: ObjectDataArray,
    string: String,
};

export default function Block({block}) {
    let type = block.content && Array.isArray(block.content) ? 'array' : typeof block.content;
    const BlockType = componentsMap[type];

    const aAllowTypes = ['html', 'raw', 'lang'];

    if (type == 'string' && !aAllowTypes.includes(block.type))
        return null;

    if (block.menu && block.menu.items > 0){
        return <NavBottomTabs></NavBottomTabs>
    }
    return (
        
        <View key={block.id} className="w-full">
            <View key={block.id} className="">
                <H1 className="hidden text-xl border-b-2 border-base-100 my-auto pb-1">{block.title}</H1>
                <BlockType data={block.content} type={block.type}  />
            </View>
        </View>
    );
}
