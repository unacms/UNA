import { View, Row, Pressable, ScrollView } from 'app/design/view'
import { BlockByName } from 'app/components/block'
import { getPageWidth } from 'app/lib/util'
import { Text } from 'app/design/typography'

export default function PageLayout(props) {
    return (
        <ScrollView className={ getPageWidth(props.uri) + ' sm:my-4 mx-auto w-full '}>
            <Row className='w-full'>
                <View className='bg-red-500 w-1/2'><Text>Здесь можно делать все что угодно3</Text></View> 
                <View className='bg-green-500 w-1/2'>
                    <BlockByName name={props.blocks.form} data={props.data}/>
                </View>
                
            </Row>
        </ScrollView>)
}
