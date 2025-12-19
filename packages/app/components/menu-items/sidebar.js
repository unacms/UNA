import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'
import { isEmoji } from 'app/lib/util';
import { getComponent } from 'app/components/registry';

export default function MenuItemSidebar({ title, icon, isActive, addon }) {
    const CounterIndicator = getComponent('molecule', 'counter_indicator')
    return (
        <Row className={` px-2 py-1.5 items-center group rounded-xl ${isActive && 'bg-primary/10 web:hover:bg-muted/60 ' || ' web:hover:bg-muted/60 '}`}>

            <View className={`h-9 w-9 items-center justify-center flex rounded-full ${isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/50 text-secondary-foreground web:group-hover:bg-secondary web:group-hover:text-foreground web:duration-200'
                }`}>
                {isEmoji(icon) ? <Text>{icon}</Text> : <Icon icon={icon} size="20" className={`${isActive ? 'text-primary-foreground' : 'text-secondary-foreground web:group-hover:text-foreground'}`} />}
            </View>

            <Text className={` px-2 text-sm leading-tight font-semibold  ${isActive && 'text-foreground' || 'text-secondary-foreground group-hover:text-foreground'}`}>{title}</Text>
            <CounterIndicator addon={addon} isTitle={true} />
        </Row>
    )
}