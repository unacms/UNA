import { View, Row } from 'app/design/view'
import { FormExContext } from 'app/context/form';

import { Button } from 'app/design/controls';
import { useContext } from 'react';

export default function FormComments(props) {

    const { formExContextData, setFormExContextData } = useContext(FormExContext);

    const selectImage = () => {
        setFormExContextData({action: 'open_files', data: formExContextData?.data});
    }

    return <View className='w-full'>
    <Row className='w-full '>
        <View className='mr-2'>
            <Button onPress={selectImage} variant="text" startDecorator="ImageSquare" />
        </View>
        <View className=' flex-grow mr-2'>
            {props.children[0]}
            {props.children[1]}
            {props.children[2]}
            {props.children[3]}
            {props.children[4]}
            {props.children[5]}
        </View>
        
        <View className=''>
            {props.children[6]}
        </View>
    </Row>
    { !!formExContextData?.data && <View className=' '>{formExContextData.data}</View> }
    <View className='hidden'>{props.children[7]}</View>
</View>
}
