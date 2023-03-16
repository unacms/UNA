import String from './blocks-content/string';
import ObjectDataObject from './blocks-content/object-data-object';
import ObjectDataArray from './blocks-content/object-data-array';
import React, { useState } from 'react';
import { View } from 'app/design/view'
import { H1 } from 'app/design/typography'

const componentsMap = {
    object: ObjectDataObject,
    array: ObjectDataArray,
    string: String,
};

export default function Block({block}) {
    let type = block.content && Array.isArray(block.content) ? 'array' : typeof block.content;
    const BlockType = componentsMap[type];
    //TODO: conatiners @lg/main:flex https://tailwindcss.com/blog/tailwindcss-v3-2#container-queries
    console.log('log', block.content);
    if (block.type == 'service' && !Array.isArray(block.content))
        return null;

    return (
        
        <View key={block.id} className="w-full">
            <View key={block.id} className="sm:mx-2 lolo">
                <H1 className="hidden text-xl border-b-2 border-base-100 my-auto pb-1">{block.title}</H1>
                <BlockType data={block.content} type={block.type} />
            </View>
        </View>
    );
}
