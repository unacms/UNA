/**
 * Static browse renderer (`browse_simple` in elements/_map).
 *
 * Does not fetch or paginate: maps already-loaded `data.data` items to Unit
 * cards. Views: list (default), row, gallery (`BrowseSimpleView`). Optional
 * `limit_by`.
 *
 * Used as a helper by search-sections, tasks-list, tasks-timers, and UNA
 * blocks of type `browse_simple`.
 *
 * Differs from:
 * - browse.js / browse-list.js — those load pages from UNA, virtualize, and
 *   subscribe to realtime updates.
 */
// @ts-nocheck
import Unit from 'app/components/unit'
import Galery from 'app/ui/molecules/content/gallery'
import { View, Row } from 'app/design/view'
import { layoutForList } from 'app/customization/functions'
import { BlockWrapper } from 'app/components/block-wrapper'

export const BrowseSimpleView = {
    Row: 'row',
    Galery: 'galery',
    Gallery: 'gallery',
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
    const normalizedData = data && typeof data === 'object' ? data : {};
    const sourceItems = Array.isArray(normalizedData.data) ? normalizedData.data : [];
    const normalizedLimit = typeof limit_by === 'number' && limit_by > 0 ? limit_by : undefined;
    const unitType = normalizedData.unit === 'mixed' ? 'general-profile-list' : (normalizedData.unit || '');
    const layout = layoutForList(normalizedData.module, unitMode);
    const limitedData = normalizedLimit ? sourceItems.slice(0, normalizedLimit) : sourceItems;

    const items = limitedData.map((item, index) => {
        const unitProps = {
            unit: unitType,
            mode: unitMode,
            module: normalizedData.module || '',
            object_id: normalizedData.object_id || '',
            view: normalizedData.view || '',
            data: item
        };

        const unitElement = <Unit key={`item${index}`} {...unitProps} />;

        return view === BrowseSimpleView.Row ? (
            <View key={`wrapper${index}`} className={layout || 'w-full'}>
                {unitElement}
            </View>
        ) : unitElement;
    })

     if (!view && normalizedData?.params?.view){
        view = normalizedData?.params?.view;

    }
    const content =
        (view === BrowseSimpleView.Galery || view === BrowseSimpleView.Gallery) ? (
            <Galery autoscroll={autoscroll} items={items} />
        ) : view === BrowseSimpleView.Row ? (
            <Row className="@container/list -mx-2 -my-2 overflow-x-scroll">{items}</Row>
        ) : (
            <View className="w-full gap-0.5">{items}</View>
        )
    return <BlockWrapper {...blockWrapperProps}>{content}</BlockWrapper>

}
