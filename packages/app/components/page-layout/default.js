import { View } from 'app/design/view';
import { getPageWidth } from 'app/lib/util'
import ScrollList from 'app/ui/molecules/scroll_list'
import { useRef } from 'react';
import MenuFooter from 'app/components/nav/menu-footer';
import Animated from 'react-native-reanimated';



export default function PageLayout(props) {
    const refer = useRef();
    const content = (
        <Animated.ScrollView ref={refer} className={getPageWidth(props.uri, props.data?.config) + ' mx-auto w-full'} keyboardShouldPersistTaps="always" keyboardDismissMode="on-drag">
            <View className='sm:p-4 web:duration-300 w-full'>
                {props.children}
            </View>
           
            <MenuFooter
                            cntClasses="flex w-full items-center border-t border-border/60 justify-center flex-row flex-wrap gap-2 p-3 mt-3"
                            variant="ghost"
                            size="sm"
                            itemClassName="text-sm p-1"
                            
                        />
                        
              
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
