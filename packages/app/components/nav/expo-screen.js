import { Root, getData } from 'app/root'
import { useState, useEffect } from 'react'
import { useNavigation } from "expo-router";
import { useRoute, useNavigationState  } from '@react-navigation/native';
import { useCurrentUser } from 'app/context/user';
import { appSetting, parseUrl, parseQueryString } from 'app/lib/util'

import { useRouter } from 'expo-router';
import { Theme } from 'app/design/theme';
import { View } from 'app/design/view';
import { updateRightHeader, updateCenterHeader } from 'app/lib/native-handlers'
import Profile from 'app/ui/molecules/profile';
//import * as Linking from 'expo-linking';
import { MMKVLoader } from "react-native-mmkv-storage";
import { Text } from 'app/design/typography';

export function Screen(params) {

    const pathname = params.tabname;
    const { currentUser } = useCurrentUser();
    const navigation = useNavigation();
   
    const route = useRoute();
    const [pageData, setPageData] = useState(null);

    const routerExpo = useRouter();
    const { colors } = Theme();
  
    let _path = route?.path;
    //console.log('*** update screen ***--' + _path, params)

    // DEEP LINKING
    /*const url = Linking.useURL();
    if (url &&  typeof url !== 'undefined'){
        let a = parseUrl(url);
        _path = '/'+ a.path + (a.queryString ? '?' + a.queryString : '')
        if (_path == '/')
            _path = '/home';
    }*/
    // DEEP LINKING
    
    if (!_path || _path.includes('/tab')){
        const tabList = currentUser
            ? appSetting('menu', 'bottom_tabs_logged')
            : appSetting('menu', 'bottom_tabs_non_logged');
            const item = tabList.find((item) => item.key === pathname);
            _path = item ? item.url : null;
    }

    const backButtonPresented = useNavigationState((state) => {
        return state.routes.length > 1;
    });

    const isFocused2 = true;//useIsFocused();

    useEffect(() => {
        const fetchPageData = async () => {
            if (isFocused2 && _path && _path.startsWith('/') && !_path.includes('/?url=')) {
                let path2 = _path;
                let b = parseUrl(_path);
                let params = null;
                if (b.queryString){
                    path2 = b.path;
                    params = JSON.stringify(parseQueryString(b.queryString));
                }
                const MMKV = new MMKVLoader().withInstanceID("userId" + (currentUser ? currentUser.id : '0')).initialize();
                    
                let cacheData = await MMKV.getStringAsync('page-' + path2);
                let data = null;

                if (!cacheData){
                    data = await getData(path2, null, null, null, null, params);
                    await MMKV.setStringAsync('page-' + path2, JSON.stringify(data));
                }
                else{
                    //console.log('------------------- from cache :' + _path)
                    data = JSON.parse(cacheData);
                }

                if (data?.props) {
                    setPageData(data.props);

                    let settings = appSetting('layouts', data.props.data.uri)
                    updateRightHeader(settings?.header, navigation);
                    let isProfile = appSetting('layout', 'show_user_icon');
                    let profile=<></>
                    if (isProfile && currentUser ){
                        let dUser = Object.assign({}, currentUser);
                        dUser.url_avatar = dUser.avatar
                        dUser.url = '/dashboard'
                        profile = <View className="mr-2"><Profile {...dUser} displayType="unit_wo_info" displaySize="xs" /></View>
                    }
                    //settings?.icon
                    updateCenterHeader(_path, data.props.data.title, backButtonPresented, navigation, routerExpo, colors, '', profile);
                }
            }
      };
  
      fetchPageData();
    }, [_path]);
  
    return pageData?.data ? (
        <Root path={_path} data={pageData.data} uri={pageData.data.uri} />
    ) : <></>;
}
