import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'

export default function FormFieldBlockHeader(props) {
    return (
        <View className=' w-full'>
            <Text className="label-text block  pt-1 pb-1.5 w-full ">
                <Row className='items-center gap-x-1' >
                    <Text className='font-semibold text-sm sm:text-lg text-secondary-foreground'>{props.caption}</Text>
                </Row >
            </Text>
        </View>
    );
}
