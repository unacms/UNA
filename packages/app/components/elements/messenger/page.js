import { View } from 'app/design/view';
import { Link } from 'app/ui/atoms/link';
import { Text } from 'app/design/typography'
import { useState, useRef } from 'react';
import { MenuColumn } from 'app/components/elements/messenger/menu';
import { TalksListColumn } from 'app/components/elements/messenger/talks-list';
import { useWindowDimensions } from 'react-native';
import { Button } from "../../../design/controls";
import MessengerContext from './messenger-сontext';
import { getGrid, getScreenMode, getSpace, sDesktop, sPhone }  from './grid-utils';

export default function PageLayout({ data }) {
    const [panel, selectPanel] = useState(false);
    const [menuItem, selectMenu] = useState('inbox');
    const [talk, selectTalk] = useState(0);

    const { list, history } = data,
          { height } = useWindowDimensions(),
          sMode = getScreenMode(),
          iSpace = getSpace(sMode),
         { historyCol, listCol, menuCol } = getGrid( sMode, panel );

    const oWindowRef = useRef(),
          iHeight = height - iSpace;

    const handlerSelectMenu = (sMenu) => {
        //console.log( '-- log select menu --', sMenu);
        selectMenu(sMenu);

        /*if (panel === 'menu' && sMode !== sDesktop)
            selectPanel(false);*/
    };

    const handlerSelectTalk = (iTalk) => {
        selectTalk(iTalk);

        if (sMode === sPhone)
            selectPanel(panel !== 'history' && 'history');

        //console.log('--- log select talk ---', iTalk);
    };

    // {/*grid grid-cols-10*/}
    //{/*list={data?.list?.items}*/}
    //console.log('----- log rerender main page ----', data);
    return <MessengerContext.Provider value={{ device: sMode, handlerSelectMenu, menuItems: data.menu, menuItem, talk, selectTalk: handlerSelectTalk, viewMenu: sMode === sDesktop, selectPanel }}>
        <View ref={oWindowRef} style={{ height: iHeight }} className="w-full h-full overflow-hidden">
            <View className="w-full h-full mx-auto flex flex-row bg-gray-50 dark:bg-gray-900">
                <View className="hidden xl:block xl:w-2/12 border-r border-bordercolornavbar dark:border-bordercolornavbar-dark">
                    <MenuColumn {...data.menu} />
                </View>
                <View className="w-full md:w-4/12 xl:w-4/12">
                    <TalksListColumn />
                </View>
                <View className="w-full md:w-8/12 xl:w-6/12 border-l border-bordercolornavbar dark:border-bordercolornavbar-dark">
                    <View className="w-full absolute top-0 p-4">
                        <Button variant="custom" startDecorator="CaretLeft" solid align="start" className="block md:hidden" onPress={() => selectPanel(panel !== 'history')}/>
                    </View>
                    <Text>History</Text>
                </View>
            </View>
        </View>
    </MessengerContext.Provider>
}