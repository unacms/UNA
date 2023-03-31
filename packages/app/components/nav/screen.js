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
    
    const _path = params.route.params.url;
    const [pageData, setPageData] = useState(params.route.params.pageData);

    const isFocused2 = useIsFocused();

    const isDrawer = params.route.params.checkDrawer && pageData && pageData.data.menu_top && pageData.data.menu_top.items && pageData.data.menu_top.items.length > 1 && _path == '/home';
    const isTabs = !params.route.params.ignoreTabs && pageData?.data?.menu?.items?.length > 1 && _path != '/home';           

    let isCover = pageData?.data?.cover_block?.profile ? true : false;
    
    if (!params.route.params.pageData || params?.route?.params?.pageData?.uri != _path){
        useEffect(() => {
            (async () => {
                if (isFocused2 && _path && _path.startsWith('/')){                
                    const d = await getData(_path);
                    //console.log("$$$$$$$$$$$$$$$$$ Screen load data:", params.route, "$$$$$",_path, "$$$$$",d);
                    if (d?.props) {
                        setPageData (d?.props);
                    }
                }
            })();
        }, [_path, isFocused2]);
    }
    if (isDrawer){
        setTimeout(() => {
            params.navigation.setOptions({ headerShown: false })
        }, 100);
        return <NavDrawer menu = {pageData.data.menu_top} pageData = {pageData.data} />
    }
    else{
        setTimeout(() => {
            params.navigation.setOptions({ headerShown: true })
        }, 100);
    }
    if (isTabs){   
        return (<View className='flex-1'>
            {(isCover) && <Cover data={pageData.data.cover_block}/>}
            <NavMaterialTabs data = {pageData.data.menu.items} pageData = {pageData.data} />
        </View>);
    }
    if (!isDrawer && !isTabs){
        return <View className='w-full' style={{ flex: 1, alignItems: 'center', justifyContent: 'center', borderTopWidth:1, borderTopColor:colors.blockBorder }}>
            {pageData && <View className='bg-red-500 w-full'><Stack.Screen options={{'title': pageData?.data?.title}} /><All path={_path} {...pageData} ></All></View> }
        </View>
    }
}