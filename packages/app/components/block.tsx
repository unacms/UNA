import type { ComponentType, ReactNode } from 'react';
import { useMemo } from 'react';
import { BlockDataByName, findElementBySource, hasNonEmptyContent } from 'app/lib/util';
import type { PageData, PageElement } from 'app/lib/util/page-data';
import { appStatic } from 'app/lib/app-static';
import { BlockWrapper as BlockWrapperJs } from 'app/components/block-wrapper'
import { Text } from 'app/design/typography'
import { components } from 'app/components/registry';
import { View } from 'app/design/view'

// JS modules: every destructured prop is inferred as required / registry as {}.
const BlockWrapper = BlockWrapperJs as ComponentType<Record<string, any>>;
const elementRegistry = components as Record<string, Record<string, any> | undefined>;

/**
 * Block options as they come from layout settings / page layouts: a bare
 * source (`"system:foo"`, `"static:bar"`) or an object with `name` + flags.
 */
type BlockName = string | ({ name?: string; exProps?: Record<string, any>; [key: string]: any });

type BlockProps = {
    block: PageElement;
    uri?: string;
    url?: string;
    extraProps?: Record<string, any>;
    exProps?: Record<string, any>;
    contentOnly?: boolean;
    showTitle?: boolean;
    showTitleInside?: boolean;
    showPad?: boolean;
    showPadding?: boolean;
    showBg?: boolean;
    fullWidth?: boolean;
    unitType?: string;
    sidebar?: boolean;
    list?: any;
    fill?: boolean;
    wrapperClassses?: string;
    [key: string]: any;
};

/**
 * What a registry element (`components['element'][type]`) receives from BlockContent.
 * Merge order: block props → `config_api` → the content item's own fields
 * (so `data` is `item.data`, never the page). Page JSON itself is not passed —
 * only `uri` / `url`.
 *
 * Deliberately open: callers add props through `BlockByName` rest, layouts pass
 * `item.block.props` from settings, `config_api` comes from UNA, and forks
 * register their own elements — so the block props are spread, not whitelisted.
 * Listed keys are the ones core elements read (audited 2026-09-30).
 */
export type ElementProps = {
    // content item
    id?: string | number;
    type?: string;
    content_type?: string;
    data?: any;
    // block
    blockWrapperProps: Record<string, any>;
    block: PageElement;
    uri?: string;
    url?: string;
    exProps?: Record<string, any>;
    extraProps?: Record<string, any>;
    unitType?: string;
    sidebar?: boolean;
    showBg?: boolean;
    showPad?: boolean;
    showTitleInside?: boolean;
    onFormEmpty?: () => void;
    [key: string]: any;
};

const nameOf = (name: BlockName | null | undefined): string | undefined =>
    typeof name === 'string' ? name : name?.name;

/**
 * `static:<name>` block names render the static component `components_<name>` (see appStatic)
 * instead of a page element. They come from block lists in settings or page config, e.g. a
 * page's `blocks` setting (see getPageSettings).
 */
function staticBlockFor(name: BlockName | null | undefined, rest: Record<string, any>): ReactNode | null {
    const source = nameOf(name);
    if (!source?.includes('static')) return null;
    return typeof name === 'object'
        ? <StaticBlock {...name} {...rest} />
        : <StaticBlock name={source} {...rest} />;
}

function StaticBlock({ name, showBg, showTitle, showPadding, title, wrapperClassses }: Record<string, any>) {
    const block = { designbox_id: 0, id: name, title: title };
    return (
        <BlockWrapper block={block} showBg={showBg} showTitle={showTitle} showPadding={showPadding} wrapperClassses={wrapperClassses}>
            {appStatic('components_' + name.replace('static:', ''), undefined)}
        </BlockWrapper>
    );
}

/** Props derived from a `BlockName` object, shared by BlockByName / BlockByData. */
function optionsFromName(name: BlockName | null | undefined, contentOnly?: boolean) {
    const opts = typeof name === 'object' && name ? name : {};
    return {
        exProps: opts.exProps,
        extraProps: { ...(opts.exProps || opts), source: nameOf(name) },
        showTitle: opts.showTitle,
        fullWidth: opts.fullWidth,
        contentOnly: contentOnly || opts.contentOnly,
        showPad: opts.showPad,
        showPadding: opts.showPadding,
        showBg: opts.showBg,
        unitType: opts.unitType,
    };
}

export function BlockByName2({ b, name, contentOnly, wrapperClassses = "", fill, extraProps }: {
    b: PageElement; name: BlockName; contentOnly?: boolean; wrapperClassses?: string; fill?: boolean; extraProps?: Record<string, any>;
}) {
    const source = nameOf(name);
    if (!source) return null;
    const opts = typeof name === 'object' ? name : undefined;

    return (
        <Block
            uri=""
            wrapperClassses={wrapperClassses}
            fill={fill}
            block={b}
            contentOnly={contentOnly}
            showTitle={opts?.showTitle}
            showPad={opts?.showPad}
            showBg={opts?.showBg}
            extraProps={{ ...opts, source, ...extraProps }}
            sidebar={opts?.sidebar}
            showTitleInside={opts?.showTitleInside}
        />
    );
}

export function BlockByName(props: { data?: PageData | null; name?: BlockName; contentOnly?: boolean; [key: string]: any }) {
    const { data, name, contentOnly, ...rest } = props;
    if (!name) return null;

    const staticBlock = staticBlockFor(name, rest);
    if (staticBlock) return staticBlock;

    const b = findElementBySource(data, nameOf(name), hasNonEmptyContent);
    if (!b) return null;

    return <Block key={b.id} uri={data?.uri} url={data?.url} block={b} {...optionsFromName(name, contentOnly)} {...rest} />;
}

export function BlockByData(props: { data?: PageElement | null; name?: BlockName; contentOnly?: boolean; uri?: string; url?: string; [key: string]: any }) {
    const { data, name, contentOnly, uri, url, ...rest } = props;
    if (!data) return null;

    return <Block key={data.id} uri={uri} url={url} block={data} {...optionsFromName(name, contentOnly)} {...rest} />;
}

export function DataByName(data: PageData | null | undefined, name: BlockName | null | undefined) {
    if (!name) return null;
    return BlockDataByName(data, typeof name === 'object' ? name?.name : undefined);
}

export default function Block(props: BlockProps) {
    const block = props.block;

    const { name: extraPropsName, key, ...extraPropsRest } = props?.extraProps ?? {};
    const staticBlock = staticBlockFor(extraPropsName, { ...extraPropsRest, wrapperClassses: props.wrapperClassses });
    if (staticBlock) return staticBlock;

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
        wrapperClassses: props.wrapperClassses,
        fill: props.fill,
    };

    return (
        <BlockContent
            blockWrapperProps={blockWrapperProps}
            data={block.content}
            type={block.type}
            {...props}
            {...config}
        />
    );
}

export function BlockContent(props: { data: any; [key: string]: any }) {
    const items: any[] = Array.isArray(props.data) ? props.data : [props.data];

    const itemsToRender = items.filter((item) => {
        const ElementType = elementRegistry['element']?.[item.content_type || item.type];
        if (ElementType && typeof ElementType.checkEmpty === 'function') {
            return ElementType.checkEmpty(item);
        }
        return true;
    });

    if (itemsToRender.length === 0) return null;

    // Block props are spread on purpose — see ElementProps for why and what's in there.
    const content = itemsToRender.map((a) => (
        <Element
            key={a.id + a.type}
            type={a.type}
            {...props}
            {...a}
        />
    ));

    if (itemsToRender.length > 1) {
        return <View className="gap-0.5">{content}</View>;
    }

    return content;
}

const FallbackComponent = (props: Record<string, any>) => (
    <Text>
        Undefined element type ({props?.content_type || props?.type}): {JSON.stringify(props)}
    </Text>
);

function Element(a: ElementProps) {
    const ElementType = useMemo(
        () => elementRegistry['element']?.[a.content_type || a.type || ''] || FallbackComponent,
        [a.type, a.content_type]
    );

    return <ElementType type={a.type} {...a} />
}

export function BlockByDataInt(props: { block: PageElement; onFormEmpty?: () => void; [key: string]: any }) {
    return <BlockContent onFormEmpty={props.onFormEmpty} data={props.block.content} type={props.block.type} {...props} />
}
