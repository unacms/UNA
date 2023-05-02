import { Root, getData } from 'app/root'
import { useState, useEffect } from 'react'
import { useNavigation, usePathname } from "expo-router";
import { useRoute} from '@react-navigation/native';
import { useCurrentUser } from 'app/context/user';
import { appSetting } from 'app/lib/util'

export function Screen(params) {

    let { currentUser, setCurrentUser } = useCurrentUser();

    const navigation = useNavigation();

    setTimeout(() => {
        navigation.setOptions({ headerTitle:  "Loading..."  })
    }, 300);

    const pathname = usePathname();
    const route = useRoute();
    let _path = route?.path;

    if (!_path){
        const TabList = currentUser ? appSetting('menu', 'bottom_tabs_logged') : appSetting('menu', 'bottom_tabs_non_logged');
        const item = TabList.find((item) => item.key === pathname);
        _path = item ? item.url : null;
    }

    const [pageData, setPageData] = useState(null);

    useEffect(() => {
        (async () => {
            if (_path && _path.startsWith('/')){                
                const d = await getData(_path);
                //console.log("$$$$$$$$$$$$$$$$$BootomTab Screen load data:", params.route, "$$$$$",_path, "$$$$$",d);
                if (d?.props) {
                    setPageData (d?.props);
                }
            }
        })();
    }, [_path]);

    if (!!pageData?.data){
        navigation.setOptions({ headerTitle: pageData?.data?.title })
        return <Root path={_path} data={pageData?.data} uri={pageData?.data.uri}/>  
    }  
}
