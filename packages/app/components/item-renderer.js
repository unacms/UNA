import { View } from 'app/design/view';
import { Text } from 'app/design/typography';
import { memo } from 'react';
import Unit from 'app/components/unit';
import BlockItemRenderer from 'app/components/block-item-renderer';

function ItemRenderer_({ route, numColumns, item, unit, module, unitMode, unitType, sidebar }) {
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

// Set displayName for debugging
ItemRenderer_.displayName = 'ItemRenderer_';

// AVOID BLINKING
export const ItemRenderer = memo(ItemRenderer_);
export const ItemRendererMemo = memo(ItemRenderer);

// Set displayNames for memoized components
ItemRenderer.displayName = 'ItemRenderer';
ItemRendererMemo.displayName = 'ItemRendererMemo'; 