import React, { useCallback, useState, useEffect, useMemo } from "react";
import { appSetting, deepEqual, getUnitModeBySource, parseUrl, parseQueryString, getURI  } from 'app/lib/util';
import { menuItemsByName } from 'app/lib/util'
import Link from 'app/ui/atoms/link'
import { Button } from 'app/design/controls'
import { BlockByName, DataByName } from 'app/components/block'
import { View, Row, Pressable, ScrollView } from 'app/design/view'
import { Text } from 'app/design/typography'

import { Platform } from 'react-native'
import { updateRightHeader } from 'app/lib/native-handlers';
import { useNavigation } from '@react-navigation/native';
import { fetcher } from 'app/lib/fetcher';
import { Conductor } from 'app/ui/molecules/conductor';

export default function PageLayout(props) {

    let menu = props.data.menu;
    let categories = DataByName(props.data, props.blocks.categories);
    let menuItems = [];

    if (categories){
        menuItems  = categories?.content[0]?.data
            .map((obj, index) => {
            const key = Object.keys(obj)[0];
            return {
                id: index + menu.items.length,
                name: obj.url,
                title: obj.name + ' (' + obj.num + ')',
                link: obj.url.replace('/',''),
                icon: '',
                ident: 1,
                hideInTop: true
            }
        }); 
    } 

    menu.items = [...menu.items, ...menuItems];
    return (<Conductor 
        minHeaderHeight={0} 
        isHideDefaultHeader={false} 
        menu={menu} 
        data={props.data} 
        blocks={props.blocks}
        useSectionAsMenu={false}
        leftSideBar={true}
    />)
}
