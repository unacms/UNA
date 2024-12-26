
import { View, Row, Pressable } from 'app/design/view'
import React, { memo, useState, useEffect, useContext, useMemo } from 'react';
import { appSetting, getLayout, menuItemsByName, getHeaderSettings, getURI, parseUrl, LAYOUT_BREAKPOINTS } from 'app/lib/util'
import { useCurrentUser } from 'app/context/user'
import { useWindowDimensions } from 'react-native';
import Messenger from 'app/components/elements/messenger/parts/common'
import { CreateConvoButton } from 'app/components/elements/messenger/parts/new-convo';
import { fetcher } from 'app/lib/fetcher';
import { Platform } from 'react-native'
 

export default function MessengerEl(props) {
   // console.log({ url, data, layoutName, blocks: { main } })
    const url=props.url;
    const layoutName=props.layoutName;
    const data=props.data;
    const data2 = props;

    const isWeb = Platform.OS == 'web'
    const sTitle = 'Messenger';
    let defaultMenuName = 'inbox';
    let defaultConvoId = '';
    let b = parseUrl(url);
    const aUrl = b['path'].split('/');
    if (aUrl.length > 1)
        defaultMenuName = aUrl[1];
    if (aUrl.length > 2)
        defaultConvoId = aUrl[2];

    const { currentUser } = useCurrentUser();

    const layout = getLayout(currentUser, 'navigator');
    const isLeftMenu = layout != 'hor' ? false : false;
    
    const menuDefaultList = useMemo(() => {
        return data2.data.menu.items.filter(item => ['inbox', 'direct'].includes(item.name));
    }, [data2]);

    const [menu, setMenu] = useState({ data: menuDefaultList, index: menuDefaultList.findIndex(item => item.name == defaultMenuName) });
    const [convos, setConvos] = useState(false);
    const [initedConvoId, setInitedConvoId] = useState(defaultConvoId);
    const { width: windowWidth, height: windowWHeight } = useWindowDimensions();

    const fetchConvos = async (term) => {
        if (menu) {
            const menuItem = menu?.data[menu?.index].name;
            if (menuItem) {
                if (term){
                    let request_url = '/api.php?r=bx_messenger/search_lots/Services&params=' + JSON.stringify({ term: term });
                    const sResponse = await fetcher(request_url);
                    setConvos({ data: sResponse.data.lots ? sResponse.data.lots : [] });
                }
                else{
                    let request_url = '/api.php?r=bx_messenger/get_convos_list/Services&params[]=' + JSON.stringify({ group: menuItem, count: 0 });
                    const sResponse = await fetcher(request_url);
                    setConvos({ data: sResponse.data });
                }

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
            <CreateConvoButton key="a" onSave={onSave} variant='secondary' />
        ]
    }, []);

    const messengerContainer = (menu && convos) && <><MessengerContainer
        fetchConvos={fetchConvos}
        convos={convos}
        data={data2}
        selectedMenu={menu?.data[menu?.index].name}
        defaultConvoId={initedConvoId}
        windowWidth={windowWidth}
        windowWHeight={windowWHeight}
        layout={layout}
        onSave={onSave}
        addButtons ={addButtons}
    /></>

    return messengerContainer;
}

const MessengerContainer = memo(({ convos, selectedMenu, url, data, windowWHeight, windowWidth, layout, fetchConvos, defaultConvoId, onSave, addButtons }) => {
    const isWeb = Platform.OS == 'web'
    const layoutHeaderHeight = 57;
    let height = useMemo(() => {
        let heightInit = windowWHeight;
        if (layout == 'ver') {
            heightInit = windowWHeight;
        }
        if (layout == 'hor') {
            heightInit = windowWHeight - layoutHeaderHeight;
        }
        if (layout == 'mixed') {
            heightInit = windowWHeight - layoutHeaderHeight;
        }
        if (windowWidth < LAYOUT_BREAKPOINTS.lg) {
            heightInit = windowWHeight - 64 ; // ????????????????????
        }
        if (!isWeb) {
            heightInit = windowWHeight - 51;
        }
        return heightInit;
    }, [windowWHeight, layout])

    return (
        <Messenger addButtons={addButtons} onSave={onSave} fetchConvos={fetchConvos} layoutHeight={height} {...data} url={url} selectedMenu={selectedMenu} convos={convos} defaultConvoId={defaultConvoId} />
    );
});

/*
const TopMenu = memo(({ url, currentUser, windowWidth, isLeftMenu, addButtons, layoutName, sTitle, menu, changeMenu, isDrawer }) => {
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
                <TopSidebar isDrawer={isDrawer} isWeb={isWeb} leftSideBar={isLeftMenu} headerSettings={headerSettings} addButtons={addButtons} isSmall={true} showMenu={showMenu} layout={layoutName} title={sTitle} >
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
*/


