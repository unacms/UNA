import React from 'react';
import { useState, useEffect } from 'react'
import All, { getData } from 'app/all'
import { Text } from 'dripsy'
import { View } from 'app/design/view'
import { Stack } from 'expo-router'
import { NavDrawer } from 'app/components/navDrawer'

export function NavScreen(params) {
    const _path = params.route.params.url;
    let _isFocused = params.navigation.isFocused();
    console.log('11111111111', _path);
    const [pageData, setPageData] = useState(null);
    const [isFocused, setIsFocused] = useState(_isFocused);

    if (isFocused != _isFocused){
        setIsFocused(_isFocused)
    }
    useEffect(() => {
        (async () => {
            if (isFocused && _path && _path.startsWith('/')){
                const d = await getData(_path);
                if (d?.props) {
                    setPageData (d?.props)
                }
            }
        })();
    }, [_path, isFocused]);

if (params.route.params.checkDrawer && pageData && pageData.data.menu && pageData.data.menu.items && pageData.data.menu.items.length > 1){
    params.navigation.setOptions({ headerShown: false })
    return <NavDrawer menu = {pageData.data.menu} />
}
else{
    params.navigation.setOptions({ headerShown: true })
    return <View className='w-full' style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {pageData && <View className='bg-red-500 w-full'><Stack.Screen options={{'title': pageData.data.title}}/><All path={_path} {...pageData} ></All></View> }
        </View>
}
}