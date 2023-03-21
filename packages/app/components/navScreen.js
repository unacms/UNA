import React from 'react';
import { useState, useEffect } from 'react'
import All, { getData } from 'app/all'
import { Text } from 'dripsy'
import { View } from 'app/design/view'
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useRoute } from '@react-navigation/native';
import { Stack } from 'expo-router'
import { Icon } from 'app/components/svg';


export function NavScreen(params) {
    let route = params.route
    let navigation = params.navigation;
    const [pageData, setPageData] = useState(undefined);

    let path = (route.name == '/pages' ? route.params.path : route.name);
    if (!path.startsWith('/'))
      path = '/' + path;
    
    console.log('++++', path)
    console.log('++++', navigation)

    useEffect(() => {
      (async () => {
        if (path.startsWith('/') && !path.includes(",") && path != '/'){
        const d = await getData(path);
        console.log('12345', '|'+path+'|');
        if (d?.props) {
          setPageData (d?.props)
        }
      }
      })();
    }, [navigation]);

    useEffect(() => {
      (async () => {
        if (path.startsWith('/') && !path.includes(",") && path != '/'){
        const d = await getData(path);
        console.log('12345', '|'+path+'|');
        if (d?.props) {
          setPageData (d?.props)
        }
      }
      })();
    }, [path]);
    
    console.log('-----', path);

    return (
      <View className='w-full' style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {pageData && <View className='bg-red-500 w-full'><Stack.Screen  options={{'title': pageData.data.title}}  /><All path={path} {...pageData} ></All></View> }
      </View>
    );
  }