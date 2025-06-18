import { Row } from 'app/design/view'
import { Button } from 'app/design/controls'

export default function ({ badges }) {
    if (!badges)
        return null
    
    return (
        <Row className='items-center gap-x-1'>
            {badges.map((item, index) => (
                <Button  key={`badge-${index}`} rounded startDecorator='BadgeCheck' title={item.text} size="xs" variant="primary" />
            ))}
        </Row>
    )
}
