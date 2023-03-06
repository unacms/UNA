import { View } from 'app/design/view'
import { TouchableOpacity } from 'app/design/view'
import Link from 'app/ui/atoms/link'
import { Icon } from 'app/components/svg'
import { A, H1, P, Text, TextLink } from 'app/design/typography'
import { useRouter } from 'next/router';


export default function ElementMainMenu(props) {
    const router = useRouter()
    const path = router?.query?.path?.join('/')
    console.log(path);

    let menu = [
        {'title': 'Home', 'url': '/home', 'icon': 'home'},
        {'title': 'Discover', 'url': '/timeline-view-home', 'icon': 'discover'},
        {'title': 'Posts', 'url': '/posts-home', 'icon': 'post'},
        {'title': 'Groups', 'url': '/groups-home', 'icon': 'group'},
        {'title': 'Channels', 'url': '/channels-home', 'icon': 'hash'},
        {'title': 'People', 'url': '/persons-home', 'icon': 'people'},
        {'title': 'Contact', 'url': '/contact', 'icon': 'contact'},
        {'title': 'About', 'url': '/about', 'icon': 'about'}
    ]

    return (
        <View className="h-full xl:flex px-3 py-4 2xl:bg-transparent 2xl:dark:bg-transparent  bg-sidebar dark:bg-sidebar-dark border-r 2xl:border-none border-bordercolor/10 dark:border-bordercolor-dark/10 flex-col space-y-2">
            <View className="flex-col space-y-0.5">
                {
                    menu.map( item => <Link href={item.url}>
                        <View className={'/' + path == item.url ? "group flex-row space-x-3 items-center rounded-lg p-3 duration-200 bg-item-hover/50 dark:bg-item-hover-dark/50" : "group flex-row space-x-3 items-center rounded-lg p-3   duration-200 hover:bg-item-hover/50 dark:hover:bg-item-hover-dark/50"}>
                            <Icon icon={item.icon} className="h-6 w-6 group-hover:text-neo-800 text-neo-500 dark:group-hover:text-neo-100 dark:text-neo-300 "></Icon>
                            <Text className="text-base font-medium duration-200 group-hover:text-neo-900 text-neo-700 dark:group-hover:text-neo-50 dark:text-neo-200 ">{item.title}</Text>
                        </View>
                    </Link>)
                }
            </View>
        </View>
    );

}