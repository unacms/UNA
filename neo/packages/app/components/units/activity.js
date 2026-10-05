import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { stripTags } from 'app/lib/util';
import { Icon } from 'app/ui/atoms/icon'

export default function UnitActivity(props) {
    const data = props.data
 

    if (!data) return null

    return (
        <Row className="items-center gap-2 py-2">
            <View className="mt-0.5 h-4 w-4 items-center justify-center rounded-full bg-muted">
                <Icon icon="Activity" size={8} className="text-muted-foreground" />
            </View>
            <View className="min-w-0 flex-1 gap-0.5">
                <Text  className='text-xs text-muted-foreground'>
                    {stripTags(data.cmt_text)}
                </Text>
            </View>
        </Row>
    )
}
