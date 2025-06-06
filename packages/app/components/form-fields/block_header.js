import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'

export default function FormFieldBlockHeader(props) {
    return (
        <View className=' w-full  p-[4px]'>
            <Text className="label-text block  pt-[4px] pb-[6px] w-full ">
                <Row className='items-center gap-x-1' >
                    <Text className='font-semibold text-sm sm:text-base text-neutral-700 dark:text-neutral-300'>{props.caption}</Text>
                </Row >
            </Text>
        </View>
    );
}
