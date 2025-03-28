import { Text } from 'app/design/typography'
import { Button } from 'app/design/controls'
import { View, Row } from 'app/design/view'
import Animated from 'react-native-reanimated';

export function ProfileDisplayName(title) {
    return title;
}

export function ParseHtmlClasses(className, tag) {
    return className;
}

export function ProfileDisplayNameLink(title, url, href, fontSize, actions) {
    return (
        <Row className='items-center'>
            <Text className={`text-neutral-800 dark:text-neutral-200 font-bold tracking-tight truncate ${fontSize} ${url ? 'hover:text-linkhover' : ''}>`}>
                {title}
            </Text>
            {actions}
        </Row>
    )
}