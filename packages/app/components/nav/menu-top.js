import { View, Row } from 'app/design/view'
import { Button } from 'app/design/controls'
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
        <Row className="hidden lg:flex flex-auto ">
            <Row className="w-full mx-auto gap-x-0.5 max-w-2xl justify-between">
                {menu_navbar_items.map((item, index) => {
                    const isActive = item.link === '/' + url || (item.link === '/' && uri === 'home');
                    return <MenuTopItem key={`bmi-${index}`} link={item.link} icon={item.icon} isTitle={item.showTitle} title={t(item.title)} isActive={isActive} />

                })}
            </Row>
        </Row>

    )
}

function MenuTopItem({ link, title, index, icon, isTitle, isActive }) {
    const { colors } = Theme()
    return (
        <Link className="flex-auto" href={link} alt={title}>
            <Tooltip content={title}>
            <View className="flex-auto group h-14 p-1" key={`menu-${index}`}>
                <Row
                    className={` group-hover:bg-neutral-500/10 duration-300 items-center justify-center h-12 min-w-12 rounded-xl ${
                        isActive && ' group-hover:bg-transparent'
                    }`}
                >
                    <Text className="text-neutral-600 dark:text-neutral-400">
                        <Icon
                            icon={icon}
                            size="24"
                            color={isActive ? colors.primary : colors.default}
                        />
                    </Text>
                    {isTitle && <Text>{title}</Text>}
                </Row>
                {isActive && (
                    <View className="-bottom-1.5 w-full bg-primary dark:bg-primary-d rounded-xl h-0.5 animate-appear" />
                )}
            </View>
            </Tooltip>
        </Link>
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