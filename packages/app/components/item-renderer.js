import { View } from 'app/design/view';
import { memo } from 'react';
import Unit from 'app/components/unit';
import { BlockByName2 } from 'app/components/block'
import { isTasksHomeUri } from 'app/components/elements/tasks/helpers'

function isTasksListBlock(item) {
    const content = item?.data?.content;
    if (Array.isArray(content) && content.some((entry) => entry?.type === 'tasks_list')) {
        return true;
    }
    if (item?.data?.type === 'tasks_list') return true;
    const name = typeof item?.block === 'string' ? item.block : item?.block?.name;
    return typeof name === 'string' && name.includes('tasks_list');
}

/** `routeIndex`: unit rows get it instead of `route` (see useListScene). */
function ItemRenderer_({ route, routeIndex, item, unit, module, unitMode, unitType, sidebar }) {
    if (item?.type === 'block') {
        return <BlockItemRenderer item={item} route={route} sidebar={sidebar} />;
    } else {
        return (
            <View key={`${routeIndex ?? route?.index}-${item.id}`}>
                <Unit unitType={unitType} module={module} unit={unit} data={item} mode={unitMode} />
            </View>
        );
    }
}

export function BlockItemRenderer({ route, item, sidebar }) {
    const isTasksList = isTasksListBlock(item);
    const fillViewport = isTasksList && (
        isTasksHomeUri(route?.pageData?.uri) || isTasksHomeUri(route?.key) || isTasksHomeUri(route?.link)
    );
    const maxWidthClass = isTasksList ? '' : 'u-max-width-block';
    const block = BlockByName2({ 
        b: item.data, 
        name: item.block, 
        contentOnly:item?.data?.source == "system:get_create_post_form",
        fill: fillViewport,
        extraProps: {
            pageTitle: route?.title,
            pageContext: route?.pageData?.context,
        },
        wrapperClassses: `${item?.block?.classes || ''} ${fillViewport ? 'h-full min-h-0 mb-0' : 'mb-0.5 sm:mb-3 lg:mb-4'} w-full mx-auto ${maxWidthClass}`.trim()
    }
    );
    if (!block) {
        return null;
    }
    return block
}

export const ItemRenderer = memo(ItemRenderer_);
export const ItemRendererMemo = memo(ItemRenderer);