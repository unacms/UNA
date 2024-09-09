import { View } from 'app/design/view'

export default function ({margin = '', border = 'border-none', rounded = 'rounded-2xl', addClassName = '', children}) {
    return (
        <View className={`${addClassName} ${margin} ${rounded} ${border} shadow group overflow-hidden bg-bgrcard dark:bg-bgrcard-d`}>
            {children}
        </View>
    )
}
