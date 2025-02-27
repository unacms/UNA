import { Text } from 'app/design/typography'
import { Button, Modal } from 'app/design/controls'
import { Platform } from 'react-native'
import { View, Row } from 'app/design/view'

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