import { View, Row, ScrollView } from 'app/design/view'
import { Button, Modal } from 'app/design/controls'
import { useState, useContext, useRef, useCallback } from 'react'
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
import { stripTags, LAYOUT_BREAKPOINTS } from 'app/lib/util'
import { useWindowDimensions } from 'react-native'
import { Keyboard } from 'react-native'
import { useFormContext } from 'react-hook-form'


function ProfileView({ isImageOnly = false, data, handleSubmit, showImage, setShowImage }) {
    const { currentUser } = useCurrentUser();

    if (!currentUser) return null;

    const profileData = {
        ...currentUser,
        url_avatar: currentUser.avatar,
        url: null,
    };

    if (isImageOnly) {
        return <Profile {...profileData} displaySize="base" displayType="unit_wo_info" />;
    }

    const isHiddenVisibility = data?.inputs?.['object_privacy_view']?.origtype == 'hidden'

    const authorName = (<Text className="text-neutral-900 dark:text-neutral-100 leading-[22px] sm:px-[4px] font-bold tracking-tight text-[16px] truncate">
                {currentUser.display_name}
            </Text>
    )

    return (
        <View className="flex-row flex-auto items-center justify-between gap-x-[8px] text-neutral-400 dark:text-neutral-600  ">
            <View className="gap-x-[8px] mr-[8px] flex-row flex-auto ">
                <Profile {...profileData} displaySize="base" displayType="unit_wo_info" />
                
                <View className={`flex-col flex-auto rounded-[8px] ${!isHiddenVisibility ?'group sm:hover:bg-neutral-100 sm:dark:hover:bg-neutral-800 sm:active:bg-neutral-300 sm:dark:active:bg-neutral-700': ''}`}>
                    
                    {data?.inputs?.['object_privacy_view'] && getFormFieldByData(
                        {
                            ...data.inputs['object_privacy_view'],
                        },
                        handleSubmit,
                        'nofield',
                        
                        {
                            onShowModal: setShowImage,
                            showModal: showImage,
                            size: 'sm',
                            maxLength: 0,
                            variant: 'text',
                            addElement: authorName,
                        }
                    )}
                   
                </View>
            </View>
        </View>
    );
}

export default function FormFeed(props) {
    const { currentUser } = useCurrentUser();
    const formContext = useFormContext()
    const { t } = useTranslation()
    const isFormOnly = props.exProps?.formOnly !== false;

    const [showImage, setShowImage] = useState(isFormOnly ? true : false);
    const [responseId, setResponseId] = useState(0)
    const [imageSource, setImageSource] = useState([])
    const { setLayoutData } = useLayoutData()
    const windowDimensions = useWindowDimensions()
    const [isShowHashtag, setIsShowHashtag] = useState(0)
    const isWeb = Platform.OS === 'web'
    const isSmall = windowDimensions.width < LAYOUT_BREAKPOINTS.sm || !isWeb ? true : false
    const isIos = Platform.OS === 'ios'
    const scrollViewRef = useRef(null)

    function onClose() {
        setShowImage(false)
        if (props.exProps?.onClose) {
            props.exProps.onClose()
        }
    }

    useEffect(() => {
        if (props.response?.id && props.response?.id != responseId) {
            //console.log("props.responseprops.response", props.response)
            setLayoutData(getAlert('feed:new_content', props.response))
            onClose();
            setResponseId(props.response?.id)
        }
    }, [props.response?.id])

    useEffect(() => {
        if (showImage) {
            scrollViewRef.current?.scrollToEnd({ animated: true })
        }
    }, [showImage])

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

    const prevList = Object.values(imageSource)
        .flat()
        .filter((element) => element !== undefined && element !== null)



    const header = (
        <Row className="w-full">

            <View className="flex-auto">
                <ProfileView
                    data={props.data}
                    handleSubmit={props.handleSubmit}
                    showImage={showImage}
                    setShowImage={setShowImage}
                />
            </View>

            <Button
                onPress={onClose}
                variant="secondary"
                rounded
                size="base"
                startDecorator="X"
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
                size: 'sm',
            }
        )
    
    const handleModalClose = useCallback(() => {
        Keyboard.dismiss()
        setShowImage(false)
    }, [])


    const form = <KbAvoidingView className='flex-col h-full flex-auto' offset={isIos ? 10 : 74}>
        {getFormFieldByData(props.data.inputs['action'], props.handleSubmit, 'default')}
        {getFormFieldByData(props.data.inputs['object_cf'], props.handleSubmit, 'default')}
        {getFormFieldByData(props.data.inputs['owner_id'], props.handleSubmit, 'default')}
        {getFormFieldByData(props.data.inputs['type'], props.handleSubmit, 'default')}
        <View className="justify-between flex-col flex-auto">
            <ScrollView
                ref={scrollViewRef}
                className="w-full h-full flex-1"
                keyboardShouldPersistTaps="handled"
                onContentSizeChange={() =>
                    scrollViewRef.current?.scrollToEnd({
                        animated: true,
                    })
                }
                onClick={(event) => { event.target.querySelector('.tiptap')?.focus() }}
            >
                <View className="w-full h-full flex-col px-[12px]  ">

                    {getFormFieldByData(
                        props.data.inputs['text'],
                        props.handleSubmit,
                        'custom',
                        {
                            focus: true,
                            bg: 'transparent',
                            placeholder: 'Write here...',
                            linkify: true,
                            autofocus: Date.now()
                        }
                    )}
                    
                    <ScrollView keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled" className="w-full  " horizontal={true}>{prevList}</ScrollView>
                    
                    {props.data.inputs['labels'] && (
                        <View className="flex-auto">
                            {labels}
                        </View>
                    )}
                </View>
            </ScrollView>
            <View className="  ">
                <Row className={
                    '  items-center flex-auto w-full gap-x-[8px] p-[12px] bg-neutral-500/5  ' +
                    (isWeb ? ' ' : ' ') +
                    (isSmall
                        ? ' ' +
                        (isIos ? '  ' : ' bottom-0 ') +
                        '  '
                        : ' lalal ')
                }>

                    <Row className="gap-x-[32px] flex-auto justify-between ">
                        <Row className="flex-none gap-x-[8px]">
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
                                            size: 'base',
                                            variant: 'secondary',
                                            rounded: true,
                                            variant: 'secondary',
                                            size: 'base',

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
                                            rounded: true,
                                            size: 'base',
                                            variant: 'secondary',
                                            source: 'library',
                                        }
                                    )}
                                </View>
                            )}
                            {(props.data.inputs['video'] && !isWeb) && (
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
                                            rounded: true,
                                            source: 'camera',
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
                                            rounded: true,
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
                                        rounded
                                        onPress={() => {
                                            setIsShowHashtag(isShowHashtag + 1)
                                        }}
                                    />
                                </View>
                            )}
                        </Row>
                        <View className=" flex-1 web:flex-none">
                            {getFormFieldByData(
                                props.data.inputs['tlb_do_submit'],
                                props.handleSubmit,
                                'default',
                                {
                                    disabled: text != '' ? false : true,
                                    noMargin: true,
                                    size: 'base',
                                    fullWidth: false,
                                    icon: "PaperPlane",

                                }
                            )}</View>
                    </Row>
                </Row>
            </View>
        </View>
    </KbAvoidingView>

    if (isFormOnly){
        return (
            <View className="w-full flex-1 h-full">
                <View className="items-start justify-start p-[12px] ">
                   {header}
                </View>
                
                {form}
            </View>
        )
    }

    return (
        <View className="w-full">
            {showImage && (
                <Modal
                    title={isSmall ? header : (
                        <ProfileView
                            data={props.data}
                            handleSubmit={props.handleSubmit}
                            showImage={showImage}
                            setShowImage={setShowImage}
                        />
                    )}
                    onVisible={showImage}
                    outerClickClose={false}
                    {...(!isSmall && { onClose: handleModalClose })}
                    padding=" p-0 "
                    transparent={true}
                    onRequestClose={handleModalClose}
                >
                    {form}
                </Modal>
            )}
            {props.exProps?.mode == 'button' ? (
                <Button
                    variant="primary"
                    title="Post"
                    tooltip="Post"
                    size="base"
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
                    addClassName=" shadow-sm  w-full max-w-2xl px-[12px] pt-[8px] pb-[12px] sm:p-[16px]  "
                >
                    {
                        props?.exProps?.showForm !== false && (
                            <View className=" flex-row gap-x-[8px] sm:gap-x-[10px] ">
                                <View className="my-auto">
                                    <ProfileView isImageOnly={true} />
                                </View>
                                <View className="flex-auto">
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
                            </View>)
                    }
                </Card>
            )}
        </View>
    )
}
