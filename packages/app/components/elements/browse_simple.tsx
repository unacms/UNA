// @ts-nocheck
import Unit from 'app/components/unit'
import Galery from 'app/ui/molecules/gallery'
import { View, Row } from 'app/design/view'
import { layoutForList } from 'app/functions'
import { BlockWrapper } from 'app/components/block-wrapper'

export const BrowseSimpleView = {
    Row: 'row',
    Galery: 'galery',
    List: 'list'
} as const;

export type BrowseSimpleViewType = typeof BrowseSimpleView[keyof typeof BrowseSimpleView];

interface BrowseProps {
    unitMode?: string;
    // Server payloads are inconsistent here:
    // - sometimes: { unit, module, ..., data: [...] }
    // - sometimes: the array itself
    // - sometimes: missing/empty (null/undefined)
    data: any;
    // Some UNA payloads use `content` instead of `data`.
    content?: any;
    limit_by?: number;
    view?: BrowseSimpleViewType;
    autoscroll?: boolean;
    blockWrapperProps?: any;
}

function normalizeBrowseSimpleItems(input: any): any[] {
    if (Array.isArray(input)) return input;
    if (Array.isArray(input?.data)) return input.data;
    if (Array.isArray(input?.items)) return input.items;
    if (Array.isArray(input?.content?.data)) return input.content.data;
    return [];
}

export default function Browse({ unitMode, data, content, limit_by, view, autoscroll, blockWrapperProps }: BrowseProps) {
    const itemsArray = normalizeBrowseSimpleItems(data);
    const fallbackItemsArray = itemsArray.length ? itemsArray : normalizeBrowseSimpleItems(content);
    const meta = (data && !Array.isArray(data)) ? data : (content && !Array.isArray(content) ? content : data);
    const unitType =
        meta?.unit === 'mixed'
            ? 'general-profile-list'
            : (meta?.unit || '');
    const layout = layoutForList(meta?.module, unitMode);
    const limitedData = limit_by ? fallbackItemsArray.slice(0, limit_by) : fallbackItemsArray;

    if (!limitedData.length) {
        return null;
    }

    const items = limitedData.map((item, index) => {
        const unitProps = {
            unit: unitType,
            mode: unitMode,
            module: meta?.module || '',
            object_id: meta?.object_id || '',
            view: meta?.view || '',
            data: item
        };

        const unitElement = <Unit key={`item${index}`} {...unitProps} />;

        return view === BrowseSimpleView.Row ? (
            <View key={`wrapper${index}`} className={layout || 'w-full'}>
                {unitElement}
            </View>
        ) : unitElement;
    })

    const renderedContent =
        view === BrowseSimpleView.Galery ? (
            <Galery autoscroll={autoscroll} items={items} />
        ) : view === BrowseSimpleView.Row ? (
            <Row className="@container/list overflow-hidden">{items}</Row>
        ) : (
            items
        )
    return <BlockWrapper {...blockWrapperProps}>{renderedContent}</BlockWrapper>

}

// Helps BlockContent filter out empty payloads.
Browse.checkEmpty = (item: any) => {
    const maybeData = item?.data ?? item;
    return normalizeBrowseSimpleItems(maybeData).length > 0;
};
