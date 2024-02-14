import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'
import { Button } from 'app/design/controls'

export default function ({ badges }) {
    if (!badges)
    return <></>
    return (
        <Row className='items-center gap-x-1'>
            {badges.map((item, index) => (
                <Button startDecorator='SealCheck' title={item.text} size="xs" variant="primary" />

            ))}
        </Row>
    )
}

/*-
 <Row className='items-center justify-center gap-x-1 text-primary'>
            <Icon icon="SealCheck" />
            <Text className="text-primary text-xs">{item.text}</Text>
        </Row>*/