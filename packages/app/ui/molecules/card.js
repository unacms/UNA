import { View } from 'app/design/view'

export default function ({margin = '', border = ' border-white dark:border-white/5 ', rounded = 'rounded-2xl', addClassName = '', children}) {
    return (
        <View className={`${addClassName} ${margin} ${rounded} ${border} shadow-sm overflow-hidden bg-bgrcard dark:bg-bgrcard-d backdrop-blur-xl `}>
            {children}
        </View>
    )
}
