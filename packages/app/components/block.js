import String from './blocks-content/string';
import ObjectDataObject from './blocks-content/object-data-object';
import ObjectDataArray from './blocks-content/object-data-array';
import { View } from 'app/design/view'
import { Text } from 'app/design/typography'
import { stripTags } from '../lib/util';

const componentsMap = {
    object: ObjectDataObject,
    array: ObjectDataArray,
    string: String,
};

export function BlockByName({data, name, onScroll2, f}) {

    let b = null;
    if (name){
        const blockName = name?.name;
        Object.keys(data?.elements).forEach(key => {
            Object.keys(data.elements[key]).forEach(key2 => {
                if (data.elements[key][key2].content){
                    Object.keys(data.elements[key][key2].content).forEach(key3 => {
                        if(data.elements[key][key2].source == blockName.toString())
                            b = data.elements[key][key2];
                    });
                }
            });
        });
    }
    if (b)
        return <Block key={b.id} uri={data.uri} block={b} showTitle={name.showTitle} showBg={name.showBg} f={f}  />;
    
    return <Text className="text-black dark:text-white">Not found: {JSON.stringify(name)}</Text>
}

export function BlockByName2({b, name}) {
    return <Block key={b.id} uri={''} block={b} showTitle={name.showTitle} showBg={name.showBg} />;
}

export default function Block(props) {
    let block = props.block;

    let type = block.content && Array.isArray(block.content) ? 'array' : typeof block.content;
    const BlockType = componentsMap[type];

    const aAllowTypes = ['html', 'raw', 'lang'];
    if (type == 'string' && !aAllowTypes.includes(block.type))
    //    return null;

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

    if (typeof props.showBg !== 'undefined'){
        bIsShowBg = props.showBg;
    }
    if (typeof props.showTitle !== 'undefined'){
        bIsShowTitle = props.showTitle;
    }
    return (
        <View key={block.id} className="w-full">
            <View key={block.id} className={bIsShowBg ? ' px-4 py-3 bg-backgroundcard dark:bg-backgroundcard-dark border  border-bordercolorcard dark:border-bordercolorcard-dark sm:rounded-lg' : ''}>
                {bIsShowTitle && <Text className=" text-xl pb-4 text-gray-800 dark:text-gray-200 font-bold my-auto">{stripTags(block.title)}</Text>}
                <View><BlockType data={block.content} type={block.type} /></View>
            </View>
        </View>
    );
}
