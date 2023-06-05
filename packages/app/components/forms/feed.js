import { View, Row } from 'app/design/view'
import { Button, Modal,  } from 'app/design/controls'
import { useState, useContext } from 'react';
import { getFormFieldByData } from 'app/lib/form-helpers'
import  { LayoutData } from 'app/context/layout';
import { FeedbackHaptics } from 'app/lib/util';

export default function FormFeed(props) {
    const [showImage, setShowImage] = useState(false);
    const [imageSource, setImageSource] = useState([]);
    const { layoutData, setLayoutData } = useContext(LayoutData);

    if (props.response?.id){
        setTimeout(() => {
            setLayoutData(props.response)
        }, 100);
       
    }

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
    <Modal title="Create new Post" onVisible={showImage} onClose={() => {setShowImage(null)}} outerClickClose={false} transparent={false}>
        {getFormFieldByData(props.data.inputs['action'], props.handleSubmit,  'default')}
        {getFormFieldByData(props.data.inputs['object_cf'], props.handleSubmit,  'default')}
        {getFormFieldByData(props.data.inputs['owner_id'], props.handleSubmit,  'default')}
        {getFormFieldByData(props.data.inputs['type'], props.handleSubmit,  'default')}
        <View className='w-full flex-col pt-2 px-2'>
            {getFormFieldByData(props.data.inputs['text'], props.handleSubmit, 'notitle', {placeholder: 'Write your text here...'})}
            <Row className='pb-4'>
                <View className='w-12'>{getFormFieldByData(props.data.inputs['photo'], props.handleSubmit, 'custom', {previewPlaceHolder: setPlaceHolder})}</View>
                <View className='w-12'>{getFormFieldByData(props.data.inputs['video'], props.handleSubmit, 'custom', {previewPlaceHolder: setPlaceHolder})}</View>
                <View className='w-12'>{getFormFieldByData(props.data.inputs['file'], props.handleSubmit, 'custom', {previewPlaceHolder: setPlaceHolder})}</View>
            </Row>
            { (prevList.length> 0 && prevList[0]?.key) && <Row className='flex-wrap gap-2 mb-4'>{prevList}</Row>}
            {getFormFieldByData(props.data.inputs['object_privacy_view'], props.handleSubmit,  'notitle')}
            {getFormFieldByData(props.data.inputs['tlb_do_submit'], props.handleSubmit,  'default')}

        </View>   
    </Modal>
    <View className='max-w-5xl w-full items-center pt-2 sm:pt-4  sm:px-4 mx-auto'>
    <View className='max-w-5xl w-full  
             group duration-200 overflow-hidden sm:rounded-lg  
          bg-backgroundcard dark:bg-backgroundcard-dark active:bg-backgroundcard-active dark:active:bg-backgroundcard-darkactive 
          hover:bg-backgroundcard-hover dark:hover:bg-backgroundcard-darkhover
          hover:shadow-sm active:shadow-none 
          active:translate-y-0.5 border 
          border-bordercolorcard dark:border-bordercolorcard-dark 
          sm:hover:border-bordercolorcard-hover sm:dark:hover:border-bordercolorcard-darkhover 
          active:border-bordercolorcard-active dark:active:border-bordercolorcard-darkactiv 
    '>     
        <View className='flex-auto'>    
            <Button size='base' variant='text' startDecorator='Pencil' fullWidth  title='Create new Post...' align="start" onPress={() => {FeedbackHaptics('Medium'); setShowImage(true)}} />
        </View>
    </View>
    </View>
</View>
}
