import { View } from 'app/design/view'
import Link from 'app/ui/atoms/link'
import { useRouter } from 'next/router';
import { Button } from 'app/design/controls'
import { menuItemsByName } from 'app/lib/util'

export default function ElementMainMenu(props) {

    const handleHideMenu = (params) => {}

    if (!props.menu_top.items)
        return <></>
    
    return (
        <View onPress={handleHideMenu} className="backdrop-blur h-full xl:flex shadow-xl p-4 2xl:bg-transparent 2xl:dark:bg-transparent  bg-navbar/80 dark:bg-navbar-dark/50 border-r 2xl:border-none border-neoborder dark:border-neoborder-dark flex-col space-y-2">
            <View className="flex-col space-y-0.5">
            {menuItemsByName('main_menu', props.menu_top.items).map((item, index) => (
                <Link key={`menu-${index}`} href= {item.link}>
                    <Button variant="text" startDecorator={item.icon.indexOf(' ') == -1 ? item.icon : item.icon.split(' ')[0]} fullWidth solid align='start' title = {item.title} />
                </Link>
            ))}
            </View>
        </View>
    );

}