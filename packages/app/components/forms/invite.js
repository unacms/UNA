import { View, Row, ScrollView } from 'app/design/view'
import { getFormFieldByData } from 'app/lib/form-helpers'


export default function FormComments(props) {
    return (
        <View className="w-full">
            {getFormFieldByData(props.data.inputs['name'], props.handleSubmit, 'default')}
            {getFormFieldByData(props.data.inputs['email'], props.handleSubmit, 'default')}
            {getFormFieldByData(props.data.inputs['text'], props.handleSubmit, 'default')}
            {getFormFieldByData(props.data.inputs['receive_news'], props.handleSubmit, 'default')}

            <View className='hidden sm:flex'>
                {/* <Button onPress={() => { handlePress() }} variant='primary' disabled={text!='' ? false : true}   startDecorator="PaperPlane" title="Post" />*/}
                {getFormFieldByData(props.data.inputs['ifr_do_submit'], props.handleSubmit, 'default',)}
            </View>

        </View>
    )
}

