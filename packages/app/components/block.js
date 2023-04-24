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

export function BlockByName({data, name, hideTitle, hideBg}) {
    
    let b = null;
    if (name){
        Object.keys(data?.elements).forEach(key => {
            Object.keys(data.elements[key]).forEach(key2 => {
                if (data.elements[key][key2].content){
                    Object.keys(data.elements[key][key2].content).forEach(key3 => {
                        if(data.elements[key][key2].source == name.toString())
                            b = data.elements[key][key2];
                    });
                }
            });
        });
    }
    if (b)
        return <Block key={b.id} uri={data.uri} block={b} hideTitle={hideTitle} hideBg={hideBg} />;
    
    return <Text>Not found: {name}</Text>
}

export default function Block(props) {
    let block = props.block;

    let type = block.content && Array.isArray(block.content) ? 'array' : typeof block.content;
    const BlockType = componentsMap[type];

    const aAllowTypes = ['html', 'raw', 'lang'];

    if (type == 'string' && !aAllowTypes.includes(block.type))
        return null;

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

    if (props.hideBg == true){
        bIsShowBg = false;
    }
    if (props.hideTitle == true){
        bIsShowTitle = false;
    }

    return (
        <View key={block.id} className="w-full">
            <View key={block.id} className={bIsShowBg ? 'bg-neocard dark:bg-neocard-dark border  border-neoborder dark:border-neoborder-dark p-4 sm:rounded-lg' : ''}>
                {bIsShowTitle && <Text className=" text-lg text-gray-800 dark:text-gray-200 font-semibold my-auto pb-4">{stripTags(block.title)}</Text>}
                <View><BlockType data={block.content} type={block.type}  /></View>
            </View>
        </View>
    );
}
