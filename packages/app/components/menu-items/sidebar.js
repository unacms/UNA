import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'
import { isEmoji } from 'app/lib/util';
import { getComponent } from 'app/components/registry';

export default function MenuItemSidebar({ title, icon, isActive, addon, iconEnd }) {
    const CounterIndicator = getComponent('molecule', 'counter_indicator')
    return (
        <Row className="w-full items-center">

            <View className={`h-8 w-8 items-center justify-center flex rounded-full ${isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/60 text-secondary-foreground web:group-hover:shadow-btn-outline dark:web:group-hover:shadow-btn-outline-deep web:group-hover:bg-card/80 web:group-hover:text-foreground web:duration-200'
                }`}>
                {isEmoji(icon) ? <Text>{icon}</Text> : <Icon icon={icon} size="16" className={`${isActive ? 'text-primary-foreground' : 'text-secondary-foreground web:group-hover:text-foreground'}`} />}
            </View>

            <Text className={`flex-1 px-2 text-sm leading-tighter font-semibold  ${isActive ? 'text-accent-foreground' : 'text-secondary-foreground web:group-hover:text-foreground'}`}>{title}</Text>
            {!!iconEnd && <View className={`ml-auto h-8 w-8 items-center justify-center flex rounded-full ${isActive
                    ? ' text-primary-foreground'
                    : 'text-secondary-foreground '
                }`}>
                {isEmoji(iconEnd) ? <Text>{iconEnd}</Text> : <Icon icon={iconEnd} size="20" className={`${isActive ? 'text-primary-foreground' : 'text-secondary-foreground web:group-hover:text-foreground'}`} />}
            </View>}
            <CounterIndicator addon={addon} isTitle={true} />
        </Row>
    )
}