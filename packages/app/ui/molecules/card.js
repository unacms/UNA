import { View } from 'app/design/view'
import { appSetting } from 'app/lib/util';

const settings = appSetting('theme', 'card');

export default function Card ({margin = settings.border, border = settings.border, rounded = settings.rounded, addClassName = '', children}) {
    return (
        <View className={`${addClassName} ${margin} ${rounded} ${border} ${settings.default}`}>
            {children}
        </View>
    )
}
