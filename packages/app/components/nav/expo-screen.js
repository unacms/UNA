import { Root, getData } from 'app/root'
import { useState, useEffect } from 'react'
import { useNavigation, usePathname } from "expo-router";
import { useRoute} from '@react-navigation/native';
import { useCurrentUser } from 'app/context/user';
import { appSetting } from 'app/lib/util'
import { useIsFocused } from '@react-navigation/native';
import { Text } from 'app/design/typography'
export function Screen(params) {
    const { currentUser } = useCurrentUser();
    const navigation = useNavigation();
    const pathname = usePathname();
    const route = useRoute();
    const [pageData, setPageData] = useState(null);
  
    let _path = route?.path;
    if (!_path || _path.includes('/tab')){
        const tabList = currentUser
            ? appSetting('menu', 'bottom_tabs_logged')
            : appSetting('menu', 'bottom_tabs_non_logged');
            const item = tabList.find((item) => item.key === pathname);
            _path = item ? item.url : null;
    }

    const isFocused2 = useIsFocused();
    useEffect(() => {
        navigation.setOptions({ headerTitle: 'Loading...' });
        const fetchPageData = async () => {
            
            if (isFocused2 && _path && _path.startsWith('/')) {
                const data = await getData(_path);
                // console.log("-------------------- BootomTab Screen load data:", pathname, "--------------------",_path, "--------------------",data);
                if (data?.props) {
                    setPageData(data.props);
                    navigation.setOptions({ headerTitle: data.props.data.title });
                }
            }
      };
  
      fetchPageData();
    }, [_path]);

    return pageData?.data ? (
        <Root path={_path} data={pageData.data} uri={pageData.data.uri} />
    ) : null;
}
