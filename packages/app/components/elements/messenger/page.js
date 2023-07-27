import { View, Pressable } from 'app/design/view';
import { Link } from 'app/ui/atoms/link';
import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { MenuColumn } from 'app/components/elements/messenger/menu';
import { ConvosList } from 'app/components/elements/messenger/convos-list';
import History from 'app/components/elements/messenger/history';
import { useWindowDimensions } from 'react-native';
import MessengerContext from './messenger-сontext';
import { getGrid, getScreenMode, getSpace, sDesktop, sPhone }  from './grid-utils';
import Loading from "../../../ui/atoms/loading";

export default function PageLayout({ data }) {
    const [panel, selectPanel] = useState(false);
    const [menuItem, selectMenu] = useState('inbox');
    const [convo, selectConvo] = useState(0);
    const [convoInfo, setConvoItem] = useState(null);
    const [viewMenu, setMenuView] = useState(false);

    const { height } = useWindowDimensions(),
          sMode = getScreenMode(),
          iSpace = useMemo(() => getSpace(sMode), [sMode]),
         { historyCol, listCol } = useMemo(() => getGrid( sMode, panel ), [sMode, panel]);

    const oWindowRef = useRef(),
          iHeight = height - iSpace;

    const handlerSelectMenu = (sMenu) => {
        selectMenu(sMenu);
        if (sMode !== sDesktop)
            setMenuView((viewMenu) => !viewMenu);
    };

    const handlerMenuView = useCallback((bView) => {
        if (typeof bView !== 'undefined')
            setMenuView(bView);
        else
            setMenuView((viewMenu) => !viewMenu);
    }, [viewMenu]);

    const handlerSelectConvo = (item) => {
        const { id } = item;
        selectConvo(id);
        setConvoItem(item);
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
                                                  mode: sMode,
                                                  panel, viewMenu, selectPanel, setConvoItem
                                              }}>
                <Pressable onPress={(e) => {
                    if (viewMenu)
                        handlerMenuView(false);
                    }} className={"cursor-default"}>
                    <View ref={oWindowRef} style={{ height: iHeight }} className="w-full h-full overflow-hidden">
                        <View className="w-full h-full mx-auto flex flex-row bg-neutral-50 dark:bg-neutral-900">
                            <View className={"xl:w-2/12 hidden xl:block border-r border-bordercolornavbar dark:border-bordercolornavbar-dark" }>
                                <MenuColumn { ...data.menu } />
                            </View>
                            <View className={ listCol }>
                                <ConvosList convo={ convo } visible={!panel}
                                            menuItem={menuItem} viewMenu={viewMenu}
                                            handlerMenuView={handlerMenuView} selectConvo={handlerSelectConvo} height={iHeight} />
                            </View>
                            <View className={ historyCol + " border-l border-bordercolornavbar dark:border-bordercolornavbar-dark h-full"}>
                                { convoInfo && <History convo={ convoInfo } pressBack={ () => selectPanel(false) } height={iHeight} menuItem={menuItem}/> }
                            </View>
                        </View>
                    </View>
                </Pressable>
        </MessengerContext.Provider>
}