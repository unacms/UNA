import { Root, getData } from 'app/root'
import { useState, useEffect } from 'react'
import { useNavigation, usePathname } from "expo-router";
import { useRoute, useNavigationState  } from '@react-navigation/native';
import { useCurrentUser } from 'app/context/user';
import { appSetting } from 'app/lib/util'
import { useIsFocused } from '@react-navigation/native';
import { Text } from 'app/design/typography'
import Svg, {Path} from 'react-native-svg'

function SvgLogoMarkNative() {
    return (
        <Svg height="50" width="50"
        viewBox="0 0 240 240"
        
    >
        <Path d="M117.672 24.3335C119.234 22.7714 121.766 22.7714 123.329 24.3335L160.098 61.103C161.66 62.6651 161.66 65.1978 160.098 66.7599L123.329 103.529C121.766 105.092 119.234 105.092 117.672 103.529L80.9021 66.7599C79.34 65.1978 79.34 62.6651 80.9021 61.1031L117.672 24.3335Z" className=' text-primary dark:text-primary-dark' fill="red"/>
        <Path d="M117.672 24.3335C119.234 22.7714 121.766 22.7714 123.329 24.3335L160.098 61.103C161.66 62.6651 161.66 65.1978 160.098 66.7599L123.329 103.529C121.766 105.092 119.234 105.092 117.672 103.529L80.9021 66.7599C79.34 65.1978 79.34 62.6651 80.9021 61.1031L117.672 24.3335Z" className=' text-primary dark:text-primary-dark' fill="green"/>
        <Path d="M174.24 80.902C175.802 79.3399 178.335 79.3399 179.897 80.902L216.667 117.672C218.229 119.234 218.229 121.766 216.667 123.328L179.897 160.098C178.335 161.66 175.802 161.66 174.24 160.098L137.471 123.328C135.909 121.766 135.909 119.234 137.471 117.672L174.24 80.902Z"className=' text-primary dark:text-primary-dark' fill="blue"/>
        <Path d="M61.103 80.902C62.6651 79.3399 65.1978 79.3399 66.7599 80.902L103.529 117.672C105.092 119.234 105.092 121.766 103.529 123.328L66.7599 160.098C65.1978 161.66 62.6651 161.66 61.1031 160.098L24.3335 123.328C22.7714 121.766 22.7714 119.234 24.3335 117.672L61.103 80.902Z"className=' text-primary dark:text-primary-dark' fill="orange"/>
        <Path d="M117.672 137.471C119.234 135.908 121.766 135.908 123.328 137.471L135.854 149.996C137.416 151.559 137.416 154.091 135.854 155.653L123.328 168.179C121.766 169.741 119.234 169.741 117.672 168.179L105.146 155.653C103.584 154.091 103.584 151.559 105.146 149.996L117.672 137.471Z" className='group-hover:animate-pulse text-accent dark:text-accent-dark' fill="green"/>
        <Path d="M141.915 161.714C143.477 160.152 146.01 160.152 147.572 161.714L160.098 174.24C161.66 175.802 161.66 178.335 160.098 179.897L147.572 192.423C146.01 193.985 143.477 193.985 141.915 192.423L129.389 179.897C127.827 178.335 127.827 175.802 129.389 174.24L141.915 161.714Z" className='group-hover:animate-pulse text-accent dark:text-accent-dark' fill="green"/>
        <Path d="M93.428 161.714C94.9901 160.152 97.5227 160.152 99.0848 161.714L111.611 174.24C113.173 175.802 113.173 178.335 111.611 179.897L99.0848 192.423C97.5227 193.985 94.9901 193.985 93.428 192.423L80.9021 179.897C79.34 178.335 79.34 175.802 80.9021 174.24L93.428 161.714Z" className='group-hover:animate-pulse text-accent dark:text-accent-dark' fill="green"/>
        <Path d="M117.672 185.958C119.234 184.396 121.766 184.396 123.328 185.958L135.854 198.484C137.416 200.046 137.416 202.578 135.854 204.141L123.328 216.666C121.766 218.229 119.234 218.229 117.672 216.666L105.146 204.141C103.584 202.578 103.584 200.046 105.146 198.484L117.672 185.958Z" className='group-hover:animate-pulse text-accent dark:text-accent-dark' fill="green"/>

    
    </Svg>)

    };

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

    const backButtonPresented = useNavigationState((state) => {
        return state.routes.length > 1;
    });


    function Header(text){
        return backButtonPresented ? <><Text className='text-base'>{text}</Text></> : <><SvgLogoMarkNative/><Text className='text-base'>{text}</Text></>;
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
                    
                    if (backButtonPresented){
                        navigation.setOptions({ 
                            headerTitle:(props) => <><Text className='text-base'>{data.props.data.title}</Text></>
                        });
                    }
                    else{
                        navigation.setOptions({ 
                            headerTitle:(props) => Header(data.props.data.title)
                        });
                    }
                   
                }
            }
      };
  
      fetchPageData();
    }, [_path]);

    return pageData?.data ? (
        <Root path={_path} data={pageData.data} uri={pageData.data.uri} />
    ) : null;
}
