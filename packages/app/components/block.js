import String from './blocks-content/string';
import ObjectDataObject from './blocks-content/object-data-object';
import ObjectDataArray from './blocks-content/object-data-array';
import React, { useState } from 'react';
import { View } from 'app/design/view'
import { H1,Text } from 'app/design/typography'
import { stripTags } from '../lib/util';

const componentsMap = {
    object: ObjectDataObject,
    array: ObjectDataArray,
    string: String,
};


export default function Block(props) {
    let block = props.block;

    let type = block.content && Array.isArray(block.content) ? 'array' : typeof block.content;
    const BlockType = componentsMap[type];

    const aAllowTypes = ['html', 'raw', 'lang'];

    if (type == 'string' && !aAllowTypes.includes(block.type))
        return null;

    if (block.menu && block.menu.items > 0){
        return <NavBottomTabs></NavBottomTabs>
    }

    block.designbox_id = Number(block.designbox_id);

    const aNoTitle = [0,10,13,3];
    const aNoBg = [0,10,14,4];
    let bIsShowTitle = true;
    if(aNoTitle.indexOf(block.designbox_id) != -1){
        bIsShowTitle = false;
    }

    let bIsShowBg = true;
    if(aNoBg.indexOf(block.designbox_id) != -1){
        bIsShowBg = false;
    }

    if (props.uri == 'view-post'){
        bIsShowBg = false;
        bIsShowTitle = false;
    }

    if (props.uri == 'home' && (block.source == 'system-profile_stats' || block.source == 'system-profile_menu')){
        bIsShowBg = false;
        bIsShowTitle = false;
    }

    if (block.source.includes('-browse_') || block.source.includes('bx_timeline-get_block_view')){
        bIsShowBg = false;
        bIsShowTitle = false;
    }

    return (
        
        <View key={block.id} className="w-full">
            <View key={block.id} className={bIsShowBg ? 'bg-neocard dark:bg-neocard-dark border  border-neoborder dark:border-neoborder-dark p-4 sm:rounded-lg' : ''}>
                {bIsShowTitle && <Text className=" text-lg text-neogray-800 dark:text-neogray-200 font-semibold my-auto pb-4">{stripTags(block.title+block.designbox_id)}</Text>}
                <View><BlockType data={block.content} type={block.type}  /></View>
            </View>
        </View>
    );
}
