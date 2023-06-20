import { View } from 'app/design/view';
import { Link } from 'app/ui/atoms/link';
import {Text} from 'app/design/typography'
import {useState, useRef, useContext} from 'react';
import { MenuColumn } from 'app/components/elements/messenger/menu';
import { TalksListColumn } from 'app/components/elements/messenger/talks-list';
import { Platform, useWindowDimensions, StyleSheet } from 'react-native';
import { useMemo } from 'react'
import { fetcher } from "../../../lib/fetcher";
import { Button } from "../../../design/controls";
import MessengerContext from './messenger-сontext';
import { getGrid, getScreenMode, getSpace, sDesktop }  from './grid-utils';

export default function PageLayout({ data }) {
    const [panel, selectPanel] = useState(false);
    const [menuItem, selectMenu] = useState('inbox');

    const { list, history } = data,
          { height } = useWindowDimensions(),
          sMode = getScreenMode(),
          iSpace = getSpace(sMode),
         { historyCol, listCol, menuCol } = getGrid( sMode, panel );

    const oWindowRef = useRef(),
          iHeight = height - iSpace;

    /*const loadListItems = async (sGroup) => {
      const sResponse = await fetcher('/api.php?r=bx_messenger/get_talks_list/&params=' + JSON.stringify({ group: sGroup }));
      if(sResponse?.data && parseInt(sResponse.data?.code) > 0)
           console.log(sResponse.data);
    };
*/
    const handlerSelectMenu = (sMenu) => {
        console.log( '-- log select menu --', sMenu);
        selectMenu(sMenu);

        if (panel === 'menu' && sMode !== sDesktop)
            selectPanel(false);
    };

    const handlerSelectTalk = (iTalk) => {
        selectTalk(iTalk);

        if (sMode === sPhone)
            selectPanel(panel !== 'history' && 'history');


        //console.log('--- log select talk ---', iTalk);
    };

    console.log('----- log rerender main page ----', data);
    return (
            <MessengerContext.Provider value={{ device: sMode, onSelect: handlerSelectMenu, menu: menuItem, talk: null, viewMenu: sMode === sDesktop, selectPanel }}>
                 <View ref={oWindowRef} style={{ height: iHeight }} className="w-full h-full overflow-hidden">
                   <View className="w-full h-full mx-auto divide-x divide-gray-200 dark:divide-gray-800 bg-gray-50 dark:bg-gray-900 grid grid-cols-10">
                       <MenuColumn {...data.menu} colWidth={ menuCol } />
                       <TalksListColumn list={data?.list?.items} colWidth={ listCol } ></TalksListColumn>
                       <View className={"h-full max-h-full w-full flex flex-col text-xl justify-center items-center relative "}>
                           <View className="w-full absolute top-0 p-4">
                              <Button variant="custom" startDecorator="CaretLeft" solid align="start" className="block md:hidden" onPress={() => selectPanel(panel !== 'history')}/>
                           </View>
                           <Text>History</Text>
                       </View>
                   </View>
                 </View>
            </MessengerContext.Provider>
         )
}