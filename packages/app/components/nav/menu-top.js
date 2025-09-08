import { View, Row } from 'app/design/view'
import { useCurrentUser } from 'app/context/user'
import { menuItemsByName, appSetting } from 'app/lib/util'
import Link from 'app/ui/atoms/link'
import { useTranslation } from 'react-i18next'
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'
import Tooltip from 'app/ui/atoms/tooltip';

export default function MenuTop({ url, uri }) {
    const { currentUser } = useCurrentUser();
    const { t } = useTranslation()
    const menu_navbar_items = menuItemsByName(
        'main_menu',
        appSetting('menu_items', 'menu_navbar'),
        currentUser
    )

    return (
        <Row className={appSetting('layout', 'header', 'content_center')}>
            {menu_navbar_items.map((item, index) => {
                const isActive = item.link === '/' + url || (item.link === '/' && uri === 'home');
                return <MenuTopItem key={`bmi-${index}`} link={item.link} icon={item.icon} isTitle={item.showTitle} title={t(item.title)} isActive={isActive} />

            })}
        </Row>

    )
}

function MenuTopItem({ link, title, index, icon, isTitle, isActive }) {
    return (
        <Link className=" rounded-xl web:focus-visible:outline-none web:focus-visible:ring-2 min-w-16 flex-auto web:focus-visible:ring-ring web:focus-visible:ring-offset-2 web:focus-visible:ring-offset-background " href={link} alt={title}>
            <Tooltip content={title}>
                <View className="flex-auto group" key={`menu-${index}`}>
                    <Row
                        className={`items-center justify-center h-12 min-w-14 px-1.5 flex-auto rounded-xl web:duration-200 web:group-active:opacity-50 ${isActive
                            ? 'bg-secondary/50 text-primary  '
                            : 'text-muted-foreground web:group-hover:text-foreground web:hover:bg-secondary/50 '
                            }`}
                    >
                        <Icon
                            icon={icon}
                            className={`${isActive ? "text-primary h-9 w-9 items-center justify-center flex" : "text-muted-foreground web:group-hover:text-foreground h-9 w-9 items-center justify-center flex"}`}
                        />
                        {isTitle && <Text className={`whitespace-nowrap text-ellipsis overflow-hidden tracking-tight font-medium ${isActive ? 'text-primary' : 'text-neutral-800 dark:text-neutral-200'} text-base px-3 leading-6`}>{title}</Text>}
                    </Row>
                </View>
            </Tooltip>
        </Link>
    )
}
