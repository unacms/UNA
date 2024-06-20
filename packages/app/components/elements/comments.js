import { View, Row } from 'app/design/view';
import { BlockByName, DataByName } from 'app/components/block';
import { useState, useRef, useEffect } from 'react';
import { getBackButtonWeb } from 'app/lib/conductor-helpers';
import { KeyboardAvoidingView } from 'react-native';
import { Platform } from 'react-native'
import { useWindowDimensions } from 'react-native'
import { CommentsParts } from 'app/lib/comments-helpers'
import { CommentsBrowse, CommentsForm } from 'app/lib/comments-helpers'

export default function (props) {
    let aItems = [];
    const [addData, setAddData] = useState({});
    const [formData, setFormData] = useState({});

    const handleReply = async (id, author, text) => {
        setFormData({ text: stripTags(text), parent_id: id, author: author })
    }

    const handleForm = async (data) => {
        setAddData(data)
    }

    console.log("props", props)

    return <>
        <CommentsBrowse commentsTitle = "Reviews" classesBrowse='items-center my-4' addItems={aItems} handleReply={handleReply} browse={props.browse} addData={addData} module={props.browse?.data?.module ? props.browse.data.module : ''} requestUrl={props.url} />
        <KeyboardAvoidingView keyboardVerticalOffset={92} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} >
            <View className='border-bdrcard dark:border-bdrcard-d  border-t border-bdr dark:border-bdr-d mt-2'>
                <CommentsForm handleForm={handleForm} browse={props.browse} module={props.browse?.data?.module ? props.browse.data.module : ''} form={props.form} formData={formData} requestUrl={props.url} />
            </View>
        </KeyboardAvoidingView>

    </>
}
