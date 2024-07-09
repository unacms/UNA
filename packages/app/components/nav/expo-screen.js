import { Root } from 'app/root'
import { memo, useState, useEffect, useContext, useMemo } from 'react'
import { useRoute } from '@react-navigation/native';
import { useCurrentUser } from 'app/context/user';
import { appSetting, parseUrl, parseQueryString, getURI } from 'app/lib/util'
import { useRouter, useNavigation } from 'expo-router';
import { Theme } from 'app/design/theme';

import { updateRightHeader, updateCenterHeader } from 'app/lib/native-handlers'

import { useTranslation } from 'react-i18next';
import { Loading } from 'app/loading'
import { BottomSheetData } from 'app/context/bottomsheet';
import { fetcher } from 'app/lib/fetcher';

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
    const pathname = params.tabname;
    const { currentUser } = useCurrentUser();
    const route = useRoute();

    let _path = route?.params?.path && Array.isArray(route?.params?.path)
        ? `/${route.params.path.join('/')}`
        : null;

    if (route?.params) {
        const { path, ...otherParams } = route.params;
        if (Object.keys(otherParams).length > 0) {
            _path += `&params[]=&params[]=${JSON.stringify(otherParams)}`;
        }
    }


    // BOTTOM TABS NAVIGATION
    if (!_path || _path.includes('/tab')) {
        const tabListKey = currentUser ? 'menu_tabbar_logged' : 'menu_tabbar_non_logged';
        const tabList = appSetting('menu_items', tabListKey);
        const item = tabList.find((item) => item.key === pathname);
        _path = item ? item.url : null;
    }
    console.log("_path", _path, params)
    const memoizedValue = useMemo(() => {
        return <Content pagePath={_path} currentUser={currentUser} />;
    }, [_path, currentUser?.id]);

    return memoizedValue
}

const Content = ({ pagePath, currentUser }) => {
    ;
    const [pageData, setPageData] = useState(null);
    const navigation = useNavigation();
    const routerExpo = useRouter();
    const { colors } = Theme();
    const { t } = useTranslation();
    const { bottomSheetData, setBottomSheetData } = useContext(BottomSheetData);
    useEffect(() => {
        if (!(pagePath && pagePath.startsWith('/') && !pagePath.includes('/?url='))) return;

        const fetchPageData = async () => {

            const { path: pathWithoutQuery, queryString } = parseUrl(pagePath);
            const params = queryString ? JSON.stringify(parseQueryString(queryString)) : null;
            const data = await getData(pathWithoutQuery, null, null, null, null, params);

            if (data?.props) {
                setBottomSheetData(bottomSheetData !== false ? false : bottomSheetData);
                setPageData(data.props);
            }
        };
        fetchPageData();
    }, [pagePath, currentUser?.id]);

    useEffect(() => {
        if (pageData) {
            const settings = appSetting('layouts', pageData.data.uri)
            const profileDisplay = <></>;
            updateRightHeader(currentUser ? settings?.header : null, navigation);
            updateCenterHeader(pagePath, t(pageData.data.name), false, navigation, routerExpo, colors, '', profileDisplay, currentUser);
        }
    }, [pageData, currentUser?.id]);

    return pageData?.data ? (

        <Root path={pagePath} data={pageData.data} uri={pageData.data.uri} />
    ) : <Loading />;
    // return <><Text>{pagePath}-{currentTime}-{JSON.stringify(pageData)}</Text><Link href="/contact"><Text>link</Text></Link></>
};
/*
<Convo _path={pagePath} pageData={pageData} />
const Convo = memo(({ _path, pageData }) => {
    return <Root path={_path} data={pageData.data} uri={pageData.data.uri} />
});*/
