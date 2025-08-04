import { View } from 'app/design/view';
import { getPageWidth } from 'app/lib/util'
import ScrollList from 'app/ui/molecules/scroll_list'
import { useRef } from 'react';
import MenuFooter from 'app/components/nav/menu-footer';
import Animated from 'react-native-reanimated';
import { appStatic } from 'app/lib/app-static'

export default function PageLayout(props) {

    const refer = useRef();
    const content = (
        <Animated.ScrollView ref={refer} className={getPageWidth(props.uri, props.data?.config) + ' mx-auto w-full '} keyboardShouldPersistTaps="always" keyboardDismissMode="on-drag">
            <View className='p-3 sm:p-4  web:duration-300 w-full '>
               {appStatic('components_pricing')}
            </View>
            <MenuFooter cntClasses="w-full flex-row flex-wrap opacity-80 h-16 items-center justify-center"/>
        </Animated.ScrollView>
    );

    return (
        <ScrollList 
            refer={refer}
            content = {content}
            pageData = {props.data}
            contentType="ScrollView"
        />
    )
}
