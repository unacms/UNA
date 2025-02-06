import { ScrollView, View } from 'app/design/view';
import { getPageWidth } from 'app/lib/util'

export default function PageLayout(props) {
    return (
        <>
            <ScrollView className={getPageWidth(props.uri, props.data.config) + '  mx-auto w-full '} keyboardShouldPersistTaps="always" keyboardDismissMode="on-drag">
                <View className='py-2 w-full lg:px-4 lg:py-4'>
                    {props.children}
                </View>
            </ScrollView>
        </>
    )
}
