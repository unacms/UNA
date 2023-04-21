import { View, Row } from 'app/design/view'
import { FormContext } from 'app/context/form';

import { Button } from 'app/design/controls';
import { useContext } from 'react';

export default function FormComments(props) {

    const { formContextData, setFormContextData } = useContext(FormContext);

    const selectImage = () => {
        setFormContextData({action: 'open_files', data: formContextData?.data});
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
    { !!formContextData?.data && <View className='mt-4 '>{formContextData.data}</View> }
    <View className='hidden'>{props.children[7]}</View>
</View>
}
