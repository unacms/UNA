import { View } from 'app/design/view'

export default function ({margin = '', border = ' border border-white/80 dark:border-white/5 ', rounded = 'rounded-2xl', addClassName = '', children}) {
    return (
        <View className={`${addClassName} ${margin} ${rounded} ${border} shadow-xs dark:shadow-xsd overflow-hidden bg-bgrcard dark:bg-bgrcard-d`}>
            {children}
        </View>
    )
}
