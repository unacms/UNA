import { View, ScrollView } from 'app/design/view';
import { getPageWidth } from 'app/lib/util'
import ScrollList from 'app/ui/molecules/scroll_list'
import { useRef } from 'react';
import MenuFooter from 'app/components/nav/menu-footer';

export default function PageLayout(props) {
    const refer = useRef();
    const content = (
        <ScrollView ref={refer} className={getPageWidth(props.uri, props.data.config) + ' mx-auto w-full '} keyboardShouldPersistTaps="always" keyboardDismissMode="on-drag">
            <View className='p-[12px] sm:p-[16px]  web:duration-300 w-full '>
                {props.children}
            </View>
            <MenuFooter cntClasses="w-full flex-row flex-wrap opacity-80 h-[64px] items-center justify-center"/>
        </ScrollView>
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
