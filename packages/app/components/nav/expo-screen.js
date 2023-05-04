import { Root, getData } from 'app/root'
import { useState, useEffect } from 'react'
import { useNavigation, usePathname } from "expo-router";
import { useRoute, useNavigationState  } from '@react-navigation/native';
import { useCurrentUser } from 'app/context/user';
import { appSetting, SvgLogoNative } from 'app/lib/util'
import { useIsFocused } from '@react-navigation/native';
import { Text } from 'app/design/typography'
import Svg, {Path} from 'react-native-svg'
import { View, Row, Pressable } from 'app/design/view'
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from 'app/ui/atoms/icon'; 
import { useRouter } from 'expo-router';
import { Theme } from 'app/design/theme';

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


    function Header(text){      
        return (
            <Row className='w-full h-16 items-center '>
                { backButtonPresented ? <Pressable className="mr-4 bg-backgroundcell dark:bg-backgroundcell-dark  w-10 h-10 rounded-full justify-center items-center" onPress={routerExpo.back} >
                <Icon icon="left" width={24} height={24} color={colors.barsColor} /></Pressable> :<></>}
                { _path =='/home' ? <SvgLogoNative/> : <Text className='font-bold  text-white dark:text-gray-50 text-xl'>{text}</Text>}
            </Row>
        )
    }

    const isFocused2 = useIsFocused();
    useEffect(() => {
        navigation.setOptions({ headerTitle:() => Header('Loading')});
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
                    navigation.setOptions({ 
                        headerBackVisible: false, 

                        headerTitle:(props) => Header(data.props.data.title)
                    });
                   
                }
            }
      };
  
      fetchPageData();
    }, [_path]);

    return pageData?.data ? (
        <Root path={_path} data={pageData.data} uri={pageData.data.uri} />
    ) : null;
}
