import { BlockDataByName } from 'app/lib/util';
import { appStatic } from 'app/lib/app-static';
import { BlockWrapper } from 'app/components/block-wrapper'
import { Text } from 'app/design/typography'
import { useMemo } from "react";
import { getComponent } from 'app/components/registry';
import { View } from 'app/design/view'

export function BlockByName2({ b, name, contentOnly }) {
    const blockNameString = (typeof name === 'string') ? name : name?.name;
    let c = Block({ uri: '', block: b, contentOnly: contentOnly, showTitle: name.showTitle, showPad: name.showPad, showBg: name.showBg, extraProps: { ...name, source: blockNameString }, sidebar: name.sidebar, showTitleInside: name.showTitleInside })
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
                return <StaticBlock {...name} {...rest} />;
            } else {
                // If name is a string (e.g., "static:foo"), pass it as 'name' prop, and spread rest
                return <StaticBlock name={blockNameString} {...rest} />;
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

export function BlockByData(props) {
    let { data, name, contentOnly, uri, url, ...rest } = props;
    const blockNameString = (typeof name === 'string') ? name : name?.name;

    if (data) {
        return <Block
            exProps={name?.exProps}
            extraProps={{ ...(name?.exProps || name), source: blockNameString }}
            key={data.id}
            uri={uri}
            url={url}
            block={data}
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
        if (!data || !data.elements || typeof data.elements !== 'object') {
            b = null;
        } else {
            Object.keys(data.elements).forEach(key => {
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

export function StaticBlock({ name, showBg, showTitle, showPadding, title }) {
    const block = { designbox_id: 0, id: name, title: title };
    return (
        <BlockWrapper block={block} showBg={showBg} showTitle={showTitle} showPadding={showPadding}>
            {appStatic('components_' + name.replace('static:', ''))}
        </BlockWrapper>
    );
}

export default function Block(props) {
    const block = props.block;

    const { name: extraPropsName, key, ...extraPropsRest } = props?.extraProps ?? {};
    const staticBlock = StaticBlock_(extraPropsName, extraPropsRest)
    if (staticBlock) {
        return staticBlock
    }
    const config = block.config_api || {}

    const blockWrapperProps = {
        config,
        block,
        contentOnly: props.contentOnly,
        showBg: props.showBg,
        showPad: props.showPad,
        showTitle: props.showTitle,
        fullWidth: props.fullWidth,
        extraProps: props.extraProps,
        list: props.list,
        showPadding: props.showPadding,
    };

    return <BlockContent blockWrapperProps={blockWrapperProps} data={block.content} type={block.type} {...props} {...config} />
}

export function BlockContent(props) {
    const items = Array.isArray(props.data) ? props.data : [props.data];
    const content = items.map(a => (
        <Element
            key={a.id + a.type}
            type={a.type}
            {...props}
            {...a}
        />
    ));

    if (items.length > 1) {
        return <View className="gap-y-4">{content}</View>;
    }

    return content;
}

const FallbackComponent = (props) => (
    <Text>
        Undefined element type ({props?.content_type || props?.type}): {JSON.stringify(props)}
    </Text>
);

function Element(a) {
    const ElementType = useMemo(
        () => getComponent('element', a.content_type || a.type) || FallbackComponent,
        [a.type, a.content_type]
    );

    return <ElementType type={a.type} {...a} />
}

export function BlockByDataInt(props) {
    return <BlockContent onFormEmpty={props.onFormEmpty} data={props.block.content} type={props.block.type} {...props} />
}

