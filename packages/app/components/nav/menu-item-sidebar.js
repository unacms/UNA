import { View, Row } from 'app/design/view'
import Link from 'app/ui/atoms/link'
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'
import { Theme } from 'app/design/theme';

export default function MenuItemSidebar({ link, title, index, icon, userUrl, isActive }) {
    const { colors } = Theme();
    return (
        <Link href={link.replace('{profile}', userUrl)}>
            <View className="flex-auto group h-12 justify-between" key={`menu-${index}`}>
                <Link href={link} alt={title}>
                    <Row className={`h-12 px-2 items-center gap-x-3 group-hover:bg-neutral-500/10 rounded-xl ${isActive && 'bg-primary/10'}`}>
                        <Text className="h-9 w-9 p-2 bg-neutral-200 dark:bg-neutral-800 group-hover:bg-neutral-300 dark:group-hover:bg-neutral-700 rounded-full"><Icon icon={icon} size="20" color={isActive ? colors.primary : colors.default} /></Text>
                        <Text className="text-base font-medium text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-neutral-100">{title}</Text>
                    </Row>
                </Link>
            </View>
        </Link>
    )
}

/* <Button
                            variant="text"
                            startDecorator={item.icon}
                            fullWidth
                            solid
                            align="start"
                            title={t(item.title)}
                            size="base"
                            bgrDecorator
                        />*/