import { View } from 'app/design/view'
import { TouchableOpacity } from 'app/design/view'
import Link from 'app/ui/atoms/link'
import { Icon } from 'app/components/svg'
import { A, H1, P, Text, TextLink } from 'app/design/typography'
import { useRouter } from 'next/router';
import { Button } from 'app/design/controls'

export default function ElementMainMenu(props) {
    const router = useRouter()
    const path = router?.query?.path?.join('/')

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

    const hideMenu = (params) => {
      }
    

    return (
        <View onPress={hideMenu} className="h-full xl:flex px-3 py-4 2xl:bg-transparent 2xl:dark:bg-transparent  bg-sidebar dark:bg-sidebar-dark border-r 2xl:border-none border-neoborder/40 dark:border-neoborder-dark/40 flex-col space-y-2">
            <View className="flex-col space-y-0.5">
                {
                    menu.map( item => <Link href={item.url} key={item.icon.toString()}><Button variant="text" startDecorator={item.icon} fullWidth solid align='start' title ={item.title} /></Link>)
                }
            </View>
        </View>
    );

}