import { ScrollView, View } from 'app/design/view';
import { getPageWidth } from 'app/lib/util'
import { appStatic } from 'app/lib/app-static'
import { Platform } from 'react-native'

export default function PageLayout(props) {
    return (
        <View className={getPageWidth(props.uri) + '  mx-auto w-full '}>
            {props.children}
        </View>
    )
}
