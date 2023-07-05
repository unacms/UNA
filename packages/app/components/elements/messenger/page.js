import { View, Pressable } from 'app/design/view';
import { Link } from 'app/ui/atoms/link';
import { useState, useRef, useMemo, useEffect } from 'react';
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

    const [viewMenu, setMenuView] = useState(true);

    const oWindowRef = useRef(),
          iHeight = height - iSpace;

    const handlerSelectMenu = (sMenu) => {
        selectMenu(sMenu);
        if (sMode !== sDesktop)
            setMenuView((viewMenu) => !viewMenu);
    };

    const handlerMenuView = (bView) => {
        if (typeof bView !== 'undefined')
            setMenuView(bView);
        else
            setMenuView((viewMenu) => !viewMenu);
    };

    const handlerSetConvoItem = (item) => {
        setConvoItem(item);
    }

    const handlerSelectConvo = (item) => {
        const { id } = item;
        selectConvo(id);
        setConvoItem(item);

        if (sMode === sPhone)
            selectPanel('history');
    };

    useEffect(() => {
        if (sMode !== sPhone) {
            selectPanel(false);
        }

        if (viewMenu)
            setMenuView(false);

    }, [sMode]);

   //console.log('----- log rerender main page ----', sMode, historyCol, listCol, panel, convoInfo );

    return <MessengerContext.Provider value={{
                                                  height: iHeight, handlerSelectMenu,
                                                  handlerMenuView, menuItems: data.menu,
                                                  menuItem, convo, handlerSelectConvo,
                                                  viewMenu, selectPanel,
                                                  handlerSetConvoItem
                                                }}>
                <Pressable onPress={(e) => {
                    if (viewMenu)
                        handlerMenuView(false);
                    }}>
                    <View ref={oWindowRef} style={{ height: iHeight }} className="w-full h-full overflow-hidden">
                        <View className="w-full h-full mx-auto flex flex-row bg-neutral-50 dark:bg-neutral-900">
                            <View className={"xl:w-2/12 hidden xl:block border-r border-bordercolornavbar dark:border-bordercolornavbar-dark" }>
                                <MenuColumn { ...data.menu } />
                            </View>
                            <View className={ listCol }>
                                <ConvosListColumn />
                            </View>
                            <View className={ historyCol + " border-l border-bordercolornavbar dark:border-bordercolornavbar-dark h-full"}>
                               <History convo={ convoInfo } pressBack={ () => selectPanel(false) }/>
                            </View>
                        </View>
                    </View>
                </Pressable>
        </MessengerContext.Provider>
}