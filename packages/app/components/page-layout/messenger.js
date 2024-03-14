
import { View, Row, Pressable } from 'app/design/view'
import React, { memo, useState, useEffect, useContext, useMemo } from 'react';
import { appSetting, getLayout, menuItemsByName, getHeaderSettings, getURI } from 'app/lib/util'
import { useCurrentUser } from 'app/context/user'
import { DataByName } from 'app/components/block';
import { LeftSidebar, TopSidebar } from 'app/lib/conductor-helpers';
import { useWindowDimensions } from 'react-native';
import { Button } from 'app/design/controls'
import Messenger from 'app/components/elements/messenger/parts/common'

import {CreateConvoButton} from 'app/components/elements/messenger/parts/new-convo';
import { Nav } from 'app/components/elements/messenger/parts/nav';
import { fetcher } from 'app/lib/fetcher';
import { Platform } from 'react-native'
import MenuDrawer from 'app/components/nav/menu-drawer'

export default function PageLayout({ url, data, layoutName, blocks: { main } }) {
    const isWeb = Platform.OS == 'web'
    const sTitle = 'Messenger';
    let defaultMenuName = 'inbox';
    let defaultConvoId = '';
    const aUrl = url.split('/');
    if (aUrl.length > 1)
        defaultMenuName = aUrl[1];
    if (aUrl.length > 2)
        defaultConvoId = aUrl[2];


    const { currentUser, setCurrentUser } = useCurrentUser();
   
    const layout = getLayout(currentUser, 'navigator');
    const isLeftMenu = layout != 'hor' ? false : true;
    const data2 = DataByName(data, main);
    const menuDefaultList = useMemo(() => {
        return data2.content[0].data.menu.items.filter(item => ['inbox', 'direct'].includes(item.name));
    }, [data2]);

    const [menu, setMenu] = useState({ data: menuDefaultList, index: menuDefaultList.findIndex(item => item.name == defaultMenuName) });
    const [convos, setConvos] = useState(false);
    const [initedConvoId, setInitedConvoId] = useState(defaultConvoId);
    const { width: windowWidth, height: windowWHeight } = useWindowDimensions();

    const fetchConvos = async () => {
        if (menu) {
            const menuItem = menu?.data[menu?.index].name;
            if (menuItem) {
                let request_url = '/api.php?r=bx_messenger/get_convos_list/Services&params[]=' + JSON.stringify({ group: menuItem, count: 0 });
                const sResponse = await fetcher(request_url);
                let convos = sResponse.data;

                setConvos({ data: convos });

            }
        }
    }

    useEffect(() => {
        fetchConvos();
    }, [menu.index]);

    const onSave = (data) => {
        setConvos(prevConvos => ({
            ...prevConvos,
            data: [data.convo, ...prevConvos.data]
        }));
        setInitedConvoId(data.convo.id)
    }

    const changeMenu = (index) => {
        setMenu(prevMenu => ({ ...prevMenu, index: index }));
        setInitedConvoId(convos.data[0].id)
    }

    const addButtons = useMemo(() => {
        return [
            <CreateConvoButton key="a" onSave={onSave}/>
        ]
    }, []);

    const messengerContainer = (menu && convos) && <><Nav addButtons={addButtons} /><MessengerContainer
        fetchConvos={fetchConvos}
        convos={convos}
        data={data2.content[0]}
        selectedMenu={menu?.data[menu?.index].name}
        defaultConvoId={initedConvoId}
        windowWidth={windowWidth}
        windowWHeight={windowWHeight}
        layout={layout}
        onSave={onSave}
    /></>

    if (!isWeb) {
        return messengerContainer;
    }

    if (!isWeb)
        return (menu && convos) && <MessengerContainer
            fetchConvos={fetchConvos}
            convos={convos}
            data={data2.content[0]}
            selectedMenu={menu?.data[menu?.index].name}
            defaultConvoId={initedConvoId}
            windowWidth={windowWidth}
            windowWHeight={windowWHeight}
            layout={layout}
            onSave={onSave}
        />

        return (
            <Row className={appSetting('layout', 'max_width') + ' w-full mx-auto'}>
                <LeftMenu
                    isLeftMenu={isLeftMenu}
                    sTitle={sTitle}
                    addButtons={addButtons}
                    menu={menu} changeMenu={changeMenu}
                />
                <View className='flex-auto items-stretch'>
                    <TopMenu
                        url={url}
                        windowWidth={windowWidth}
                        isLeftMenu={isLeftMenu}
                        addButtons={addButtons}
                        layoutName={layoutName}
                        sTitle={sTitle}
                        menu={menu}
                        changeMenu={changeMenu}
                        currentUser={currentUser}
                    />
                   {messengerContainer}
                </View>
            </Row>
        )
}

const MessengerContainer = memo(({ convos, selectedMenu, url, data, windowWHeight, windowWidth, layout, fetchConvos, defaultConvoId, onSave }) => {
    const isWeb = Platform.OS == 'web'
    let height = useMemo(() => {
        let heightInit = windowWHeight;
        if (layout == 'ver') {
            heightInit = windowWHeight - 64;
        }
        if (layout == 'hor') {
            heightInit = windowWHeight - 64;
        }
        if (layout == 'mixed') {
            heightInit = windowWHeight - 64 - 64;
        }
        if (windowWidth < 1024) {
            heightInit = windowWHeight - 64 - 64 - 64;
        }
        if (!isWeb){
            heightInit = windowWHeight - 64 - 51;
        }
        return heightInit;
    }, [windowWHeight, layout])

    return (
        <Messenger  onSave={onSave} fetchConvos={fetchConvos} layoutHeight={height} {...data} url={url} selectedMenu={selectedMenu} convos={convos} defaultConvoId={defaultConvoId} />
    );
});


const TopMenu = memo(({ url, currentUser, windowWidth, isLeftMenu, addButtons, layoutName, sTitle, menu, changeMenu }) => {
    const isWeb = Platform.OS == 'web'
    const [menuPopup, setMenuPopup] = useState(false)

    const showMenu = () => {
        setMenuPopup(!menuPopup)
    }

    const headerSettings = getHeaderSettings(getURI(url), windowWidth, layoutName);
    return (
        <>
            <MenuDrawer showMenu={showMenu} menuPopup={menuPopup} cssClass="lg:hidden fixed z-50 top-[114px]  w-full" />
            <View className=''>
                <TopSidebar isWeb={isWeb} leftSideBar={isLeftMenu} headerSettings={headerSettings}  addButtons={addButtons} isSmall={true} showMenu={showMenu} layout={layoutName} title={sTitle} >
                    <View className='ml-3 sm:ml-4 mr-auto '>
                        <Row className="gap-x-2" >
                            {menu.data.map((a, index2) => {
                                const isCurrent = menu.index == index2;
                                return (
                                    <Pressable key={"menu-" + index2} className={" py-2 items-center " + a?.menu_settings?.class}
                                        onPress={(event) => {
                                            changeMenu(index2)
                                        }}

                                    >
                                        <Button id="tab" pressed={isCurrent ? true : false} variant={isCurrent ? 'outline' : "text"} rounded size='sm' title={(a.title)} />
                                    </Pressable>
                                )
                            })}
                        </Row>
                    </View>
                </TopSidebar>
            </View>
        </>);
}
);


const LeftMenu = memo(({ isLeftMenu, sTitle, addButtons, menu, changeMenu }) => {
    const aIconsAliases = { 'inbox': 'House', 'comment': 'Chats', 'reply': 'Bell', 'bookmark': 'Bookmarks' };

    const getIcon = (icon) => {
        const sIcon = icon && icon.split(' ')[0];
        return sIcon && ~Object.keys(aIconsAliases).indexOf(sIcon) ? aIconsAliases[sIcon] : sIcon;
    }

    return (
        <>
            {isLeftMenu && <LeftSidebar title={sTitle} addButtons={addButtons}>
                {menu.data.map((a, index2) => {
                    const isCurrent = menu.index == index2;
                    return (
                        <Button
                            key={"menu-" + index2}
                            variant={isCurrent ? 'outline' : "text"}
                            size={'base'}
                            pressed={isCurrent ? true : false}
                            fullWidth
                            title={(a.title)}
                            align="start"
                            startDecorator={getIcon(a.icon)}
                            onPress={(event) => {
                                changeMenu(index2)
                            }}
                        />

                    )
                })}
            </LeftSidebar>}
        </>)
});
