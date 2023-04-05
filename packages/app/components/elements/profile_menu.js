import { View } from 'app/design/view';
import Link from 'app/ui/atoms/link'
import { Button } from 'app/design/controls'

export default function ElementProfileMenu(props) {
    return (
        <View className="h-full xl:flex px-3 py-4 2xl:bg-transparent 2xl:dark:bg-transparent  bg-sidebar dark:bg-sidebar-dark border-r 2xl:border-none border-neoborder dark:border-neoborder-dark flex-col space-y-2">
            <View className="flex-col space-y-0.5">
            {props.data.items.map((item, index) => (
                <Link key={`menu-${index}`} href= {'/' + item.link}>
                    <Button variant="text" startDecorator={item.icon} fullWidth solid align='start' title = {item.title} />
                </Link>
            ))}
            </View>
        </View>
    );
}
