import { View } from 'app/design/view'
import { getComponent } from 'app/components/registry';
import { appSetting } from 'app/lib/util';

const items = Array(5).fill('');

export function getSkeletonForList(name, num = 5, isFirst = true, layout, renderItem, paddings) {


    const trimmed = isFirst ? items : items.slice(0, 2);
    const skeletonCount = Math.max(0, trimmed.length * num);
    const listClassName = 'u-max-width-block w-full mx-auto flex flex-wrap flex-row animate-pulse';

    if (appSetting('browse', 'new_skeletons') && typeof renderItem === 'function') {
        if (Array.isArray(name)) {
            if (name.includes('feed'))
                name = 'feed';
            else
                name = name[1];
        }
      
        const list = appSetting('browse', 'skeletons')
        const module = list[name] || name;

        return (
            <View className='@container/list'>
                <View className={paddings || ''}>
                    <View className={listClassName}>
                        {[...Array(skeletonCount)].map((_, index) => (
                            <View key={'browse_item' + index} className={layout || 'w-full'}>
                                {renderItem({ item: { module: module, skeleton: true }, index })}
                            </View>
                        ))}
                    </View>
                </View>
            </View>
        )
    }
    if (Array.isArray(name)) {
        if (name.includes('feed'))
            name = 'feed';
        else
            name = name.join('_');
    }
    const Item = getComponent('skeleton', name) || getComponent('skeleton', 'default');
    return (
        <View className='@container/list'>
            <View className={listClassName}>
                {[...Array(skeletonCount)].map((_, index) => (
                    <View key={'browse_item' + index} className={layout || 'w-full'}>
                        <Item />
                    </View>
                ))}
            </View>
        </View>
    )
}
