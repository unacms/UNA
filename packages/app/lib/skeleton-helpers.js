import { View } from 'app/design/view'
import { getComponent } from 'app/components/registry';

const items = Array(5).fill('');

export function getSkeletonForList(name, num = 5, isFirst = true) {
    if (Array.isArray(name)){
        if (name.includes('feed'))
            name = 'feed';
        else
            name = name.join('_');
    }

    const Item =  getComponent('skeleton', name) || getComponent('skeleton', 'default');

    const trimmed = isFirst ? items : items.slice(0, 2);

    return (
        <View>
            {trimmed.map((item, index) => (
                <View key={'browse_item' + index} className="flex-row w-full animate-pulse max-w-screen-xl mx-auto overflow-hidden">
                    {[...Array(num)].map((_, i) => <Item key={i} />)}
                </View>
            ))}
        </View>
    )
}
