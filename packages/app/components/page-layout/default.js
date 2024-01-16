import { ScrollView, View } from 'app/design/view';
import { getPageWidth } from 'app/lib/util'
import { appStatic } from 'app/lib/app-static'
import { Platform } from 'react-native'

export default function PageLayout(props) {

    const isWeb = Platform.OS == 'web';
    return (
        <>
        <ScrollView className={ getPageWidth(props.uri) + '  mx-auto w-full '}>
            <View className='my-2 w-full'>
                {props.children}
            </View>
        </ScrollView>
         {props?.data?.empty !== true && isWeb && appStatic('components_fullfooter', '')}
         </>
    )
}
