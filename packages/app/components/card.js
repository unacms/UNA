import { View } from 'app/design/view'
import { appSetting } from 'app/lib/util'

const themeSettings = appSetting('theme', 'card');

export default function (props) {
   
    const { margin = ' p-[24px] ', rounded = ' rounded-[24px] border-bdrcard dark:border-bdrcard-d shadow-sm ' } = props || {};

    return (
        <View className={`${props.addClassName || ''} ${themeSettings.default} ${margin} ${rounded}`.trim()} >
            {props.children}
        </View>
    )
}

