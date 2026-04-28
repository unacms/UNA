import { Root } from 'app/root'
import { useState, useEffect } from 'react'
import { useCurrentUser } from 'app/context/user';
import { appSetting, parseUrl, parseQueryString, getURI, getPageSettings } from 'app/lib/util'
import { Loading } from 'app/customization/loading'
import { useBottomSheetData } from 'app/context/bottomsheet';
import { fetcher } from 'app/lib/fetcher';
import { useLocalSearchParams } from 'app/lib/hooks/router'
import { ensureTabHistory, pushTabHistory } from 'app/lib/tab-history';
import * as SplashScreen from 'expo-splash-screen';

export async function getData(path, token, origin, headers, callback, params) {

    path = (!path || path.startsWith('expo-development-client')) ? 'home' : path;
    path = path.startsWith('/') ? path.substr(1) : path;
    path = `/api.php?r=system/get_page_by_request/TemplServicePages&params[]=${path}`;

    const uri = getURI(path);
   // const settings = appSetting('l-ayouts', uri);
    /*if (settings?.blocks) {
        const blockNames = Object.values(settings.blocks).map(block => block.name).join(',');
        path += `&params[]=${blockNames}`;
    }
*/
    if (params) {
        path += `&params[]=&params[]=${params}`;
    }

    const fetcherArgs = token || origin || headers || callback ? [path, token, '', origin, headers, callback] : path;
   
    const data = await fetcher(fetcherArgs);

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
        if (_path === '{profile}') {
            _path = currentUser?.url;
        }
        
        isRoot = true;
    }

    return <Content key={_path+local.refresh} pagePath={_path} currentUser={currentUser} tabKey={pathname} isRoot={isRoot} />


}

const Content = ({ pagePath, currentUser, tabKey, isRoot }) => {


    const [pageData, setPageData] = useState(null);
    const { bottomSheetData, setBottomSheetData } = useBottomSheetData();

    useEffect(() => {
        if (!tabKey) return;
        ensureTabHistory(tabKey, currentUser, pagePath);
    }, [tabKey, currentUser?.id, currentUser?.url, pagePath]);

    useEffect(() => {
        if (!tabKey || !pagePath) return;
        pushTabHistory(tabKey, pagePath, currentUser);
    }, [tabKey, pagePath, currentUser?.id, currentUser?.url]);

    useEffect(() => {
        if (!(pagePath && pagePath.startsWith('/') && !pagePath.includes('/?url='))) return;

        const fetchPageData = async () => {
            if (pageData?.data?.user?.id && pageData?.data?.user?.id === currentUser?.id && pageData?.data?.user?.confirmed === currentUser?.confirmed)
                return;
            const { path: pathWithoutQuery, queryString } = parseUrl(pagePath);
            const params = queryString ? JSON.stringify(parseQueryString(queryString)) : null;
            const data = await getData(pathWithoutQuery, null, null, null, null, params);
            if (data?.props) {
                data.props.data['timestamp'] = Date.now();
                setBottomSheetData(bottomSheetData !== false ? false : bottomSheetData);
                setPageData(data.props);
            }
        };
        fetchPageData();
    }, [pagePath, currentUser?.id, currentUser?.confirmed]);


    useEffect(() => {
        const prepareApp = async () => {
            if (pageData?.data) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                await SplashScreen.hideAsync();
            }
        };

        prepareApp();
    }, [pageData?.data]);
    return pageData?.data ? (

        <Root path={pagePath} data={pageData.data} uri={pageData.data.uri} />
    ) : <Loading />;
};