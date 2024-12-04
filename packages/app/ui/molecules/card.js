import { View } from 'app/design/view'
import { appSetting } from 'app/lib/util';

const settings = appSetting('theme', 'card');

export default function Card ({margin = '', border = ' border-bdrcard dark:border-bdrcard-d ', rounded = 'rounded-2xl', addClassName = '', children}) {
    return (
        <View className={`${addClassName} ${margin} ${rounded} ${border} ${settings.default}`}>
            {children}
        </View>
    )
}
