import { Root } from 'app/root'
import { useState, useEffect, useContext } from 'react'
import { useRoute, useNavigationState } from '@react-navigation/native';
import { useCurrentUser } from 'app/context/user';
import { appSetting, parseUrl, parseQueryString, getURI} from 'app/lib/util'
import { useRouter, useNavigation } from 'expo-router';
import { Theme } from 'app/design/theme';
import { View } from 'app/design/view';
import { updateRightHeader, updateCenterHeader } from 'app/lib/native-handlers'
import Profile from 'app/ui/molecules/profile';
import * as Linking from 'expo-linking';
import { useTranslation } from 'react-i18next';
import { Loading } from 'app/loading'
import { BottomSheetData } from 'app/context/bottomsheet';
import { fetcher } from 'app/lib/fetcher';

// this function is called in Next as serverSideProps and in Expo to get data dynamically
export async function getData(path, token, origin, headers, callback, params) {
    if (!path || path.startsWith('expo-development-client'))
	    path = 'home';

    path = path.startsWith('/') ? path.substr(1) : path;    
    path = '/api.php?r=system/get_page_by_request/TemplServicePages&params[]=' + path;

	const uri = getURI(path);
    let settings = appSetting('layouts', uri)
    if (settings && settings?.blocks){
        path = path + '&params[]=' + (Object.values(settings.blocks).map(block => block.name)).join(',')
    }
    else{
        if (params)
            path = path + '&params[]=';
    }

    if (params){
        path = path + '&params[]=' + params
    }
    // TODO: pass GET&POST params
    const t1 = Date.now();
    const data = await fetcher(token || origin || headers || callback ? [path, token, '', origin, headers, callback] : path);
    const diff = Date.now() - t1;
    return { props: { uri:(path.length ? path[0] : 'home'), ...data } }
}

export function Screen(params) {
    const { bottomSheetData, setBottomSheetData } = useContext(BottomSheetData);
    const { t } = useTranslation();
    const pathname = params.tabname;
    const { currentUser } = useCurrentUser();
    const navigation = useNavigation();
    const route = useRoute();
    const [pageData, setPageData] = useState(null);
    const routerExpo = useRouter();
    const { colors } = Theme();

    let _path = route?.params?.path && Array.isArray(route?.params?.path) ? '/' + route?.params?.path?.join('/') : null;//route?.path;
    if (route?.params) {
        let p = JSON.parse(JSON.stringify(route?.params))
        delete p.path;
        if (Object.keys(p).length > 0)
            _path = _path + '&params[]=&params[]=' + JSON.stringify(p);
    }

    // BOTTOM TABS NAVIGATION
    if (!_path || _path.includes('/tab')) {
        const tabList = currentUser
            ? appSetting('menu_items', 'menu_bottom_tabs_logged')
            : appSetting('menu_items', 'menu_bottom_tabs_non_logged');
        const item = tabList.find((item) => item.key === pathname);
        _path = item ? item.url : null;
    }
    // BOTTOM TABS NAVIGATION

    const backButtonPresented = false;
    const isFocused2 = true;

    useEffect(() => {
        const fetchPageData = async () => {
            if (isFocused2 && _path && _path.startsWith('/') && !_path.includes('/?url=')) {
                let path2 = _path;
                let b = parseUrl(_path);
                let params = null;
                if (b.queryString) {
                    path2 = b.path;
                    params = JSON.stringify(parseQueryString(b.queryString));
                }
                let data = await getData(path2, null, null, null, null, params);
                if (data?.props) {
                    setPageData(data.props);
                }

            }
        };
        fetchPageData();
    }, [_path]);

    useEffect(() => {
        //console.log('--------------')
        if (pageData) {
            if (bottomSheetData !== false)
                setBottomSheetData(false);
            let settings = appSetting('layouts', pageData.data.uri)
            updateRightHeader(currentUser? settings?.header : null, navigation);
            let isProfile = appSetting('layout', 'show_user_icon');
            let profile = <></>
            if (isProfile && currentUser) {
                let dUser = Object.assign({}, currentUser);
                dUser.url_avatar = dUser.avatar
                profile = <View className="mr-2"><Profile {...dUser} displayType="unit_wo_info" displaySize="xs" /></View>
            }
            updateCenterHeader(_path, t(pageData.data.title), backButtonPresented, navigation, routerExpo, colors, '', profile);
        }
    }, [pageData]);


    return pageData?.data ? (
        <Root path={_path} data={pageData.data} uri={pageData.data.uri} />
    ) : <Loading />;
}
