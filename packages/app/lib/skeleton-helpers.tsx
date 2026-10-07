import { View } from 'app/design/view'
import { components } from 'app/components/registry';
import { appSetting } from 'app/lib/util';

const LIST_CLASS = 'u-max-width-block w-full mx-auto flex flex-wrap flex-row animate-pulse'

function skeletonCountFor(num: number, isFirst: boolean) {
    // First page: 5 * num. Footer / next-page: 2 * num. num=0 → none.
    return Math.max(0, (isFirst ? 5 : 2) * num)
}

function getSkeletonModuleName(name: string) {
    const map = appSetting('browse', 'skeletons') || {}
    let key = name
    if (Array.isArray(name)) {
        if (name.includes('feed')) {
            key = 'feed'
        } else {
            const [base, unitKey] = name
            key = (unitKey && map[unitKey]) || base || unitKey
        }
    }
    return map[key] || key
}

function getlegacySkeletonName(name: string) {
    if (!Array.isArray(name)) return name
    if (name.includes('feed')) return 'feed'
    return name.join('_')
}

export function getSkeletonForList(name: string, num = 5, isFirst = true, layout: any, renderItem: any, paddings: any) {
    const skeletonCount = skeletonCountFor(num, isFirst)
    const slots = Array.from({ length: skeletonCount }, (_, index) => index)

    if (appSetting('browse', 'new_skeletons') && typeof renderItem === 'function') {
        const module = getSkeletonModuleName(name)

        return (
            <View className='@container/list'>
                <View className={paddings || ''}>
                    <View className={LIST_CLASS}>
                        {slots.map((index) => (
                            <View key={'browse_item' + index} className={layout || 'w-full'}>
                                {renderItem({ item: { module: module, skeleton: true }, index })}
                            </View>
                        ))}
                    </View>
                </View>
            </View>
        )
    }

    const Item = (components as any)['skeleton'][getlegacySkeletonName(name)] || (components as any)['skeleton']['default'];
    return (
        <View className='@container/list'>
            <View className={LIST_CLASS}>
                {slots.map((index) => (
                    <View key={'browse_item' + index} className={layout || 'w-full'}>
                        <Item />
                    </View>
                ))}
            </View>
        </View>
    )
}
