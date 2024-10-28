import { View, Row, ScrollView } from 'app/design/view'
import { Button, Modal } from 'app/design/controls'
import { useState, useContext, useRef } from 'react'
import { getFormFieldByData } from 'app/lib/form-helpers'
import { useLayoutData } from 'app/context/layout'
import { FeedbackHaptics, getAlert } from 'app/lib/util'
import KbAvoidingView from 'app/ui/atoms/kb-avoiding-view';
import { Platform } from 'react-native'
import { Text } from 'app/design/typography'
import { useCurrentUser } from 'app/context/user'
import Profile from 'app/ui/molecules/profile'
import Card from 'app/ui/molecules/card'
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { appSetting, stripTags, LAYOUT_BREAKPOINTS } from 'app/lib/util'
import { useWindowDimensions } from 'react-native'
import { Keyboard } from 'react-native';
import { useFormContext } from 'react-hook-form';

export default function FormFeed(props) {
    const formContext = useFormContext();
    const { t } = useTranslation();
    const [showImage, setShowImage] = useState(false)
    const [responseId, setResponseId] = useState(0)
    const [imageSource, setImageSource] = useState([])
    const { setLayoutData } = useLayoutData()
    let { currentUser, setCurrentUser } = useCurrentUser()
    const windowDimensions = useWindowDimensions();
    const [isShowHashtag, setIsShowHashtag] = useState(0);
    const isWeb = Platform.OS === 'web'
    const isSmall = windowDimensions.width < LAYOUT_BREAKPOINTS.sm || !isWeb ? true : false;
    const isIos = Platform.OS === 'ios'
    const scrollViewRef = useRef(null);

    useEffect(() => {
        if (props.response?.id != responseId) {
            //console.log("props.responseprops.response", props.response)
            setLayoutData(getAlert('feed:new_content', props.response));
            setShowImage(false);
            setResponseId(props.response?.id);
        }
    }, [props.response?.id]);

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            'keyboardDidShow',
            () => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }
        );

        return () => {
            keyboardDidShowListener.remove();
        };
    }, []);

    let text = formContext.watch('text');
    if (!text)
        text = '';
    if (typeof text === 'string'){
        text = stripTags(text).trim();
    }

    function setPlaceHolder(name, previews) {
        if (JSON.stringify(previews) != JSON.stringify(imageSource[name])) {
            setImageSource((prevImageSource) => ({
                ...prevImageSource,
                [name]: previews,
            }))
        }
    }

    let prevList = Object.values(imageSource).flat().filter(element => element !== undefined)

    let profile = null
    if (currentUser) {
        let dUser = Object.assign({}, currentUser)
        dUser.url_avatar = dUser.avatar
        dUser.url = appSetting('layout', 'dashboard')
        profile = <Profile {...dUser} displaySize="base" displayType="unit_wo_info" />
    }

    const handlePress = () => {
        Keyboard.dismiss();
        setShowImage(null)
        props.handleSubmit();
    };

    const header = <Row className=' w-full justify-between items-center'>
        <View className='pl-2'><Button onPress={() => { setShowImage(null) }} variant='outline' rounded startDecorator="X" /></View>
        <View className='w-full flex-auto items-center justify-center'><Text className="text-neutral-700 dark:text-neutral-200 text-xl font-bold">Create post</Text></View>
        <View className=' pr-2'>
            <Button onPress={() => { handlePress() }} variant='primary' disabled={text!='' ? false : true}  rounded  startDecorator="PaperPlane" />
        </View>
    </Row>

    const labels =props.data.inputs['labels'] && getFormFieldByData(props.data.inputs['labels'], props.handleSubmit, 'notitle', { onShowModal: setShowImage, showModal: showImage, listOnly:true, isShow:isShowHashtag })

    return (
        <View className="w-full">
            <Modal
                title={isSmall ? header : t("Create new post")}
                onVisible={showImage}
                outerClickClose = {false}
                {...(!isSmall && { onClose: () => setShowImage(null) })}
                padding='sm:p-4 sm:pb-0'
                transparent={true}
                headerBorder={true}
            >
                    {getFormFieldByData(props.data.inputs['action'], props.handleSubmit, 'default')}
                    {getFormFieldByData(props.data.inputs['object_cf'], props.handleSubmit, 'default')}
                    {getFormFieldByData(props.data.inputs['owner_id'], props.handleSubmit, 'default')}
                    {getFormFieldByData(props.data.inputs['type'], props.handleSubmit, 'default')}
                    <KbAvoidingView offset={isIos ? 56: 72}>
                        <View className='justify-between mb-2 h-full  '>
                            <ScrollView 
                                ref={scrollViewRef}
                                className="w-full h-full flex-1" 
                                keyboardShouldPersistTaps="handled"
                                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                            >
                                <View className="w-full  flex-col px-2 sm:p-0 ">
                                    <View className=" flex-row gap-x-3 px-1 sm:px-0 pb-0 pt-3 sm:pt-0 flex-auto ">
                                        <View className=" mb-auto ">
                                            <Profile {...currentUser} displayType="unit_wo_info" displaySize="lg" />
                                        </View>
                                        <View className="flex-col flex-auto ">
                                            <Profile {...currentUser} displayType="unit_wo_image" displaySize="lg" />

                                           
                                           <View className="gap-x-2 flex-row flex-wrap ">
                                           <View className=" my-auto mt-2">
                                            {getFormFieldByData(
                                                { ...props.data.inputs['object_privacy_view'], size: 'xs' },
                                                props.handleSubmit,
                                                'nofield',
                                                { onShowModal: setShowImage, showModal: showImage }
                                            )}
                                            </View>
                                           {props.data.inputs['labels'] && 
                                            <View className=" ">
                                            {labels}
                                            </View>

                                    } 


                                           </View>
                                          
                                        </View>

                                    </View>
                                    {getFormFieldByData(props.data.inputs['text'], props.handleSubmit, 'custom', { focus: true, bg: 'transparent', placeholder: 'Write here...', linkify: true })}
                                    {prevList.length > 0 && prevList[0]?.key && (
                                        <Row className="flex-wrap ">{prevList}</Row>
                                    )}
                                </View>
                            </ScrollView>
                            <Row className={"w-full flex-wrap gap-x-2 mx-auto border-bdr dark:border-bdr-d items-center " + (isWeb ? '' : ' pb-3 ') + (isSmall ? " h-[68px] border-t fixed " + (isIos? ' bottom-4 ': ' bottom-0 ') + " border-bdr dark:border-bdr-d px-3 bg-bgrcard dark:bg-bgrcard-d " : " rounded-xl border px-3 py-0.5 my-2 border")}>
                                <Text className="hidden sm:flex px-2 mr-auto text-sm font-medium text-neutral-800 dark:text-neutral-200">Add to post</Text>
                                {props.data.inputs['obfuscate_faces'] && <View className="">
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
                                {props.data.inputs['labels'] && <View className="">
                                    <Button startDecorator="Hash"  size={"base"} variant={ "text"} rounded={false}  onPress={() => {setIsShowHashtag(isShowHashtag+1)}} />
                                </View>}
                            </Row>

                            <View className='hidden sm:flex'>
                           {/* <Button onPress={() => { handlePress() }} variant='primary' disabled={text!='' ? false : true}   startDecorator="PaperPlane" title="Post" />*/}
                                {getFormFieldByData(props.data.inputs['tlb_do_submit'], props.handleSubmit, 'default', {disabled:text!='' ? false : true})}
                            </View>
                        </View>
                    </KbAvoidingView>

            </Modal>
            {props.exProps?.mode == 'button' ? <Button variant="primary" title="Post" tooltip="Post" rounded fullWidth onPress={() => {
                FeedbackHaptics('Medium')
                setShowImage(true)
            }} /> : <Card rounded=' rounded-none sm:rounded-2xl  ' margin=' max-w-2xl mx-auto w-full p-3 sm:p-4 mb-1 sm:mb-4 '  >
                <View className=" flex-row gap-x-2 sm:gap-x-3 ">
                    <View className=' my-auto'>{profile}</View>
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
