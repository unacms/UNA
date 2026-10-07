import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'
import Image from 'app/ui/atoms/image'
import { isEmoji } from 'app/lib/util';
import { components } from 'app/components/registry';

function isImageSource(value) {
    return typeof value === 'string' && /^(https?:|file:|content:|data:)/i.test(value)
}

export default function MenuItemSidebar({ title, icon, isActive, addon, iconEnd }) {
    const CounterIndicator = components['molecule']['counter_indicator']
    const iconClassName = isActive
        ? 'text-primary-foreground'
        : 'text-secondary-foreground web:group-hover:text-foreground'
    return (
        <Row className="w-full items-center">

            <View className={`h-8 w-8 items-center justify-center flex rounded-full ${isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-secondary-foreground web:group-hover:bg-muted web:group-hover:text-foreground web:duration-100'
                }`}>
                {isImageSource(icon) ? (
                    <Image src={icon} className="h-8 w-8 rounded-full" view="cover" sizes="auto" />
                ) : isEmoji(icon) ? (
                    <Text>{icon}</Text>
                ) : (
                    <Icon icon={icon} size="20" className={iconClassName} />
                )}
            </View>

            <Text numberOfLines={2} className={`flex-1 px-2 text-sm leading-4 font-semibold line-clamp-2 ${isActive ? 'text-foreground' : 'text-secondary-foreground web:group-hover:text-foreground'}`}>{title}</Text>
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