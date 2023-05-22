import { Root, getData } from 'app/root'
import { useState, useEffect } from 'react'
import { useNavigation, usePathname } from "expo-router";
import { useRoute, useNavigationState  } from '@react-navigation/native';
import { useCurrentUser } from 'app/context/user';
import { appSetting } from 'app/lib/util'
import { useIsFocused } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Theme } from 'app/design/theme';
import { View } from 'app/design/view';
import { updateRightHeader, updateCenterHeader } from 'app/lib/native-handlers'
import Profile from 'app/ui/molecules/profile';


export function Screen(params) {
    const { currentUser } = useCurrentUser();
    const navigation = useNavigation();
    const pathname = usePathname();
    const route = useRoute();
    const [pageData, setPageData] = useState(null);

    const routerExpo = useRouter();
    const { colors } = Theme();
  
    let _path = route?.path;
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

    const isFocused2 = useIsFocused();
    useEffect(() => {
       // navigation.setOptions({ headerTitle:() => Header('Loading')});
     //   navigation.setOptions({ headerRight:  () => (addButtons) });

        const fetchPageData = async () => {
            
            if (isFocused2 && _path && _path.startsWith('/')) {
                const data = await getData(_path);
                // console.log("-------------------- BootomTab Screen load data:", pathname, "--------------------",_path, "--------------------",data);
                if (data?.props) {
                    setPageData(data.props);
                    
                    /*if (backButtonPresented){
                        navigation.setOptions({ 
                            headerTitle:(props) => <><Text className='text-base'>{data.props.data.title}</Text></>
                        });
                    }
                    else{
                        navigation.setOptions({ 
                            header:(props) => Header(data.props.data.title)
                        });
                    }*/
                    let settings = appSetting('layouts', data.props.data.uri)
                    updateRightHeader(settings?.header, navigation);
                    let isProfile = appSetting('layout', 'show_user_icon');
                    let profile=<></>
                    if (isProfile && currentUser ){
                        let dUser = currentUser;
                        dUser.url_avatar = dUser.avatar
                        dUser.url = '/dashboard'
                        profile = <View className="mr-2"><Profile {...dUser} displayType="unit_wo_info" displaySize="xs" /></View>
                    }
                    updateCenterHeader(_path, data.props.data.title, backButtonPresented, navigation, routerExpo, colors, settings?.icon, profile);
                }
            }
      };
  
      fetchPageData();
    }, [_path]);

    return pageData?.data ? (
        <Root path={_path} data={pageData.data} uri={pageData.data.uri} />
    ) : null;
}
