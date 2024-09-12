import { View, Row, ScrollView } from 'app/design/view'
import { getFormFieldByData } from 'app/lib/form-helpers'

export default function FormSignUp(props) {

    return (
        <View className="w-full">
            {getFormFieldByData(props.data.inputs['name'], props.handleSubmit, 'default', { use_caption_as_placeholder: true })}
            {getFormFieldByData(props.data.inputs['email'], props.handleSubmit, 'default', { use_caption_as_placeholder: true })}
            {getFormFieldByData(props.data.inputs['password'], props.handleSubmit, 'default', { use_caption_as_placeholder: true })}
            {getFormFieldByData(props.data.inputs['receive_news'], props.handleSubmit, 'default', { use_caption_as_placeholder: true })}
            <View className='hidden sm:flex'>
                {getFormFieldByData(props.data.inputs['do_publish'], props.handleSubmit, 'default',)}
            </View>
        </View>

    )
}

