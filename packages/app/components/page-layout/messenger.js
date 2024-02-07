
import { View, Row, Pressable } from 'app/design/view'
import React, { useState, useEffect, useContext, useRef } from 'react';
import { appSetting, getLayout, menuItemsByName, getHeaderSettings, getURI } from 'app/lib/util'
import { useCurrentUser } from 'app/context/user'
import { DataByName } from 'app/components/block';
import { LeftSidebar, TopSidebar } from 'app/lib/conductor-helpers';
import { useWindowDimensions } from 'react-native';
import { Button } from 'app/design/controls'
import Messenger from 'app/components/elements/messenger/parts/common'
import { BottomSheetData } from 'app/context/bottomsheet';
import CreateConvo from 'app/components/elements/messenger/parts/new-convo';
import MainMenu from 'app/components/nav/mainmenu'
import { fetcher } from 'app/lib/fetcher';

export default function PageLayout({ url, data, layoutName, blocks: { main } }) {

    let defaultMenuName = 'inbox';
    let defaultConvoId = '';
    const aUrl = url.split('/');
    if (aUrl.length > 1)
        defaultMenuName = aUrl[1];
    if (aUrl.length > 2)
        defaultConvoId = aUrl[2];

    const { currentUser, setCurrentUser } = useCurrentUser();
    const { bottomSheetData, setBottomSheetData } = useContext(BottomSheetData);
    const layout = getLayout(currentUser, 'navigator');
    const isLeftMenu = layout != 'hor' ? false : true;
    const isTopMenu = true;
    const data2 = DataByName(data, main);

    const aAllowedList = ['inbox', 'direct']; //, 'saved'
    const aIconsAliases = { 'inbox': 'House', 'comment': 'Chats', 'reply': 'Bell', 'bookmark': 'Bookmarks' };
    const menuDefaultList = data2.content[0].data.menu.items.filter(item => aAllowedList.includes(item.name));
    
    const [menu, setMenu] = useState({ data: menuDefaultList, index: menuDefaultList.findIndex(item => item.name == defaultMenuName) });
    const [convos, setConvos] = useState(false);
    const [initedConvoId, setInitedConvoId] = useState(defaultConvoId);

    const fetchConvos = async () => {
        if (menu) {
            const menuItem = menu?.data[menu?.index].name;
            if (menuItem) {
                let request_url = '/api.php?r=bx_messenger/get_convos_list/Services&params[]=' + JSON.stringify({ group: menuItem, count: 0 });
                const sResponse = await fetcher(request_url);
                let convos = sResponse.data;
               
                setConvos({ data: convos});
               
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
        setBottomSheetData(false);
    }

    const getIcon = (icon) => {
        const sIcon = icon && icon.split(' ')[0];
        return sIcon && ~Object.keys(aIconsAliases).indexOf(sIcon) ? aIconsAliases[sIcon] : sIcon;
    }

    const changeMenu = (index) => {
        setMenu(prevMenu => ({ ...prevMenu, index: index }));
        setInitedConvoId(convos.data[0].id)
    }

    const newConvo = () => {
        setBottomSheetData({ title: 'Add users to start messaging', content: <CreateConvo onSave={onSave} />, showClose: true, snapPoints: ['25%', '70%'] });
    }

    const addButtons = [
        <View className="ml-2 " key={`add-1`} ><Button startDecorator={"Plus"} variant="outline" rounded size="sm" onPress={() => newConvo()} /></View>
    ]
    const windowDimen = useWindowDimensions();
    const windowWidth = windowDimen.width;

    let headerSettings = getHeaderSettings(getURI(url), windowWidth, layoutName);
    const menu_drawer = appSetting('menu_items', 'menu_drawer')
    let menu_drawer_items = menuItemsByName('main_menu', menu_drawer, currentUser);
    const [menuPopup, setMenuPopup] = useState(false)
    const showMenu = (params) => {
        setMenuPopup(!menuPopup)
    }
    const sTitle = 'Messenger';
    return (
        <Row className={appSetting('layout', 'max_width') + ' w-full mx-auto'}>
            {isLeftMenu && <LeftSidebar title={sTitle} addButtons={addButtons}>
                {menu.data.map((a, index2) => {
                    const isCurrent = menu.index == index2;
                    return (
                        <Button
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
            <View className='flex-auto'>
                {isTopMenu && <TopSidebar leftSideBar={isLeftMenu} headerSettings={headerSettings} menu_drawer_items={menu_drawer_items} addButtons={addButtons} isSmall={true} showMenu={showMenu} layout={layoutName} title={sTitle} >
                    <View className='ml-3 sm:ml-4 mr-auto '>
                    <Row className="gap-x-2" >
                        {menu.data.map((a, index2) => {
                            const isCurrent = menu.index == index2;
                            return (
                                <Pressable className={" py-2 items-center " + a?.menu_settings?.class}
                                    onPress={(event) => {
                                        changeMenu(index2)
                                    }}

                                >
                                    <Button  id="tab" pressed={isCurrent ? true : false} variant={isCurrent ? 'outline' : "text"} rounded size='sm' title={(a.title)} />
                                </Pressable>
                            )
                        })}
                    </Row>
                    </View>
                </TopSidebar>}
                {(menu && convos) && <Messenger {...data2.content[0]} url={url} selectedMenu={menu?.data[menu?.index].name} convos={convos} defaultConvoId={initedConvoId} />}
                <MainMenu items={menu_drawer_items} showMenu={showMenu} menuPopup={menuPopup} cssClass="lg:hidden fixed z-50 top-[114px]  w-full" />
            </View>
        </Row>
    )

}
