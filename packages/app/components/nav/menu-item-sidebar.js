import { View, Row } from 'app/design/view'
import Link from 'app/ui/atoms/link'
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'
import { Theme } from 'app/design/theme';

export default function MenuItemSidebar({ link, title, index, icon, userUrl, isActive }) {
    const { colors } = Theme();
    return (
        <Link key={`menu-${index}`} href={link.replace('{profile}', userUrl)}>
            <View className="flex-auto h-12 items-between" key={`menu-${index}`}>
                <Link href={link} alt={title}>
                    <Row className={` justify-start ${isActive && 'bg-orange-500'}`}>
                        <Text className=""><Icon icon={icon} color={isActive ? colors.primary : colors.default} /></Text>
                        <Text>{title}</Text>
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