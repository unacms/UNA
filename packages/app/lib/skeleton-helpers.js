import { View, ScrollView, Row } from 'app/design/view'
import { appSetting } from 'app/lib/util'
import Card from 'app/ui/molecules/card'
import { Platform } from 'react-native'
import { Text } from 'app/design/typography';
import { memo } from 'react'
import {skeletonsMap} from 'app/components/skeletons/_map'
const items = Array(5).fill('');


export function getSkeletonForList(name, num = 5) {
    console.log(name)
    if (Array.isArray(name)){
        if (name.includes('feed'))
            name = 'feed';
        else
            name = name.join('_');
    }

    const Item = skeletonsMap[name] || skeletonsMap['default'];

    return (
        <View>
            {items.map((item, index) => (
                <View key={'browse_item' + index} className="flex-row w-full animate-pulse max-w-screen-xl mx-auto">
                    {[...Array(num)].map((_, i) => <Item key={i} />)}
                </View>
            ))}
        </View>
    )
}
