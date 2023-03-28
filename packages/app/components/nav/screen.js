import React from 'react';
import { useState, useEffect } from 'react'
import All, { getData } from 'app/all'
import { Text } from 'dripsy'
import { View } from 'app/design/view'
import { Stack } from 'expo-router'
import { NavDrawer } from 'app/components/nav/drawer'
import { useCurrentUser } from 'app/context/user';
import { useIsFocused } from '@react-navigation/native';

export function NavScreen(params) {
    const _path = params.route.params.url;
    let _isFocused = params.navigation.isFocused();
    
    const [pageData, setPageData] = useState(null);
    const [isFocused, setIsFocused] = useState(_isFocused);
    const isFocused2 = useIsFocused();
    if (isFocused != _isFocused){
        setIsFocused(_isFocused)
    }
    console.log(`NavScreen 1 - focused:${_isFocused} / path: ${_path}`);
    useEffect(() => {
        (async () => {
            if (isFocused && _path && _path.startsWith('/')){                
                console.log(`NavScreen 2 - focused:${_isFocused} / path: ${_path}`);
                const d = await getData(_path);

                if (d?.props) {
                    setPageData (d?.props)                    
                    if (params.route.params.checkDrawer && d.props.data.menu && d.props.data.menu.items && d.props.data.menu.items.length > 1){
                        setTimeout(() => {
                            params.navigation.setOptions({ headerShown: false })
                        }, 100);
                    }
                    else{
                        setTimeout(() => {
                            params.navigation.setOptions({ headerShown: true })
                        }, 100);
                    }

                }
            }
        })();
    }, [_path, isFocused, isFocused2]);

    if (params.route.params.checkDrawer && pageData && pageData.data.menu && pageData.data.menu.items && pageData.data.menu.items.length > 1){
        return <NavDrawer menu = {pageData.data.menu} />
    }
    else{
        return <View className='w-full' style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            {pageData && <View className='bg-red-500 w-full'><Stack.Screen options={{'title': pageData.data.title}}/><All path={_path} {...pageData} ></All></View> }
            </View>
    }
}