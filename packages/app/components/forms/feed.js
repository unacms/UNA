import { View, Row } from 'app/design/view'
import { Button, Modal,  } from 'app/design/controls'
import { Text} from 'app/design/typography'
import { useState } from 'react';
import { getFormFieldByData } from 'app/lib/form-helpers'

export default function FormFeed(props) {

    const [showImage, setShowImage] = useState(false);

    const [imageSource, setImageSource] = useState([]);

    function setPlaceHolder(name, previews) {
        if (JSON.stringify(previews) != JSON.stringify(imageSource[name])) {
            setImageSource(prevImageSource => ({
                ...prevImageSource,
                [name]: previews,
            }));
        }
    }
    
    let prevList = Object.values(imageSource).flat();

    return <View className='w-full '>
    <Modal onVisible={showImage} onClose={() => {setShowImage(null)}} outerClickClose={false} transparent={false}>
        {getFormFieldByData(props.data.inputs['action'], props.handleSubmit,  'default')}
        {getFormFieldByData(props.data.inputs['object_cf'], props.handleSubmit,  'default')}
        {getFormFieldByData(props.data.inputs['owner_id'], props.handleSubmit,  'default')}
        {getFormFieldByData(props.data.inputs['type'], props.handleSubmit,  'default')}
        <View className='w-full '>
            {getFormFieldByData(props.data.inputs['text'], props.handleSubmit, 'notitle', {placeholder: 'Write your text here...'})}
            <Row>
                <View className='w-12'>{getFormFieldByData(props.data.inputs['photo'], props.handleSubmit, 'custom', {previewPlaceHolder: setPlaceHolder})}</View>
                <View className='w-12'>{getFormFieldByData(props.data.inputs['video'], props.handleSubmit, 'custom', {previewPlaceHolder: setPlaceHolder})}</View>
                <View className='w-12'>{getFormFieldByData(props.data.inputs['file'], props.handleSubmit, 'custom', {previewPlaceHolder: setPlaceHolder})}</View>
            </Row>
            { (prevList.length> 0 && prevList[0]?.key) && <Row className='flex-wrap gap-2 mb-4'>{prevList}</Row>}
            {getFormFieldByData(props.data.inputs['object_privacy_view'], props.handleSubmit,  'notitle')}
            {getFormFieldByData(props.data.inputs['tlb_do_submit'], props.handleSubmit,  'default')}

        </View>   
    </Modal>
    <View className='mx-auto mt-2'>
        <Button  onPress={() => setShowImage(true)} >
            <Text>Click to post</Text>
        </Button>
    </View>
</View>
}
