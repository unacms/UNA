import { useState, useEffect } from 'react'
import {Root, getData } from 'app/root'
import { View } from 'app/design/view'
import { NavDrawer } from 'app/components/nav/drawer'
import { useIsFocused } from '@react-navigation/native';
import { NavMaterialTabs } from 'app/components/nav/materialtabs'
import Cover from 'app/components/elements/cover';
import { useTheme } from '@react-navigation/native';
import LayoutDataContext from 'app/context/layout';
import { ScrollView } from 'dripsy';
import PageLayout from 'app/components/page-layout';

export function NavScreen(params) {

    const { colors } = useTheme();
    
    const _path = params.route.params.url2;
    const [pageData, setPageData] = useState(params.route.params.pageData);

    const isFocused2 = useIsFocused();
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

    if (isTabs)
        return <NavMaterialTabs uri={pageData?.data.uri} data = {pageData.data.menu} pageData = {pageData} />

    if (!!pageData?.data) 
        return <Root path={_path} data={pageData?.data} uri={pageData?.data.uri}/>
    
    return <></>
}