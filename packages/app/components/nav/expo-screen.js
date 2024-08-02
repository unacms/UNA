import { Root } from 'app/root'
import { memo, useState, useEffect, useContext, useMemo } from 'react'

import { useCurrentUser } from 'app/context/user';
import { appSetting, parseUrl, parseQueryString, getURI } from 'app/lib/util'
import { Loading } from 'app/loading'
import { useBottomSheetData } from 'app/context/bottomsheet';
import { fetcher } from 'app/lib/fetcher';
import { useLocalSearchParams } from 'expo-router';
import { useUpdateCenterHeader, getRightHeader } from 'app/lib/native-handlers'
import { useNavigation } from 'expo-router';
import { menuItemsFilter } from 'app/lib/util';

export async function getData(path, token, origin, headers, callback, params) {
    path = (!path || path.startsWith('expo-development-client')) ? 'home' : path;
    path = path.startsWith('/') ? path.substr(1) : path;
    path = `/api.php?r=system/get_page_by_request/TemplServicePages&params[]=${path}`;

    const uri = getURI(path);
    const settings = appSetting('layouts', uri);
    if (settings?.blocks) {
        const blockNames = Object.values(settings.blocks).map(block => block.name).join(',');
        path += `&params[]=${blockNames}`;
    }

    if (params) {
        path += `&params[]=${params}`;
    }

    const t1 = Date.now();
    const fetcherArgs = token || origin || headers || callback ? [path, token, '', origin, headers, callback] : path;
    const data = await fetcher(fetcherArgs);
    const diff = Date.now() - t1;

    return { props: { uri: path.length ? path[0] : 'home', ...data } };
}

export function Screen(params) {
    const local = useLocalSearchParams();
    const pathname = params.tabname;
    const { currentUser } = useCurrentUser();
    let _path = local.url;
    let isRoot = false;

    // BOTTOM TABS NAVIGATION
    if (!_path || _path.includes('/tab')) {
        const tabListKey = currentUser ? 'menu_tabbar_logged' : 'menu_tabbar_non_logged';
        const tabList = appSetting('menu_items', tabListKey);
        const item = tabList.find((item) => item.key === pathname);
        _path = item ? item.url : null;
        isRoot = true;
    }

    const memoizedValue = useMemo(() => {
        return <Content pagePath={_path} currentUser={currentUser} isRoot={isRoot} />;
    }, [_path, currentUser?.id]);

    return memoizedValue
}

const Content = ({ pagePath, currentUser, isRoot }) => {
    const navigation = useNavigation();
    const updateCenterHeader = useUpdateCenterHeader(navigation);
    const [pageData, setPageData] = useState(null);
    const { bottomSheetData, setBottomSheetData } = useBottomSheetData();
    useEffect(() => {
        if (!(pagePath && pagePath.startsWith('/') && !pagePath.includes('/?url='))) return;

        const fetchPageData = async () => {

            const { path: pathWithoutQuery, queryString } = parseUrl(pagePath);
            const params = queryString ? JSON.stringify(parseQueryString(queryString)) : null;
            const data = await getData(pathWithoutQuery, null, null, null, null, params);

            if (data?.props) {
                const pageData1 = data.props;
                const settings = appSetting('layouts', pageData1.data.uri)

                let header = settings?.header
                if (!header) {
                    const menu_name = pageData1.data?.menu?.object;
                    if (menu_name) {
                        const menuSettings = appSetting('menu_items', menu_name);

                        let addButtonsSet = menuSettings?.add?.filter(item => item.hideInTopBar !== true);
                        addButtonsSet = menuItemsFilter(addButtonsSet, currentUser);
                        header = addButtonsSet;
                    }
                }
                if (/*currentUser?.id &&*/ (!isRoot || navigation.getState().routes.length <= 1)) {
                    updateCenterHeader(pagePath, pageData1.data.name, null, header, settings?.headerSettings);
                }

                 //console.log('-------------------------------updateCenterHeader', pagePath, pageData1?.data?.name, navigation.getState().routes.length)

                setBottomSheetData(bottomSheetData !== false ? false : bottomSheetData);
                setPageData(data.props);
            }
        };
        fetchPageData();
    }, [pagePath, currentUser?.id]);

    /*useEffect(() => {
         if (pageData) {
             const settings = appSetting('layouts', pageData.data.uri)
 
             let header = settings?.header
             if (!header){
                 const menu_name = pageData.data?.menu?.object;
                 if (menu_name){
                     const menuSettings = appSetting('menu_items', menu_name);
 
                     let addButtonsSet = menuSettings?.add?.filter(item => item.hideInTopBar !== true);
                     addButtonsSet = menuItemsFilter(addButtonsSet, currentUser);
                     header = addButtonsSet;
                 }
             }
             console.log("updateCenterHeader")
             updateCenterHeader(pagePath, pageData.data.name, null, header, settings?.headerSettings);
         }
     }, [pageData, currentUser?.id]);*/

    return pageData?.data ? (

        <Root path={pagePath} data={pageData.data} uri={pageData.data.uri} />
    ) : <Loading />;
};