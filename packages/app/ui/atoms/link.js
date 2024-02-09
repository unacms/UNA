import { Pressable } from 'app/design/view'
import { Link } from 'expo-router';
import { FeedbackHaptics } from 'app/lib/util';
import { useNavigation } from 'expo-router';
import { useCurrentUser } from 'app/context/user';
import { appSetting } from 'app/lib/util'

export default function ElementLink(props) {
    const navigation = useNavigation();

    if (!props.href)
        props.href = '/'
    let { currentUser, setCurrentUser } = useCurrentUser();

    const TabList = currentUser ? appSetting('menu_items', 'menu_bottom_tabs_logged') : appSetting('menu_items', 'menu_bottom_tabs_non_logged');

    const index = TabList.findIndex((item) => {
        if (item.url == props.href) {
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
        <Link href={props.href} asChild {...props}>
            <Pressable onPress={() => {
                props.haptics ? FeedbackHaptics(props.haptics) : ''
            }}>
                {props.children}
            </Pressable>
        </Link>
    )
}
