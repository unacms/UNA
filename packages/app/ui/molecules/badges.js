import { Row } from 'app/design/view'
import Badge from 'app/ui/molecules/badge';

export default function ({ badges, size = '' }) {

    if (!badges)
        return null

    return (
        <Row className='items-center gap-1'>
            {badges.map((item, index) => {
                return <Badge key={`bg-${index}`} data={item} size={size} />
            })}
        </Row>
    )
}
