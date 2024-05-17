import { View, Row } from 'app/design/view'
import { Button, Modal } from 'app/design/controls'
import { useState, useContext } from 'react'
import { getFormFieldByData } from 'app/lib/form-helpers'
import { LayoutData } from 'app/context/layout'
import { FeedbackHaptics, getAlert } from 'app/lib/util'
import { KeyboardAvoidingView } from 'react-native'
import { Platform } from 'react-native'
import { Text } from 'app/design/typography'
import { useCurrentUser } from 'app/context/user'
import Profile from 'app/ui/molecules/profile'
import Card from 'app/ui/molecules/card'
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { appSetting } from 'app/lib/util'

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
        dUser.url = appSetting('layout', 'dashboard')
        profile = <Profile {...dUser} displaySize="base" displayType="unit_wo_info" />
    }

    return (
        <View className="w-full h-full ">
            <Modal
                title={t("Create new post")}
                onVisible={showImage}
                onClose={() => {
                    setShowImage(null)
                }}
                presentation='overFullScreen'
                padding = 'sm:p-6 sm:pt-4 pb-1 sm:pb-4 md:pb-0'
                transparent={true}
                headerBorder={true}
            >
                {getFormFieldByData(props.data.inputs['action'], props.handleSubmit, 'default')}
                {getFormFieldByData(props.data.inputs['object_cf'], props.handleSubmit, 'default')}
                {getFormFieldByData(props.data.inputs['owner_id'], props.handleSubmit, 'default')}
                {getFormFieldByData(props.data.inputs['type'], props.handleSubmit, 'default')}

                <View className='justify-between mb-4 h-full p-4 sm:p-0'>
                    <KeyboardAvoidingView keyboardVerticalOffset={92} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} >
                        <View className="w-full  flex-col ">
                            <View className=" flex-row flex-wrap gap-x-2 mt-2 flex-auto justify-between ">
                                <View className=" flex-auto text-base font-bold text-neutral-800 my-auto ">
                                    <Profile {...currentUser} displayType="unit" displaySize="base" />
                                </View>
                                <View className="   ">
                                    {getFormFieldByData(props.data.inputs['object_privacy_view'], props.handleSubmit, 'nofield')}
                                </View>

                            </View>
                            {getFormFieldByData(props.data.inputs['text'], props.handleSubmit, 'custom', { focus: true, bg: 'transparent', placeholder: 'Write here...', linkify: true })}
                            <Row className=" flex-wrap my-2 border border-bdr dark:border-bdr-d rounded-xl  items-center pr-2">
                                <Text className="px-4 mr-auto text-sm font-medium text-neutral-800 dark:text-neutral-200">Add media</Text>

                                {props.data.inputs['obfuscate_faces'] && <View className="mr-4">
                                    {getFormFieldByData(props.data.inputs['obfuscate_faces'], props.handleSubmit, 'default')}
                                </View>}
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
                                <Row className="flex-wrap gap-2 ">{prevList}</Row>
                            )}
                            {props.data.inputs['labels'] && <Row className="  my-2 border border-bdr dark:border-bdr-d rounded-xl  items-center ">
                                <Text className="px-4 mr-auto text-sm font-medium text-neutral-800 dark:text-neutral-200">Labels</Text>
                                <View className="mr-2 flex-auto ">
                                    {props.data.inputs['labels'] && getFormFieldByData(props.data.inputs['labels'], props.handleSubmit, 'notitle')}
                                </View>
                            
                            </Row>}
                        </View>
                    </KeyboardAvoidingView>
                    {getFormFieldByData(props.data.inputs['tlb_do_submit'], props.handleSubmit, 'default')}
                </View>
            </Modal>
            {props.exProps?.mode == 'button' ? <Button variant = "primary" title = "Post" tooltip = "Post" rounded = 'rounded' fullWidth onPress={() => {
                FeedbackHaptics('Medium')
                setShowImage(true)
            }} /> : <Card rounded=' rounded-none sm:rounded-2xl  ' margin=' p-3 sm:p-6 mb-2 sm:mb-4 sm:mx-4 ' border=" sm:border border-bdrcard dark:border-bdrcard-d" >
                <View className=" flex-row ">
                    <View className='mr-3 sm:mr-4 my-auto'>{profile}</View>
                    <Button
                        size="base"
                        variant="secondary"
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
            }
        </View>
    )
}
