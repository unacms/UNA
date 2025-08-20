import String from './blocks-content/string';
import ObjectDataObject from './blocks-content/object-data-object';
import ObjectDataArray from './blocks-content/object-data-array';
import { BlockDataByName } from 'app/lib/util';
import { appStatic } from 'app/lib/app-static';
import { View } from 'app/design/view'
import { Text } from 'app/design/typography'
import { stripTags, appSetting } from 'app/lib/util';
import { Block as PageBlock, BlockContent, BlockList, BlockHeader, BlockTitle } from 'app/ui/molecules/page-block'


const componentsMap = {
    object: ObjectDataObject,
    array: ObjectDataArray,
    string: String,
};

export function BlockByName2({ b, name, contentOnly }) {
    const blockNameString = (typeof name === 'string') ? name : name?.name;
    let c = Block({ uri: '', block: b, contentOnly: contentOnly, showTitle: name.showTitle, showPad: name.showPad, showBg: name.showBg, extraProps: { ...name, source: blockNameString }, sidebar: name.sidebar, showTitleInside:name.showTitleInside  })
    return c;
}

export function BlockByName(props) {
    let { data, name, contentOnly, ...rest } = props;

    const blockNameString = (typeof name === 'string') ? name : name?.name;
    let b = null;

    if (name) {
        if (blockNameString?.includes('static')) {
            if (typeof name === 'object') {
                // If name is an object (e.g., { name: "static:foo", showBg: true, ... }), spread it and rest
                return <><StaticBlock {...name} {...rest} /></>;
            } else {
                // If name is a string (e.g., "static:foo"), pass it as 'name' prop, and spread rest
                return <><StaticBlock name={blockNameString} {...rest} /></>;
            }
        }

        if (data?.elements && blockNameString) {
            for (const key of Object.keys(data.elements)) {
                if (b) break;
                for (const key2 of Object.keys(data.elements[key])) {
                    if (b) break;
                    if (data.elements[key][key2].content) {
                        for (const key3 of Object.keys(data.elements[key][key2].content)) {
                            if (data.elements[key][key2].source === blockNameString) {
                                b = data.elements[key][key2];
                                break; 
                            }
                        }
                    }
                    if (b) break; // Break outer loop if found
                }
                if (b) break; // Break outermost loop if found
            }
        }
    }

    if (b) {
        return <Block 
            exProps={name?.exProps}
            extraProps={{ ...(name?.exProps || name), source: blockNameString }} 
            key={b.id} 
            uri={data.uri} 
            url={data.url} 
            block={b} 
            showTitle={name?.showTitle} 
            fullWidth={name?.fullWidth} 
            contentOnly={contentOnly || name?.contentOnly}
            showPad={name?.showPad} 
            showPadding={name?.showPadding}
            showBg={name?.showBg} 
            unitType={name?.unitType} 
            {...rest} 
        />;
    }
    
    return null; 
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
        return <Block exProps={name.exProps} extraProps={{ ...(name.exProps || {}), source: name }} key={b.id} uri={data.uri} url={data.url} block={b} showTitle={name.showTitle} fullWidth={name.fullWidth} showPad={name.showPad} showPadding={name.showPadding} showBg={name.showBg} unitType={name.unitType} {...rest} />;
}

export function DataByName(data, name) {

    let b = null;
    if (name) {
        const blockName = name?.name;
        return BlockDataByName(data, blockName)
    }
    return b;
}



function StaticBlock_(name, rest) {
    const blockNameString = (typeof name === 'string') ? name : name?.name;

    if (blockNameString?.includes('static')) {
        if (typeof name === 'object') {
            return <StaticBlock {...name} {...rest} />;
        } else {
            return <StaticBlock name={blockNameString} {...rest} />;
        }
    }
}

export function StaticBlock({name, showBg, showTitle, showPadding, title}) {
    const block = { designbox_id: 0, id: name, title:title };
    return (
        <BlockWrapper block={block} showBg={showBg} showTitle={showTitle} showPadding={showPadding}>
            {appStatic('components_' + name.replace('static:', ''))}
        </BlockWrapper>
    );
}

export function BlockWrapper(props) {
    let { block, showTitle, showBg, fullWidth, contentOnly, list, showPadding, ...rest } = props
    block.designbox_id = Number(block.designbox_id);
    const aNoTitle = [0, 10, 13, 3];
    const aNoBg = [0, 10, 14, 4];
    const aNoPad = [0, 4, 1, 5, 3];
    let bIsShowTitle = true;
    if (aNoTitle.indexOf(block.designbox_id) != -1) {
        bIsShowTitle = false;
    }

    let bIsShowBg = true;
    if (aNoBg.indexOf(block.designbox_id) != -1) {
        bIsShowBg = false;
    }

    let bIsShowPadding = true;
    if (aNoPad.indexOf(block.designbox_id) != -1) {
        bIsShowPadding = false;
    }

    if (typeof showBg !== 'undefined') {
        bIsShowBg = showBg;
    }
    if (typeof showTitle !== 'undefined') {
        bIsShowTitle = showTitle;
    }
   
    if (typeof showPadding !== 'undefined') {
        bIsShowPadding = showPadding;
    }

    let cssClasses = rest?.extraProps?.cssClasses ? rest?.extraProps?.cssClasses : "";
    // Streamlined logic: avoid unnecessary fragment, ensure BlockContent is not wrapping elements twice

    if ((props?.block?.content && props?.block?.content[0]?.type == 'browse'))//|| block.designbox_id == 0
        contentOnly = true;

    if (contentOnly)
        return props.children

    // Determine if this block should render as list based on prop, exProps, or showPadding flag
    const noPaddingRequested = bIsShowPadding === false; // JSON flag
    const useList = typeof list !== 'undefined'
        ? list
        : (rest?.extraProps?.list ? true : noPaddingRequested);

    return (
        <PageBlock
            key={block.id}
            isBg={bIsShowBg}
            isPad={bIsShowPadding}
            className={
                "w-full mx-auto" +
               
                (!fullWidth && !cssClasses.includes("max-w-") ? appSetting('layout', 'max_width_block') : "") +
                cssClasses
            }
        >
            {bIsShowTitle && (
                <BlockHeader>
                    <BlockTitle>{stripTags(block.title)}</BlockTitle>
                </BlockHeader>
            )}
            <BlockContent>
                {props.children}
            </BlockContent>
            
        </PageBlock>
    );
} 

export default function Block(props) {
    const block = props.block;

   
    const { name: extraPropsName, key,  ... extraPropsRest } = props.extraProps;
    const staticBlock = StaticBlock_(extraPropsName, extraPropsRest)
    if (staticBlock){
        return staticBlock
    }

    const type = block.content && Array.isArray(block.content) ? 'array' : typeof block.content;
    const BlockType = componentsMap[type];
    if (type == 'string' && !['html', 'raw', 'lang'].includes(block.type))
        return null;

    return (
        <BlockWrapper block={block} contentOnly={props.contentOnly} showBg={props.showBg} showPad={props.showPad} showTitle={props.showTitle} fullWidth={props.fullWidth} extraProps={props.extraProps} list={props.list} showPadding={props.showPadding}>
            <BlockType data={block.content} type={block.type} {...props} />
        </BlockWrapper>
    );
}