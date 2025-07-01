import { View, Row } from 'app/design/view'
import { useCurrentUser } from 'app/context/user'
import { menuItemsByName, appSetting } from 'app/lib/util'
import Link from 'app/ui/atoms/link'
import { useTranslation } from 'react-i18next'
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'
import { Theme } from 'app/design/theme';
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
        <Row className="hidden lg:flex flex-auto w-full mx-auto max-w-3xl gap-x-0.5 justify-between items-center align-middle ">
            {menu_navbar_items.map((item, index) => {
                const isActive = item.link === '/' + url || (item.link === '/' && uri === 'home');
                return <MenuTopItem key={`bmi-${index}`} link={item.link} icon={item.icon} isTitle={item.showTitle} title={t(item.title)} isActive={isActive} />

            })}
        </Row>

    )
}

function MenuTopItem({ link, title, index, icon, isTitle, isActive }) {
    const { colors } = Theme()
    return (
        <Link className="flex-auto" href={link} alt={title}>
            <Tooltip content={title}>
            <View className="flex-auto group" key={`menu-${index}`}>
                <Row
                    className={`items-center justify-center h-12 min-w-16 rounded-xl  web:duration-300 group-active:opacity-50 ${
                        isActive 
                            ? 'bg-bgritemprimary text-primary dark:text-primary-d dark:bg-bgritemprimary-d group-hover:bg-bgritemprimary-h dark:group-hover:bg-bgritemprimary-dh'
                            : 'text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-950 dark:group-hover:text-neutral-50 hover:bg-neutral-900/10 dark:hover:bg-neutral-100/10'
                    }`}
                >
                    <Icon
                        icon={icon}
                        size="28"
                        color={isActive ? colors.primary : colors.barsColor}
                    />
                    {isTitle && <Text className={`whitespace-nowrap text-ellipsis overflow-hidden tracking-tight font-medium ${isActive ? 'text-primary dark:text-primary-d' : 'text-neutral-800 dark:text-neutral-200'} text-lg px-3 web:text-lg native:text-lg leading-7`}>{title}</Text>}
                </Row>
                {/* {isActive && (
                    <View className="-bottom-1.5 w-full bg-primary dark:bg-primary-d rounded-xl h-0.5 animate-appear" />
                )} */}
            </View>
            </Tooltip>
        </Link>
    )
}
