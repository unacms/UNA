import { View } from 'app/design/view';
import { Text } from 'app/design/typography';
import { memo } from 'react';
import Unit from 'app/components/unit';
import { BlockByName2 } from 'app/components/block'

function isTasksListBlock(item) {
    const content = item?.data?.content;
    if (Array.isArray(content) && content.some((entry) => entry?.type === 'tasks_list')) {
        return true;
    }
    if (item?.data?.type === 'tasks_list') return true;
    const name = typeof item?.block === 'string' ? item.block : item?.block?.name;
    return typeof name === 'string' && name.includes('tasks_list');
}

function ItemRenderer_({ route, item, unit, module, unitMode, unitType, sidebar }) {
    if (item?.type === 'block') {
        return <BlockItemRenderer item={item} route={route} sidebar={sidebar} />;
    } else {
        return (
            <View key={`${route?.index}-${item.id}`}>
                <Unit unitType={unitType} module={module} unit={unit} data={item} mode={unitMode} />
            </View>
        );
    }
}

export function BlockItemRenderer({ route, item, sidebar }) {
    const maxWidthClass = isTasksListBlock(item) ? '' : 'u-max-width-block';
    const block = BlockByName2({ 
        b: item.data, 
        name: item.block, 
        contentOnly:item?.data?.source == "system:get_create_post_form",
        wrapperClassses: `${item?.block?.classes || ''} mb-0.5 sm:mb-3 lg:mb-4 w-full mx-auto ${maxWidthClass}`.trim()
    }
    );
    if (!block) {
        return null;
    }
    return block
}

export const ItemRenderer = memo(ItemRenderer_);
export const ItemRendererMemo = memo(ItemRenderer);