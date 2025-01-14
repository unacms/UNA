import { View, Row, ScrollView } from 'app/design/view'
import { Button, Modal } from 'app/design/controls'
import { useState, useContext, useRef, useCallback } from 'react'
import { getFormFieldByData } from 'app/lib/form-helpers'
import { useLayoutData } from 'app/context/layout'
import { FeedbackHaptics, getAlert, menuItemsByName, appSetting } from 'app/lib/util'
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
import FormModal, { handleMenuManageSelect } from 'app/ui/molecules/form_modal';
import { Icon } from 'app/ui/atoms/icon'

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

    return (
        <View className="flex-row flex-auto items-center justify-between gap-x-1 text-neutral-400 dark:text-neutral-600  ">
            <View className="gap-x-[8px] flex-row ">
                <Profile {...profileData} displaySize="base" displayType="unit_wo_info" />
                <View className="flex-col ">
                    <Text className="mb-[4px] text-neutral-900 dark:text-neutral-100 font-semibold text-[16px] truncate">
                        {currentUser.display_name}
                    </Text>
                    {data?.inputs?.['object_privacy_view'] && getFormFieldByData(
                        {
                            ...data.inputs['object_privacy_view'],
                        },
                        handleSubmit,
                        'nofield',
                        {
                            onShowModal: setShowImage,
                            showModal: showImage,
                            size: 'xs',
                            maxLength: 0,
                            variant: 'link'
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
    const [showImage, setShowImage] = useState(false)
    const [responseId, setResponseId] = useState(0)
    const [imageSource, setImageSource] = useState([])
    const { setLayoutData } = useLayoutData()
    const windowDimensions = useWindowDimensions()
    const [isShowHashtag, setIsShowHashtag] = useState(0)
    const isWeb = Platform.OS === 'web'
    const isSmall = windowDimensions.width < LAYOUT_BREAKPOINTS.sm || !isWeb ? true : false
    const isIos = Platform.OS === 'ios'
    const scrollViewRef = useRef(null)
    const [pageData, setPageData] = useState(false);

    useEffect(() => {
        if (props.response?.id != responseId) {
            //console.log("props.responseprops.response", props.response)
            setLayoutData(getAlert('feed:new_content', props.response))
            setShowImage(false)
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

    let prevList = Object.values(imageSource)
        .flat()
        .filter((element) => element !== undefined)

    const handlePress = () => {
        setShowImage(false)
        props.handleSubmit()
    }

    const header = (
        <Row className="w-full justify-between items-center">

            <View className="flex-auto">
                <ProfileView
                    data={props.data}
                    handleSubmit={props.handleSubmit}
                    showImage={showImage}
                    setShowImage={setShowImage}
                />
            </View>

            <Button
                onPress={() => {
                    setShowImage(false)
                }}
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
    const menu_add_items = menuItemsByName('', appSetting('menu_items', 'menu_add'), currentUser).filter((item) => (item.showInFeed));

    const handleModalClose = useCallback(() => {
        Keyboard.dismiss()
        setShowImage(false)
    }, [])

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
                    padding=" sm:px-4 sm:pb-4 "
                    transparent={true}
                    onRequestClose={handleModalClose}
                >
                    {getFormFieldByData(props.data.inputs['action'], props.handleSubmit, 'default')}
                    {getFormFieldByData(props.data.inputs['object_cf'], props.handleSubmit, 'default')}
                    {getFormFieldByData(props.data.inputs['owner_id'], props.handleSubmit, 'default')}
                    {getFormFieldByData(props.data.inputs['type'], props.handleSubmit, 'default')}
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
                                <View className="w-full flex-col px-[12px] sm:p-0 ">

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
                                    {prevList.length > 0 && prevList[0]?.key && (
                                        <Row className="flex-wrap">{prevList}</Row>
                                    )}
                                    {props.data.inputs['labels'] && (
                                        <View className="flex-auto">
                                            {labels}
                                        </View>
                                    )}
                                </View>
                            </ScrollView>
                            <Row className="w-full justify-between gap-x-[8px] mx-auto items-center pt-2 ">
                                <Row className={
                                    ' flex-auto w-full justify-between gap-x-[24px]  ' +
                                    (isWeb ? '' : ' pb-[12px] ') +
                                    (isSmall
                                        ? ' pb-[12px] px-[12px] ' +
                                        (isIos ? ' bottom-[8px] ' : ' bottom-0 ') +
                                        '  '
                                        : ' my-auto ')
                                }>

                                    <Row className="gap-x-[4px]  ">
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
                                                        rounded: true,
                                                        size: 'base',
                                                        variant: 'text',
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
                                                        variant: 'text',
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
                                                        variant: 'text',
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
                                                    variant='text'
                                                    rounded
                                                    onPress={() => {
                                                        setIsShowHashtag(isShowHashtag + 1)
                                                    }}
                                                />
                                            </View>
                                        )}



                                    </Row>
                                    <Row className="flex-none w-1/3">
                                        {getFormFieldByData(
                                            props.data.inputs['tlb_do_submit'],
                                            props.handleSubmit,
                                            'default',
                                            {
                                                disabled: text != '' ? false : true,
                                                noMargin: true,
                                                size: 'base',
                                                rounded: true,
                                                startDecorator: "PaperPlane",
                                               
                                            }
                                        )}
                                    </Row>

                                </Row>


                            </Row>
                        </View>
                    </KbAvoidingView>
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
                            <View className=" flex-row gap-x-[8px] ">
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
                    {(props?.exProps?.showLinks && menu_add_items.length > 0) && (<>
                        <FormModal pageData={pageData} setPageData={setPageData} />
                        <Row className={` justify-between ${props.exProps.showLinks && props.exProps.showForm ? ' gap-x-[8px] hidden sm:flex mt-[12px] sm:mt-[12px] sm:pt-[12px] border-t border-bdr dark:border-bdr-d ' : ''}`}>
                            {menu_add_items.map((item, index) => (
                                <Button key={item.name} size="base" rounded fullWidth variant="secondary" onPress={() => handleMenuManageSelect(item, null, setPageData)} startDecorator={item.icon} title={item.title} />
                            ))}
                        </Row>
                    </>)
                    }
                </Card>
            )}
        </View>
    )
}
