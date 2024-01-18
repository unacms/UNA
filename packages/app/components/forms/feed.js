import { View, Row } from 'app/design/view'
import { Button, Modal } from 'app/design/controls'
import { useState, useContext } from 'react'
import { getFormFieldByData } from 'app/lib/form-helpers'
import { LayoutData } from 'app/context/layout'
import { FeedbackHaptics, getAlert } from 'app/lib/util'
import { KeyboardAvoidingView } from 'react-native'
import { Platform } from 'react-native'
import { useCurrentUser } from 'app/context/user'
import Profile from 'app/ui/molecules/profile'
import Card from 'app/ui/molecules/card'
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'app/design/typography'

export default function FormFeed(props) {
    const { t } = useTranslation();
    const [showImage, setShowImage] = useState(false)
    const [responseId, setResponseId] = useState(0)
    const [imageSource, setImageSource] = useState([])
    const { layoutData, setLayoutData } = useContext(LayoutData)
    let { currentUser, setCurrentUser } = useCurrentUser()
    useEffect(() => {
        if (props.response?.id != responseId) {
            setLayoutData(getAlert('feed:new_content', props.response));
            setShowImage(false);
            setResponseId(props.response?.id);
        }
    }, [props.response?.id]); 
    

    function setPlaceHolder(name, previews) {
        if (JSON.stringify(previews) != JSON.stringify(imageSource[name])) {
            setImageSource((prevImageSource) => ({
                ...prevImageSource,
                [name]: previews,
            }))
        }
    }

    let prevList = Object.values(imageSource).flat()

    let profile = null
    if (currentUser) {
        let dUser = Object.assign({}, currentUser)
        dUser.url_avatar = dUser.avatar
        dUser.url = '/dashboard'
        profile = <Profile {...dUser} displaySize="base" displayType="unit_wo_info" />
    }
    return (
        <View className="w-full ">
            <Modal
                title= {t("Create new post")}
                onVisible={showImage}
                onClose={() => {
                    setShowImage(null)
                }}
                outerClickClose={false}
                transparent={false}
            >
                {getFormFieldByData(props.data.inputs['action'], props.handleSubmit, 'default' )}
                {getFormFieldByData(props.data.inputs['object_cf'], props.handleSubmit, 'default' )}
                {getFormFieldByData( props.data.inputs['owner_id'], props.handleSubmit, 'default')}
                {getFormFieldByData( props.data.inputs['type'], props.handleSubmit, 'default')}
                <KeyboardAvoidingView keyboardVerticalOffset={92} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} >
                    <View className="w-full flex-col gap-y-4 ">
                        {getFormFieldByData(props.data.inputs['text'], props.handleSubmit, 'custom', { placeholder: 'Write your text here...', linkify: true })}
                        <Row className=" flex-wrap border border-bdr dark:border-bdr-d rounded-xl py-2 items-center ">
                            <Text className="px-4 flex-auto text-neutral-800 dark:text-neutral-200 text-sm font-semibold">{t("Add media")}</Text>
                            {props.data.inputs['photo'] && <View className="">
                                {getFormFieldByData(props.data.inputs['photo'], props.handleSubmit, 'custom', { previewPlaceHolder: setPlaceHolder })}
                            </View>}
                            {props.data.inputs['video'] && <View className="">
                                {getFormFieldByData(props.data.inputs['video'], props.handleSubmit, 'custom', { previewPlaceHolder: setPlaceHolder })}
                            </View>}
                            {props.data.inputs['file'] && <View className="">
                                {getFormFieldByData(props.data.inputs['file'], props.handleSubmit, 'custom', { previewPlaceHolder: setPlaceHolder })}
                            </View>}
                        </Row>
                        {prevList.length > 0 && prevList[0]?.key && (
                            <Row className="flex-wrap gap-2 mb-4">{prevList}</Row>
                        )}
                        {props.data.inputs['labels'] && getFormFieldByData(props.data.inputs['labels'], props.handleSubmit, 'notitle' )}
                        {getFormFieldByData(props.data.inputs['object_privacy_view'], props.handleSubmit, 'notitle' )}
                        {getFormFieldByData(props.data.inputs['tlb_do_submit'], props.handleSubmit, 'default')}
                    </View>
                </KeyboardAvoidingView>
            </Modal>
            <Card rounded=' rounded-none sm:rounded-2xl  ' margin=' p-4 lg:px-6  mb-2 sm:mb-4 sm:mx-4 ' >                
            <View className=" flex-row ">
                    <View className='mr-2 my-auto'>{profile}</View>
                    <Button
                        size="base"
                        variant="text"
                        startDecorator="Plus"
                        fullWidth
                        rounded
                        title={t("Create new post") + "..."}
                        align="start"
                        onPress={() => {
                            FeedbackHaptics('Medium')
                            setShowImage(true)
                        }}
                    />
                </View>
            </Card>
        </View>
    )
}
