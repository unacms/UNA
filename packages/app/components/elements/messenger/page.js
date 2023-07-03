import { View, Pressable } from 'app/design/view';
import { Link } from 'app/ui/atoms/link';
import { useState, useRef, useMemo } from 'react';
import { MenuColumn } from 'app/components/elements/messenger/menu';
import { ConvosListColumn } from 'app/components/elements/messenger/convos-list';
import History from 'app/components/elements/messenger/history';
import { useWindowDimensions } from 'react-native';
import MessengerContext from './messenger-сontext';
import { getGrid, getScreenMode, getSpace, sDesktop, sPhone }  from './grid-utils';

export default function PageLayout({ data }) {
    const [panel, selectPanel] = useState(false);
    const [menuItem, selectMenu] = useState('inbox');
    const [convo, selectConvo] = useState(0);
    const [convoInfo, setConvoItem] = useState([]);

    const { height } = useWindowDimensions(),
          sMode = getScreenMode(),
          iSpace = getSpace(sMode),
         { historyCol, listCol } = useMemo(() => getGrid( sMode, panel ), [sMode, panel]);

    const [viewMenu, setMenuView] = useState(sMode === sDesktop);

    const oWindowRef = useRef(),
          iHeight = height - iSpace;

    const handlerSelectMenu = (sMenu) => {
        //console.log( '-- log select menu --', sMenu);
        selectMenu(sMenu);
        setMenuView((viewMenu) => !viewMenu);

        /*if (panel === 'menu' && sMode !== sDesktop)
            selectPanel(false);*/
    };

    const handlerMenuView = (bView) => {
        if (typeof bView !== 'undefined')
            setMenuView(bView);
        else
            setMenuView((viewMenu) => !viewMenu);
    };

    const handlerSelectConvo = (item) => {
        const { id } = item;
        selectConvo(id);
        setConvoItem(item);

        //console.log('------ log data ----', sMode, id);
        if (sMode === sPhone)
            selectPanel(panel !== 'history' && 'history');
    };

    //console.log('----- log rerender main page ----', sMode );
    return <Pressable onPress={(e) => {
               if (viewMenu)
                  handlerMenuView(false);
           }}>
              <MessengerContext.Provider value={{ height: iHeight, handlerSelectMenu,
                    handlerMenuView, menuItems: data.menu, menuItem, convo,
                    handlerSelectConvo, viewMenu, selectPanel }}>
                    <View ref={oWindowRef} style={{ height: iHeight }} className="w-full h-full overflow-hidden">
                        <View className="w-full h-full mx-auto flex flex-row bg-gray-50 dark:bg-gray-900">
                            <View className={"xl:w-2/12 hidden xl:block border-r border-bordercolornavbar dark:border-bordercolornavbar-dark" }>
                                <MenuColumn { ...data.menu } />
                            </View>
                            <View className={ listCol }>
                                <ConvosListColumn />
                            </View>
                            <View className={ historyCol + " border-l border-bordercolornavbar dark:border-bordercolornavbar-dark"}>
                               <History convo={convoInfo} pressBack={() => selectPanel(panel !== 'history')}/>
                            </View>
                        </View>
                    </View>
                </MessengerContext.Provider>
            </Pressable>
}