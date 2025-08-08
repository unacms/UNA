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
        <Link className="flex-auto" href={link} alt={title}>
            <Tooltip content={title}>
                <View className="flex-auto group" key={`menu-${index}`}>
                    <Row
                        className={`items-center justify-center py-3 min-w-16 rounded-xl  web:duration-300 web:group-active:opacity-50 ${isActive
                            ? 'bg-primary/10 text-primary web:group-hover:bg-primary/20'
                            : 'text-muted-foreground web:group-hover:text-foreground web:hover:bg-secondary'
                            }`}
                    >
                        <Icon
                            icon={icon}

                            className={`${isActive ? "text-primary " : "text-neutral-600 dark:text-neutral-400"}`}
                        />
                        {isTitle && <Text className={`whitespace-nowrap text-ellipsis overflow-hidden tracking-tight font-medium ${isActive ? 'text-primary' : 'text-neutral-800 dark:text-neutral-200'} text-base px-3 leading-6`}>{title}</Text>}
                    </Row>
                </View>
            </Tooltip>
        </Link>
    )
}
