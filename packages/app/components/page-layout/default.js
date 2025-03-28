import { ScrollView, View } from 'app/design/view';
import { getPageWidth } from 'app/lib/util'
import ScrollList from 'app/ui/molecules/scroll_list'
import Animated from 'react-native-reanimated';

export default function PageLayout(props) {
    const content = (
        <Animated.ScrollView className={getPageWidth(props.uri, props.data.config) + '  mx-auto w-full '} keyboardShouldPersistTaps="always" keyboardDismissMode="on-drag">
            <View className='py-2 w-full lg:px-4 lg:py-4'>
                {props.children}
            </View>
        </Animated.ScrollView>
    );

    return (
        <ScrollList 
            content = {content}
            pageData = {props.data}
            headerHeight = {64}
            contentType="ScrollList"
        />
    )
}
