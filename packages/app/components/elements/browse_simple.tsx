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
    data: {
        unit?: string;
        module?: string;
        object_id?: string | number;
        view?: string;
        data: any[];
    };
    limit_by?: number;
    view?: BrowseSimpleViewType;
    autoscroll?: boolean;
    blockWrapperProps?: any;
}

export default function Browse({ unitMode, data, limit_by, view, autoscroll, blockWrapperProps }: BrowseProps) {
    const unitType = data.unit === 'mixed' ? 'general-profile-list' : (data.unit || '');
    const layout = layoutForList(data.module, unitMode);
    const limitedData = limit_by ? data.data.slice(0, limit_by) : data.data;

    const items = limitedData.map((item, index) => {
        const unitProps = {
            unit: unitType,
            mode: unitMode,
            module: data.module || '',
            object_id: data.object_id || '',
            view: data.view || '',
            data: item
        };

        const unitElement = <Unit key={`item${index}`} {...unitProps} />;

        return view === BrowseSimpleView.Row ? (
            <View key={`wrapper${index}`} className={layout || 'w-full'}>
                {unitElement}
            </View>
        ) : unitElement;
    })

    const content =
        view === BrowseSimpleView.Galery ? (
            <Galery autoscroll={autoscroll} items={items} />
        ) : view === BrowseSimpleView.Row ? (
            <Row className="@container/list overflow-hidden">{items}</Row>
        ) : (
            items
        )
    return <BlockWrapper {...blockWrapperProps}>{content}</BlockWrapper>

}
