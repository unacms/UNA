import { View, Row } from 'app/design/view';
import { useState, useRef, useEffect } from 'react';
import KbAvoidingView from 'app/ui/atoms/kb-avoiding-view';
import { Platform } from 'react-native'
import { CommentsBrowse, CommentsForm } from 'app/lib/comments-helpers'

export default function (props) {
    const aItems = [];
    const [addData, setAddData] = useState({});
    const [formData, setFormData] = useState({});
    const [form, setForm] = useState(props.form);

    const handleReply = async (id, author, text) => {
        setFormData({ text: stripTags(text), parent_id: id, author: author })
    }

    const handleForm = async (data) => {
        setAddData(data)
    }

   /* useEffect(() => {
        if (props.data[0]?.form?.data?.params?.object == "sys_review" && addData.data) {
            setForm(false)
        }
    }, [addData.data, props.data[0]?.form?.data?.params?.object]);*/

    const formContent = <View className=' border-bdrcard dark:border-bdrcard-d border-t border-bdr dark:border-bdr-d mt-12 '>
        <CommentsForm handleForm={handleForm} browse={props.browse} module={props.browse?.data?.module || ''} form={form} formData={formData} requestUrl={props.url} />
    </View>

    const wrappedForm = Platform.OS === 'web' ? formContent : <KbAvoidingView>{formContent}</KbAvoidingView>;

    return (
        <>
            <View>
                <CommentsBrowse commentsTitle="Reviews" classesBrowse='items-center my-4' addItems={aItems} handleReply={handleReply} browse={props.browse} addData={addData} module={props.browse?.data?.module ? props.browse.data.module : ''} requestUrl={props.url} />
            </View>
            {!!form ? wrappedForm : <View className='mt-12'></View>}
        </>
    )
}
