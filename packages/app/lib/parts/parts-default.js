import { Text } from 'app/design/typography'
import { Button, Modal } from 'app/design/controls'
import { Platform } from 'react-native'
import { View, Row } from 'app/design/view'

export function ProfileDisplayNameLink(title, url, href, fontSize, actions) {
    return (
        <Row className='items-center'>
            <Text className={'text-neutral-800 dark:text-neutral-200 hover:text-linkhover font-bold tracking-tight ' + fontSize + ' truncate '}>
                {title} 
            </Text>
            {actions}
        </Row>
    )
}