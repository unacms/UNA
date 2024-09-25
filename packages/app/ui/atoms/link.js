import { Pressable } from 'app/design/view'
import { Link, useGlobalSearchParams } from 'expo-router';
import { FeedbackHaptics } from 'app/lib/util';
import { useNavigation } from 'expo-router';
import { useCurrentUser } from 'app/context/user';
import { appSetting, getDomainFromUrl } from 'app/lib/util'
import { Text } from 'app/design/typography'
import * as WebBrowser from 'expo-web-browser';

export default function ElementLink(props) {
    let { href, target, ...rest } = props
    const navigation = useNavigation();
    const glob = useGlobalSearchParams();
    let { currentUser, setCurrentUser } = useCurrentUser();

    const TabList = currentUser ? appSetting('menu_items', 'menu_tabbar_logged') : appSetting('menu_items', 'menu_tabbar_non_logged');


    if (href == 'javascript:' || href === undefined || href == '/javascript:')
        href='';

    if (href == ''){
        return props.children
    }
   
    if ((href == '/home' || href == '')){
        href ='/'
    }

    const index = TabList.findIndex((item) => {
        if (href.includes(item.url)) {
            return true;
        }
    });

    /*if (index !== null && index > -1) {
        return <Pressable onPress={() => {
            props.haptics ? FeedbackHaptics(props.haptics) : ''
            navigation.navigate('tab' + index)
        }}>
            {props.children}
        </Pressable>

    }*/
    let p = {
        pathname: index !== null && index > -1 ? '/tab' + index : '/' + glob.name,
        params: { url: href }
    }
    if (target){
        p = href;
    }
    const domain = getDomainFromUrl(href);
    const rootUrl = appSetting('config', 'native_app_images_url');// MAY BE NEED TO CHANGE
    if (domain && domain != rootUrl) {
        return <Pressable onPress={async () => {
            let result = await WebBrowser.openBrowserAsync(href);
 
        }}>
            {props.children}
        </Pressable>
    }



    return (
        <Link
            push
            href={p}
            asChild {...rest}
        >
            {props.haptics ? (
                <Pressable onPress={() => FeedbackHaptics(props.haptics)}>
                    {props.children}
                </Pressable>
            ) : (
                <Pressable>
                    {props.children}
                </Pressable>
            )}
        </Link>
    );
}
