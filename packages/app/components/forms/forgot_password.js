import { View, Row, ScrollView } from 'app/design/view'
import { getFormFieldByData } from 'app/lib/form-helpers'
import { Text } from 'app/design/typography'

export default function FormComments(props) {

    return (

        <View className="w-full max-w-xl mx-auto">
            <Text className="text-black dark:text-white text-base">Enter your account email address to get a password-reset link.</Text>
            {getFormFieldByData(props.data.inputs['email'], props.handleSubmit, 'default')}
            <View className='hidden sm:flex'>
                {getFormFieldByData(props.data.inputs['do_submit'], props.handleSubmit, 'default',)}
            </View>
        </View>

    )
}

