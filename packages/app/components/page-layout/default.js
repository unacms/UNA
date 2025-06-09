import { View } from 'app/design/view';
import { getPageWidth } from 'app/lib/util'
import ScrollList from 'app/ui/molecules/scroll_list'
import Animated from 'react-native-reanimated';
import { useRef } from 'react';
import MenuFooter from 'app/components/nav/menu-footer';

export default function PageLayout(props) {
    const refer = useRef();
    const content = (
        <Animated.ScrollView ref={refer} className={getPageWidth(props.uri, props.data.config) + ' mx-auto w-full '} keyboardShouldPersistTaps="always" keyboardDismissMode="on-drag">
            <View className='p-[12px] sm:p-[16px] duration-300 w-full '>
                {props.children}
            </View>
            <MenuFooter cntClasses="w-full flex-row flex-wrap opacity-80 h-[64px] items-center justify-center"/>
        </Animated.ScrollView>
     
    );

    return (
        <ScrollList 
            refer={refer}
            content = {content}
            pageData = {props.data}

            contentType="ScrollList"
        />
        
    )
}
