import { View } from 'app/design/view';
import { Text } from 'app/design/typography';
import Html from 'app/ui/atoms/html';

// Simple block renderer that doesn't import block content components to avoid circular dependencies
function BlockItemRenderer({ item, route, sidebar }) {
    const block = item.data;
    const blockProps = item.block || {};
    
    if (!block) {
        return <View className='h-px'><Text>&nbsp;</Text></View>;
    }

    // Simple rendering without going through the complex block system
    let content = null;
    const type = block.content && Array.isArray(block.content) ? 'array' : typeof block.content;
    
    if (type === 'string' && ['html', 'raw', 'lang'].includes(block.type)) {
        content = <Html data={block.content} />;
    } else if (type === 'object') {
        content = <Text>{block.content?.content || 'BlockContentObjectDataObject'}</Text>;
    } else if (type === 'array') {
        // For array type, render a simple placeholder to avoid circular dependency
        content = <Text>Array content ({block.content?.length || 0} items)</Text>;
    } else {
        content = <Text>&nbsp;</Text>;
    }
    
    return (
        <View className={`${blockProps?.list && !sidebar ? 'lg:h-px overflow-hidden' : ''}`} key={`${route.index}-${item.id}`}>
            <View className="w-full">
                {blockProps?.showTitle && <Text className="pb-3 sm:pb-4 leading-none text-xl font-bold text-neutral-800 dark:text-neutral-200">{block.title}</Text>}
                {content}
            </View>
                 </View>
     );
}

// Set displayName for debugging
BlockItemRenderer.displayName = 'BlockItemRenderer';

export default BlockItemRenderer; 