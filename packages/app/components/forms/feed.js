import { View, Row, Pressable } from 'app/design/view'
import { Button, Modal,  } from 'app/design/controls'
import { Text} from 'app/design/typography'
import {  useState } from 'react';
import React from 'react';

export default function FormFeed(props) {

    function controlByKey(array, value) {
        return array.find(obj => obj['key'] === value);
    }

    const { formExContextData, setFormExContextData } = useContext(FormExContext);
    const [showImage, setShowImage] = useState(false);

    let photo = React.cloneElement(controlByKey(props.children, 'photo'), {newProp: 'newValue'});
    //console.log(props);

    return <View className='w-full '>
    <Modal  onVisible={showImage} onClose={() => {setShowImage(null)}} outerClickClose={false} transparent={false}>
            <View className=' flex-grow mr-2 '>
                {controlByKey(props.children, 'type')}
                {controlByKey(props.children, 'owner_id')}
                {controlByKey(props.children, 'text')}
                {controlByKey(props.children, 'attachments')}
                {controlByKey(props.children, 'link')}
                <Row className='mt-2'>
                    <View className='w-12'>{photo}</View>
                    <View className='w-12'>{controlByKey(props.children, 'video')}</View>
                    <View className='w-12'>{controlByKey(props.children, 'file')}</View>
                </Row>
                
                {controlByKey(props.children, 'object_privacy_view')}
                {controlByKey(props.children, 'object_cf')}
                <View className='mt-2'>
                    {controlByKey(props.children, 'tlb_do_submit')}
                </View>
                
            </View>
    </Modal>
    <View className='mx-auto mt-2'>
        <Button  onPress={() => setShowImage(true)} >
            <Text>Click to post</Text>
        </Button>
    </View>
</View>
}
