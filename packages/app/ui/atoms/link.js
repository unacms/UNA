import { Pressable } from 'app/design/view'
import { Link, useGlobalSearchParams} from 'expo-router';
import { FeedbackHaptics } from 'app/lib/util';
import { useNavigation } from 'expo-router';
import { useCurrentUser } from 'app/context/user';
import { appSetting } from 'app/lib/util'
import { Text } from 'app/design/typography'

export default function ElementLink(props) {
    let { href, ...rest } = props
    const navigation = useNavigation();
    const glob = useGlobalSearchParams();

    if (!href)
        href = '/'
    let { currentUser, setCurrentUser } = useCurrentUser();

    const TabList = currentUser ? appSetting('menu_items', 'menu_tabbar_logged') : appSetting('menu_items', 'menu_tabbar_non_logged');

    const index = TabList.findIndex((item) => {
        if (item.url == href) {
            return true;
        }
    });

    if (index !== null && index > -1) {
        return <Pressable onPress={() => {
            props.haptics ? FeedbackHaptics(props.haptics) : ''
            navigation.navigate('tab' + index)
        }}>
            {props.children}
        </Pressable>

    }
    return (
        <Link 
          push
          href={{
            pathname: '/' + glob.name,
            params: { url: href }
          }}
          asChild {...rest}
        >
          {props.haptics ? (
            <Pressable onPress={() => FeedbackHaptics(props.haptics)}>
              {props.children}
            </Pressable>
          ) : (
            <Pressable>
            props.children
            </Pressable>
          )}
        </Link>
      );
}
