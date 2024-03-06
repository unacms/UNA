import { Root } from 'app/root'
import { memo, useState, useEffect, useContext } from 'react'
import { useRoute, useIsFocused } from '@react-navigation/native';
import { useCurrentUser } from 'app/context/user';
import { appSetting, parseUrl, parseQueryString, getURI } from 'app/lib/util'
import { useRouter, useNavigation } from 'expo-router';
import { Theme } from 'app/design/theme';
import { View } from 'app/design/view';
import { updateRightHeader, updateCenterHeader } from 'app/lib/native-handlers'
import Profile from 'app/ui/molecules/profile';
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
    const isFocused = useIsFocused();
    const { bottomSheetData, setBottomSheetData } = useContext(BottomSheetData);
    const { t } = useTranslation();
    const pathname = params.tabname;
    const { currentUser } = useCurrentUser();
    const navigation = useNavigation();
    const route = useRoute();
    const [pageData, setPageData] = useState(null);
    const routerExpo = useRouter();
    const { colors } = Theme();

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

    useEffect(() => {
        if (!isFocused) return;
        if (!(_path && _path.startsWith('/') && !_path.includes('/?url='))) return;

        const fetchPageData = async () => {
            const { path: pathWithoutQuery, queryString } = parseUrl(_path);
            const params = queryString ? JSON.stringify(parseQueryString(queryString)) : null;
            const data = await getData(pathWithoutQuery, null, null, null, null, params);

            if (data?.props) {
                setBottomSheetData(bottomSheetData !== false ? false : bottomSheetData);
                let settings = appSetting('layouts', data.props.data.uri)
                const profileDisplay = currentUser && appSetting('layout', 'show_user_icon')
                    ? <View className="mr-2">
                        <Profile {...{ ...currentUser, url_avatar: currentUser.avatar }} displayType="unit_wo_info" displaySize="xs" />
                    </View>
                    : <></>;

                updateRightHeader(currentUser ? settings?.header : null, navigation);
                updateCenterHeader(_path, t(data.props.data.title), false, navigation, routerExpo, colors, '', profileDisplay);
                setPageData(data.props);
            }
        };
        fetchPageData();
    }, [_path, isFocused]);


    if (!isFocused)
        return <></>;

    return pageData?.data ? (
        <Convo path={_path} pageData={pageData} />
    ) : <Loading />;
}

const Convo = memo(({ _path, pageData }) => {
    return <Root path={_path} data={pageData.data} uri={pageData.data.uri} />
});
