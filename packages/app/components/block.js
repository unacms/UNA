import String from './blocks-content/string';
import ObjectDataObject from './blocks-content/object-data-object';
import ObjectDataArray from './blocks-content/object-data-array';
import { View } from 'app/design/view'
import { Text, H2 } from 'app/design/typography'
import { stripTags, appSetting, BlockDataByName } from 'app/lib/util';
import { appStatic } from 'app/lib/app-static';
import Card from 'app/ui/molecules/card'

const componentsMap = {
    object: ObjectDataObject,
    array: ObjectDataArray,
    string: String,
};

export function BlockByName(props) {
    let { data, name, ...rest } = props

    let b = null;
    if (name) {

        if (name.name?.includes('static')) {
            return <StaticBlock  {...name} />;
        }
        const blockName = name?.name;
        Object.keys(data?.elements).forEach(key => {
            Object.keys(data.elements[key]).forEach(key2 => {
                if (data.elements[key][key2].content) {
                    Object.keys(data.elements[key][key2].content).forEach(key3 => {
                        if (data.elements[key][key2].source == blockName.toString())
                            b = data.elements[key][key2];
                    });
                }
            });
        });
    }
    if (b)
        return <Block exProps={name.exProps} key={b.id} uri={data.uri} url={data.url} block={b} showTitle={name.showTitle} fullWidth={name.fullWidth} showPad={name.showPad} showBg={name.showBg} unitType={name.unitType} {...rest} />;
}

export function BlockByServiceName(props) {
    let { data, name, ...rest } = props
    let b = null;
    if (name) {
        Object.keys(data?.elements).forEach(key => {
            Object.keys(data.elements[key]).forEach(key2 => {
                if (data.elements[key][key2].content) {
                    Object.keys(data.elements[key][key2].content).forEach(key3 => {
                        if (data.elements[key][key2].source == name.toString())
                            b = data.elements[key][key2];
                    });
                }
            });
        });
    }
    if (b)
        return <Block exProps={name.exProps} key={b.id} uri={data.uri} url={data.url} block={b} showTitle={name.showTitle} fullWidth={name.fullWidth} showPad={name.showPad} showBg={name.showBg} unitType={name.unitType} {...rest} />;
}

export function DataByName(data, name) {

    let b = null;
    if (name) {
        const blockName = name?.name;
        return BlockDataByName(data, blockName)
    }
    return b;
}

export function BlockByName2({ b, name }) {
    let c = Block({ uri: '', block: b, showTitle: name.showTitle, showPad: name.showPad, showBg: name.showBg, extraProps: name, sidebar: name.sidebar })
    return c;
}

export function StaticBlock(props) {
    let block = { designbox_id: 0, id: props.name };

    return (
        <BlockWrapper block={block} showBg={props.showBg} showTitle={props.showTitle}>
            {appStatic('components_' + props.name.replace('static:', ''))}
        </BlockWrapper>
    );

}

export default function Block(props) {
    let block = props.block;

    const type = block.content && Array.isArray(block.content) ? 'array' : typeof block.content;
    const BlockType = componentsMap[type];
    if (type == 'string' && !['html', 'raw', 'lang'].includes(block.type))
        return null;

    return (
        <BlockWrapper block={block} showBg={props.showBg} showPad={props.showPad} showTitle={props.showTitle} fullWidth={props.fullWidth} extraProps={props.extraProps}>
            <BlockType data={block.content} type={block.type} {...props} />
        </BlockWrapper>
    );
}

export function BlockWrapper(props) {
    let { block, showTitle, showBg, fullWidth, showPad, ...rest } = props
    block.designbox_id = Number(block.designbox_id);
    const aNoTitle = [0, 10, 13, 3];
    const aNoBg = [0, 10, 14, 4];
    let bIsShowTitle = false;
    if (aNoTitle.indexOf(block.designbox_id) != -1) {
        bIsShowTitle = false;
    }

    let bIsShowBg = true;
    if (aNoBg.indexOf(block.designbox_id) != -1) {
        bIsShowBg = false;
    }

    if (typeof showBg !== 'undefined') {
        bIsShowBg = showBg;
    }
    if (typeof showTitle !== 'undefined') {
        bIsShowTitle = showTitle;
    }

    let bIsShowPad = false;
    if (typeof showPad !== 'undefined') {
        bIsShowPad = showPad;
    }

    /*if (bIsShowTitle){
        bIsShowBg = true;
    }*/

    let cssClasses = rest?.extraProps?.cssClasses ? rest?.extraProps?.cssClasses : "";
    let cnt = <>{bIsShowTitle && <View>
        <Text className="pb-4 text-xl font-bold text-neutral-800 dark:text-neutral-200 ">{stripTags(block.title)}</Text>
    </View>
    }
        <View>{props.children}</View></>
    return (
        <View key={block.id} className={" block w-full mx-auto " + (!fullWidth && !cssClasses.includes("max-w-") ? (appSetting('layout', 'max_width_block')) : "") + (bIsShowPad ? ' mb-4 ' : '') + cssClasses}>
            {bIsShowBg ? (<Card rounded=' rounded-none lg:rounded-2xl shadow-[0_2px_4px_0_rgba(0,0,0,0.05),0_0px_2px_0_rgba(0,0,0,0.1)]  ' border=" " addClassName=" p-4 ">{cnt}</Card>) : <View className="  " >{cnt}</View>}
        </View>
    );
}
