import { Root, getData } from 'app/root'
import { useState, useEffect } from 'react'
import { useNavigation, usePathname } from "expo-router";
import { useRoute} from '@react-navigation/native';
import { useCurrentUser } from 'app/context/user';
import { appSetting } from 'app/lib/util'

export function Screen(params) {
    const { currentUser } = useCurrentUser();
    const navigation = useNavigation();
    const pathname = usePathname();
    const route = useRoute();
    const [pageData, setPageData] = useState(null);
  
    useEffect(() => {
        navigation.setOptions({ headerTitle: 'Loading...' });
  
        const fetchPageData = async () => {
            const tabList = currentUser
            ? appSetting('menu', 'bottom_tabs_logged')
            : appSetting('menu', 'bottom_tabs_non_logged');
    
            const item = tabList.find((item) => item.key === pathname);
            let path = item ? item.url : null;
            path = path === '/tab0' ? '/home' : path;
    
            if (path && path.startsWith('/')) {
                const data = await getData(path);
                //console.log("$$$$$$$$$$$$$$$$$BootomTab Screen load data:", _path, "$$$$$",_path, "$$$$$",d);
                if (data?.props) {
                    setPageData(data.props);
                    navigation.setOptions({ headerTitle: data.props.data.title });
                }
            }
      };
  
      fetchPageData();
    }, [currentUser, pathname, navigation]);
  
    return pageData?.data ? (
        <Root path={pathname} data={pageData.data} uri={pageData.data.uri} />
    ) : null;
}
