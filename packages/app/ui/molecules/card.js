import { View } from 'app/design/view'

export default function ({margin = '', border = 'border border-bdrcard dark:border-bdrcard-d', rounded = 'rounded-2xl', addClassName = '', children}) {
    return (
        <View className={`${addClassName} ${margin} ${rounded} ${border} shadow-sm overflow-hidden bg-bgrcard dark:bg-bgrcard-d`}>
            {children}
        </View>
    )
}
