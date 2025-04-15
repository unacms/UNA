import { View, Row } from 'app/design/view'
import { Button } from 'app/design/controls'
import { useCurrentUser } from 'app/context/user'
import { menuItemsByName, appSetting } from 'app/lib/util'
import Link from 'app/ui/atoms/link'
import { useTranslation } from 'react-i18next'
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'
import { Theme } from 'app/design/theme';

export default function MenuTop({ url, uri }) {
    const { currentUser } = useCurrentUser();
    const { t } = useTranslation()
    const menu_navbar_items = menuItemsByName(
        'main_menu',
        appSetting('menu_items', 'menu_navbar'),
        currentUser
    )

    return (
        <Row className="hidden lg:flex flex-auto ">
            <Row className="w-full mx-auto gap-x-0.5 max-w-2xl justify-between">
                {menu_navbar_items.map((item, index) => {
                    const isActive = item.link === '/' + url || (item.link === '/' && uri === 'home');
                    return <MenuTopItem link={item.link} icon={item.icon} isTitle={item.showTitle} title={t(item.title)} isActive={isActive} />

                })}
            </Row>
        </Row>

    )
}

function MenuTopItem({ link, title, index, icon, isTitle, isActive }) {
    const { colors } = Theme();
    return (
        <View className="flex-auto" key={`menu-${index}`}>
            <Link href={link} alt={title}>
                <Row className={` justify-center ${isActive && 'bg-orange-500'}`}>
                    <Text className="text-rimary"><Icon icon={icon} color={isActive? colors.primary : colors.default} /></Text>
                    {isTitle && <Text>{title}</Text>}
                </Row>
            </Link>
        </View>
    )
}

/*<Button
    pressed={isCurrent}
    variant="tab"
    size="lg"
    tooltip={title}
    title={isTitle ? title : ''}
    alt={title}
    aria-label={title}
    fullWidth
    startDecorator={icon}
    align="center"
    indicator={isCurrent}
    indicatorPosition="bottom"
    indicatorClassName=" animate-appear translate-y-[6px] h-[3px] w-full bg-indicator dark:bg-indicator-d rounded-full"
/>*/