import { BlockDataByName } from 'app/lib/util'
import Messenger from 'app/components/elements/messenger';
import { View, ScrollView } from 'app/design/view';
import { getPageWidth } from 'app/lib/util'
import ScrollList from 'app/ui/molecules/scroll_list'
import { useRef } from 'react';
import MenuFooter from 'app/components/nav/menu-footer';
import Cell from 'app/components/cell';

export default function PageLayout(props) {
    const data = BlockDataByName(props.data, 'bx_messenger:get_main_messenger_page');
    const refer = useRef();
    if (data?.content[0]?.data)
        return <Messenger data={data.content[0].data} url={props.url} />
    else {
        const cells = Object.keys(props.data.elements).map((key) => (
            <Cell key={key} uri={props.data?.uri} url={props.data.url} blocks={props.data.elements[key]} />
        ));
        const content = <ScrollView ref={refer} className={getPageWidth(props.uri, props.data?.config) + ' mx-auto w-full '} keyboardShouldPersistTaps="always" keyboardDismissMode="on-drag">
                <View className='p-3 sm:p-4  web:duration-300 w-full '>
                    {cells}
                </View>
                <MenuFooter
                            cntClasses="flex w-full items-center border-t border-border/60 justify-center flex-row flex-wrap gap-2 p-3 mt-3"
                            variant="ghost"
                            size="sm"
                            itemClassName="text-sm p-1"
                            
                        />
            </ScrollView>
        return <ScrollList
            refer={refer}
            content={content}
            pageData={props.data}
            contentType="ScrollView"
        />
    }
}
