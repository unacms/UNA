import { BlockDataByName } from 'app/lib/util'
import Messenger from 'app/components/elements/messenger';
import { View } from 'app/design/view';
import MenuFooter from 'app/components/nav/menu-footer';
import Cell from 'app/components/cell';
import Page from 'app/ui/molecules/page'
import { useSetFooter } from 'app/context/jotai/layout';
import { useEffect } from 'react';

export default function PageLayout({ data }) {
    const setFooter = useSetFooter();
    const blockData = BlockDataByName(data, 'bx_messenger:get_main_messenger_page');


    useEffect(() => {
        setFooter(false);
        return () => {
            setFooter(true);
        };
    }, []);

    if (blockData?.content[0]?.data)
        return <Messenger data={blockData.content[0].data} url={data.url} />
    else {
        const cells = Object.keys(data.elements).map((key) => (
            <Cell key={key} uri={data?.uri} url={data.url} blocks={data.elements[key]} />
        ));

        return (
            <Page data={data} processKeyboard={false}>
                <View className='p-3 sm:p-4 web:duration-300 w-full'>
                    {cells}
                </View>
                <View className="flex-1" />
                <MenuFooter
                    cntClasses='flex w-full items-center border-t border-border/60 justify-center flex-row flex-wrap gap-3 p-4 min-h-14'
                />
            </Page>
        )
    }
}
