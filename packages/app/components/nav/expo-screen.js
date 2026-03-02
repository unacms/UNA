import { Root } from 'app/root'
import { useState, useEffect } from 'react'
import { useCurrentUser } from 'app/context/user';
import { appSetting, parseUrl, parseQueryString, getURI, getPageSettings } from 'app/lib/util'
import { Loading } from 'app/customization/loading'
import { useBottomSheetData } from 'app/context/bottomsheet';
import { fetcher } from 'app/lib/fetcher';
import { useLocalSearchParams } from 'app/lib/hooks/router'
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
        isRoot = true;
    }
    return <Content key={_path+local.refresh} pagePath={_path} currentUser={currentUser} isRoot={isRoot} />


}

const Content = ({ pagePath, currentUser, isRoot }) => {


    const [pageData, setPageData] = useState(null);
    const { bottomSheetData, setBottomSheetData } = useBottomSheetData();
    useEffect(() => {
        if (!(pagePath && pagePath.startsWith('/') && !pagePath.includes('/?url='))) return;

        let isActive = true;
        const fetchPageData = async () => {
            if (pageData?.data?.user?.id && pageData?.data?.user?.id === currentUser?.id && pageData?.data?.user?.confirmed === currentUser?.confirmed)
                return;
            const { path: pathWithoutQuery, queryString } = parseUrl(pagePath);
            const params = queryString ? JSON.stringify(parseQueryString(queryString)) : null;
            const expectedUserId = currentUser?.id;
            const maxAttempts = expectedUserId ? 4 : 1;

            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                const data = await getData(pathWithoutQuery, null, null, null, null, params);
                if (!isActive || !data?.props) return;

                const responseUserId = data?.props?.data?.user?.id;
                const isStaleUserResponse =
                    expectedUserId &&
                    responseUserId &&
                    responseUserId !== expectedUserId;

                if (isStaleUserResponse) {
                    if (attempt < maxAttempts - 1) {
                        await new Promise((resolve) => setTimeout(resolve, 200));
                        continue;
                    }
                    return;
                }

                data.props.data['timestamp'] = Date.now();
                setBottomSheetData(bottomSheetData !== false ? false : bottomSheetData);
                setPageData(data.props);
                return;
            }
        };
        fetchPageData();
        return () => {
            isActive = false;
        };
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