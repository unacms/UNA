import { View, Row, ScrollView } from 'app/design/view'
import { Button, Modal } from 'app/design/controls'
import { useState, useContext, useRef } from 'react'
import { getFormFieldByData } from 'app/lib/form-helpers'
import { useLayoutData } from 'app/context/layout'
import { FeedbackHaptics, getAlert } from 'app/lib/util'
import KbAvoidingView from 'app/ui/atoms/kb-avoiding-view'
import { Platform } from 'react-native'
import { Text } from 'app/design/typography'
import { useCurrentUser } from 'app/context/user'
import Profile from 'app/ui/molecules/profile'
import Card from 'app/ui/molecules/card'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { appSetting, stripTags, LAYOUT_BREAKPOINTS } from 'app/lib/util'
import { useWindowDimensions } from 'react-native'
import { Keyboard } from 'react-native'
import { useFormContext } from 'react-hook-form'

export default function FormFeed(props) {
    const formContext = useFormContext()
    const { t } = useTranslation()
    const [showImage, setShowImage] = useState(false)
    const [responseId, setResponseId] = useState(0)
    const [imageSource, setImageSource] = useState([])
    const { setLayoutData } = useLayoutData()
    let { currentUser, setCurrentUser } = useCurrentUser()
    const windowDimensions = useWindowDimensions()
    const [isShowHashtag, setIsShowHashtag] = useState(0)
    const isWeb = Platform.OS === 'web'
    const isSmall =
        windowDimensions.width < LAYOUT_BREAKPOINTS.sm || !isWeb ? true : false
    const isIos = Platform.OS === 'ios'
    const scrollViewRef = useRef(null)

    useEffect(() => {
        if (props.response?.id != responseId) {
            //console.log("props.responseprops.response", props.response)
            setLayoutData(getAlert('feed:new_content', props.response))
            setShowImage(false)
            setResponseId(props.response?.id)
        }
    }, [props.response?.id])

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            'keyboardDidShow',
            () => {
                scrollViewRef.current?.scrollToEnd({ animated: true })
            }
        )

        return () => {
            keyboardDidShowListener.remove()
        }
    }, [])

    let text = formContext.watch('text')
    if (!text) text = ''
    if (typeof text === 'string') {
        text = stripTags(text).trim()
    }

    function setPlaceHolder(name, previews) {
        if (JSON.stringify(previews) != JSON.stringify(imageSource[name])) {
            setImageSource((prevImageSource) => ({
                ...prevImageSource,
                [name]: previews,
            }))
        }
    }

    let prevList = Object.values(imageSource)
        .flat()
        .filter((element) => element !== undefined)

    let profile = null
    if (currentUser) {
        let dUser = Object.assign({}, currentUser)
        dUser.url_avatar = dUser.avatar
        dUser.url = appSetting('layout', 'dashboard')
        profile = (
            <Profile {...dUser} displaySize="base" displayType="unit_wo_info" />
        )
    }

    const handlePress = () => {
        Keyboard.dismiss()
        setShowImage(null)
        props.handleSubmit()
    }

    const header = (
        <Row className=" w-full justify-between items-center">
            <Button
                onPress={() => {
                    setShowImage(null)
                }}
                variant="outline"
                rounded
                size="base"

                startDecorator="X"
            />
            <View className="flex-auto items-center justify-center">
                <View className=" flex-row gap-x-3 flex-auto ">

                    <Profile
                        {...currentUser}
                        displayType="unit_wo_info"
                        displaySize="base"
                    />

                    <Profile
                        {...currentUser}
                        displayType="unit_wo_image"
                        displaySize="lg"
                    />


                </View>
            </View>

            <Button
                onPress={() => {
                    handlePress()
                }}
                variant="primary"
                size="base"
                disabled={text != '' ? false : true}
                rounded
                startDecorator="PaperPlane"
            />
        </Row>
    )

    const labels =
        props.data.inputs['labels'] &&
        getFormFieldByData(
            props.data.inputs['labels'],
            props.handleSubmit,
            'notitle',
            {
                onShowModal: setShowImage,
                showModal: showImage,
                listOnly: true,
                isShow: isShowHashtag,
                noMargin: true,
            }
        )

    return (
        <View className="w-full">
            <Modal
                title={isSmall ? header : <View className=" flex-row gap-x-3 flex-auto ">

                    <Profile
                        {...currentUser}
                        displayType="unit_wo_info"
                        displaySize="base"
                    />

                    <Profile
                        {...currentUser}
                        displayType="unit_wo_image"
                        displaySize="lg"
                    />


                </View>}
                onVisible={showImage}
                outerClickClose={false}
                {...(!isSmall && { onClose: () => setShowImage(null) })}
                padding=" sm:p-4 "
                transparent={true}
                headerBorder={true}
            >
                {getFormFieldByData(
                    props.data.inputs['action'],
                    props.handleSubmit,
                    'default'
                )}
                {getFormFieldByData(
                    props.data.inputs['object_cf'],
                    props.handleSubmit,
                    'default'
                )}
                {getFormFieldByData(
                    props.data.inputs['owner_id'],
                    props.handleSubmit,
                    'default'
                )}
                {getFormFieldByData(
                    props.data.inputs['type'],
                    props.handleSubmit,
                    'default'
                )}
                <KbAvoidingView className='flex-col flex-auto' offset={isIos ? 68 : 74}>
                    <View className="justify-between flex-col flex-auto ">
                        <ScrollView
                            ref={scrollViewRef}
                            className="w-full h-full flex-1"
                            keyboardShouldPersistTaps="handled"
                            onContentSizeChange={() =>
                                scrollViewRef.current?.scrollToEnd({
                                    animated: true,
                                })
                            }
                        >
                            <View className="w-full flex-col p-[12px] sm:p-0 ">
                           
                                {getFormFieldByData(
                                    props.data.inputs['text'],
                                    props.handleSubmit,
                                    'custom',
                                    {
                                        focus: true,
                                        bg: 'transparent',
                                        placeholder: 'Write here...',
                                        linkify: true,
                                    }
                                )}
                                {prevList.length > 0 && prevList[0]?.key && (
                                    <Row className="flex-wrap">{prevList}</Row>
                                )}
                            </View>

                            {props.data.inputs['labels'] && (
                                <Row className="px-[12px] sm:px-0">
                                    {labels}

                                </Row>
                            )}





                        </ScrollView>

                        <Row className="w-full justify-between gap-x-2 mx-auto items-center pt-2 ">
                            <Row className={
                                    ' flex-auto justify-between gap-x-2  ' +
                                    (isWeb ? '' : ' pb-[12px] ') +
                                    (isSmall
                                        ? ' pb-[12px] px-[12px] ' +
                                        (isIos ? ' bottom-[8px] ' : ' bottom-0 ') +
                                        '  '
                                        : ' my-auto ')
                                }>

                            <Row
                                className="gap-x-2"
                            >



                                {props.data.inputs['obfuscate_faces'] && (
                                    <View className="">
                                        {getFormFieldByData(
                                            props.data.inputs['obfuscate_faces'],
                                            props.handleSubmit,
                                            'default'
                                        )}
                                    </View>
                                )}
                                {props.data.inputs['photo'] && (
                                    <View className="">
                                        {getFormFieldByData(
                                            props.data.inputs['photo'],
                                            props.handleSubmit,
                                            'custom',
                                            {
                                                previewPlaceHolder: setPlaceHolder,
                                                noMargin: true,
                                                rounded: true,
                                            }
                                        )}
                                    </View>
                                )}
                                {props.data.inputs['video'] && (
                                    <View className="">
                                        {getFormFieldByData(
                                            props.data.inputs['video'],
                                            props.handleSubmit,
                                            'custom',
                                            {
                                                previewPlaceHolder: setPlaceHolder,
                                                noMargin: true,
                                                asDefaultStorage: true,
                                                size: 'base',
                                                variant: 'secondary',
                                            }
                                        )}
                                    </View>
                                )}
                                {props.data.inputs['file'] && (
                                    <View>
                                        {getFormFieldByData(
                                            props.data.inputs['file'],
                                            props.handleSubmit,
                                            'custom',
                                            {
                                                previewPlaceHolder: setPlaceHolder,
                                                noMargin: true,
                                                
                                                size: 'base',
                                                variant: 'secondary',
                                            }
                                        )}
                                    </View>
                                )}
                                {props.data.inputs['labels'] && (
                                    <View>
                                        <Button
                                            startDecorator="Hash"
                                            size='base'
                                            variant='secondary'
                                            
                                            onPress={() => {
                                                setIsShowHashtag(isShowHashtag + 1)
                                            }}
                                        />
                                    </View>
                                )}
                               
                            </Row>
                            {getFormFieldByData(
                                        {
                                            ...props.data.inputs[
                                            'object_privacy_view'
                                            ],
                                        },
                                        props.handleSubmit,
                                        'nofield',
                                        {
                                            onShowModal:setShowImage,
                                            showModal: showImage,
                                            size: 'base',
                                            maxLength:0
                                        }
                                    )}
                            </Row>
                            <View className="hidden sm:flex">
                                {/* <Button onPress={() => { handlePress() }} variant='primary' disabled={text!='' ? false : true}   startDecorator="PaperPlane" title="Post" />*/}
                                {getFormFieldByData(
                                    props.data.inputs['tlb_do_submit'],
                                    props.handleSubmit,
                                    'default',
                                    {
                                        disabled: text != '' ? false : true,
                                        noMargin: true,
                                        size: 'base',
                                    }
                                )}
                            </View>
                        </Row>
                    </View>
                </KbAvoidingView>
            </Modal>
            {props.exProps?.mode == 'button' ? (
                <Button
                    variant="primary"
                    title="Post"
                    tooltip="Post"
                    rounded
                    fullWidth
                    onPress={() => {
                        FeedbackHaptics('Medium')
                        setShowImage(true)
                    }}
                />
            ) : (

                <Card
                    rounded=" rounded-none sm:rounded-2xl  "
                    margin=" mx-auto mb-1 sm:mb-3 "
                    addClassName=" shadow-sm  w-full max-w-2xl p-3 sm:p-4 "
                >
                    <View className=" flex-row sm:gap-x-3 ">
                        <View className=" my-auto">{profile}</View>
                        <View className="flex-auto sm:hidden">
                            <Button
                                size="base"
                                variant="text"
                                fullWidth
                                rounded
                                title={t('Create new post') + '...'}
                                align="start"
                                onPress={() => {
                                    FeedbackHaptics('Medium')
                                    setShowImage(true)
                                }}
                            />
                        </View>
                        <View className="hidden sm:flex flex-auto">
                            <Button
                                size="base"
                                variant="secondary"
                                fullWidth
                                rounded
                                title={t('Create new post') + '...'}
                                align="start"
                                onPress={() => {
                                    FeedbackHaptics('Medium')
                                    setShowImage(true)
                                }}
                            />
                        </View>
                    </View>
                </Card>
            )}
        </View>
    )
}
