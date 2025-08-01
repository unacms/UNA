import { View } from 'app/design/view';
import { Text } from 'app/design/typography';
import { memo } from 'react';
import Unit from 'app/components/unit';
import { BlockByName2 } from 'app/components/block'
import { cd } from 'app/lib/util'

function ItemRenderer_({ route, numColumns, item, unit, module, unitMode, unitType, sidebar }) {
    if (item?.type === 'block') {
        return <BlockItemRenderer1 item={item} route={route} sidebar={sidebar} />;
    } else {
        return (
            <View key={`${route?.index}-${item.id}`}>
                <Unit unitType={unitType} module={module} unit={unit} data={item} mode={unitMode} />
            </View>
        );
    }
}



function BlockItemRenderer1({ route, numColumns, item, unit, module, unitMode, unitType, sidebar }) {
    const block = BlockByName2({ b: item.data, name: item.block, contentOnly:item.data.source == "system:get_create_post_form" });
    if (!block) {
        return <View className='h-px'><Text>&nbsp;</Text></View>;
    }
    return (
        <View className={`${block?.props?.extraProps?.list && !sidebar ? 'lg:h-px overflow-hidden ' : ''}  ${!sidebar ? cd('mb-md') : ''}`} key={`${route.index}-${item.id}`}>
            {block}
        </View>
    );
}
export const ItemRenderer = memo(ItemRenderer_);
export const ItemRendererMemo = memo(ItemRenderer);