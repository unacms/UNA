import React from 'react';
import { useState, useEffect } from 'react'
import All, { getData } from 'app/all'
import { Text } from 'dripsy'
import { View } from 'app/design/view'
import { Stack } from 'expo-router'
import { NavDrawer } from 'app/components/nav/drawer'
import { useCurrentUser } from 'app/context/user';
import { useIsFocused } from '@react-navigation/native';
import { NavMaterialTabs } from 'app/components/nav/materialtabs'
import Cover from 'app/components/elements/cover';
import { useTheme } from '@react-navigation/native';

export function NavScreen(params) {

    const { colors } = useTheme();
    
    const _path = params.route.params.url2;
    const [pageData, setPageData] = useState(params.route.params.pageData);

    const isFocused2 = useIsFocused();
    console.log(_path+'---render');
    let isDrawer = params.route.params.checkDrawer && pageData && pageData.data.menu_top && pageData.data.menu_top.items && pageData.data.menu_top.items.length > 1 && _path == '/home';
    let isTabs1 = !params.route.params.ignoreTabs && pageData?.data?.menu?.items?.length > 1 && _path != '/home';           
    let isTabs = false;
    if (isTabs1){
        pageData.data.menu.items.forEach(function (k) { 
            if ('/' + k.link == _path)
                isTabs = true;
        });
    }

    let isCover = pageData?.data?.cover_block?.profile ? true : false;

    useEffect(() => {
        (async () => {
            if (isFocused2 && _path && _path.startsWith('/')){                
                const d = await getData(_path);
                //console.log("$$$$$$$$$$$$$$$$$BootomTab Screen load data:", params.route, "$$$$$",_path, "$$$$$",d);
                if (d?.props) {
                    setPageData (d?.props);
                }
            }
        })();
    }, [_path]);
    //isFocused2
    isDrawer = false;
    if (isDrawer){
        /*setTimeout(() => {
            params.navigation.setOptions({ headerShown: false })
        }, 100);*/
        return <NavDrawer menu = {pageData.data.menu_top} pageData = {pageData} />
    }
    else{
        /*setTimeout(() => {
            params.navigation.setOptions({ headerShown: true })
        }, 100);*/
    }
    if (isTabs){   
        return (<View className='flex-1'>
            {(isCover) && <Cover data={pageData.data.cover_block}/>}
            <NavMaterialTabs data = {pageData.data.menu.items} pageData = {pageData} />
        </View>);
    }
    if (!isDrawer && !isTabs){
        return <View className='w-full' style={{ flex: 1, alignItems: 'center', justifyContent: 'center', borderTopWidth:1, borderTopColor:colors.blockBorder }}>
            { !!pageData && <View className='w-full'><All path={_path} {...pageData} /></View> }
            {/*!pageData && <Stack.Screen options={{'title': "Loading..."}} /><Stack.Screen options={{'title': (pageData?.data? pageData?.data?.title : "Loading...")}} />*/}
        </View>
    }
    return <></>
}