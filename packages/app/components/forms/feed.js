import { View, Row, ScrollView } from 'app/design/view'
import { Button, Modal } from 'app/design/controls'
import { useState, useContext, useRef, useCallback, useMemo } from 'react'
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
import Reanimated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { getEditorHeight } from 'app/lib/form-helpers';


function ProfileView({ isImageOnly = false, data, handleSubmit, showImage, setShowImage, author }) {
    const { currentUser } = useCurrentUser();

    if (!currentUser) return null;

    const profileData = author? author : {
        ...currentUser,
        url_avatar: currentUser.avatar,
        url: null,
    };

    if (isImageOnly) {
        return <Profile {...profileData} displaySize="base" displayType="unit_wo_info" />;
    }

    const isHiddenVisibility = data?.inputs?.['object_privacy_view']?.origtype == 'hidden' || !data?.inputs?.['object_privacy_view']

    const authorName = (<Text className="text-neutral-900 dark:text-neutral-100 leading-[24px] px-[4px] font-bold tracking-tight text-[16px] truncate">
        {author? author.display_name : currentUser.display_name}
    </Text>
    )

    return (
        <View className="flex-row flex-auto items-center justify-between gap-x-[8px] text-neutral-400 dark:text-neutral-600  ">
            <View className="gap-x-[8px] mr-[8px] flex-row flex-auto ">
                <Profile {...profileData} displaySize="lg" displayType="unit_wo_info" />

                <View className={`flex-col flex-auto ${!isHiddenVisibility ? 'group ' : ''}`}>
        
                    {data?.inputs?.['object_privacy_view'] ? getFormFieldByData(
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
                    ): authorName}

                </View>
            </View>
        </View>
    );
}

export default function FormFeed(props) {
    const formContext = useFormContext()
    const { t } = useTranslation()
    const isFormOnly = props.exProps?.formOnly === true || props.name === 'feed_edit';

    const [showImage, setShowImage] = useState(isFormOnly ? true : false);
    const [modalKey, setModalKey] = useState(0);
    const [responseId, setResponseId] = useState(0)
    const [imageSource, setImageSource] = useState([])
    const { setLayoutData } = useLayoutData()
    const windowDimensions = useWindowDimensions()
    const [isShowHashtag, setIsShowHashtag] = useState(0)
    const isWeb = Platform.OS === 'web'
    const isIos = Platform.OS === 'ios'
    const isSmall = windowDimensions.width < LAYOUT_BREAKPOINTS.sm || !isWeb ? true : false
    const scrollViewRef = useRef(null)

    // Auto-growth state and logic
    const { height: screenHeight } = useWindowDimensions();
    const baseEditorHeight = 120; // Initial height for the post input
    const editorMaxHeight = screenHeight / 2; // Max height it can grow to
    const animatedEditorHeight = useSharedValue(baseEditorHeight);
    const rawEditorText = formContext.watch('text');
    const hasText = useMemo(() => stripTags(rawEditorText || '').trim().length > 0, [rawEditorText]);

    const editorWrapperAnimatedStyle = useAnimatedStyle(() => {
        return {
            height: animatedEditorHeight.value,
        };
    }, [animatedEditorHeight]);

    const updateAnimatedHeight = (newHeight) => {
        if (Math.round(animatedEditorHeight.value) !== Math.round(newHeight)) {
            animatedEditorHeight.value = withTiming(newHeight, {
                duration: 100,
                easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            });
        }
    };

    function checkEditorHeight(reportedInternalHeight) {
        const actualHasText = stripTags(formContext.getValues('text') || '').trim().length > 0;
        
        // For post editor: 1 line text ~24px. Wrapper padding (px-[12px]) ~24px. Editor internal est. ~2px. Total ~50px.
        const minVisualHeightWhenTyping = 50; 
        const visualFloorHeight = actualHasText ? minVisualHeightWhenTyping : baseEditorHeight;
        
        let totalChromeHeightEstimate;
        if (actualHasText) {
            // Wrapper padding: 12px (top) + 12px (bottom) = 24px. Editor internal (estimate): 2px
            totalChromeHeightEstimate = 24 + 2; // 26px
        } else {
            // For baseHeight, chrome is the same as above if baseHeight is for active input.
            // If baseHeight is for an empty, non-focused input, it might be less, but we use consistent for simplicity.
            totalChromeHeightEstimate = 24 + 2; // 26px 
        }

        const growthStepAmount = 24; // Matches .tiptap-default line-height

        const newCalculatedHeight = getEditorHeight(
            reportedInternalHeight,
            visualFloorHeight,
            totalChromeHeightEstimate,
            growthStepAmount,
            editorMaxHeight
        );
        const finalHeight = Math.max(newCalculatedHeight, baseEditorHeight);
        updateAnimatedHeight(finalHeight);
    }

    useEffect(() => {
        const strippedText = stripTags(rawEditorText || '').trim();
        const actualHasText = strippedText.length > 0;
        const minVisualHeightWhenTyping = 50; // Synchronized with checkEditorHeight logic

        if (actualHasText) {
            updateAnimatedHeight(Math.max(animatedEditorHeight.value, minVisualHeightWhenTyping)); 
        } else {
            updateAnimatedHeight(baseEditorHeight); 
        }
    }, [rawEditorText, baseEditorHeight, animatedEditorHeight]);

    function onClose() {
        setShowImage(false)
        if (props.exProps?.onClose) {
            props.exProps.onClose()
        }
    }

    useEffect(() => {
        if (props.response?.id && props.response?.id != responseId) {
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
        <Row className="w-full items-start">

            <View className="flex-auto">
                <ProfileView
                    author={props.exProps?.item?.author_data}
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
                size="sm"
                startDecorator="X"
                hitSlop={4}
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

    const form = <KbAvoidingView className='flex-col flex-auto' offset={isIos ? 10 : 74}>
        {getFormFieldByData(props.data.inputs['action'], props.handleSubmit, 'default')}
        {getFormFieldByData(props.data.inputs['object_cf'], props.handleSubmit, 'default')}
        {getFormFieldByData(props.data.inputs['owner_id'], props.handleSubmit, 'default')}
        {getFormFieldByData(props.data.inputs['type'], props.handleSubmit, 'default')}
        <View className="justify-between flex-col flex-auto">
                <View className="w-full flex-1 justify-start px-[12px] ">
                    <Reanimated.View style={editorWrapperAnimatedStyle} className="flex-auto">
                        {getFormFieldByData(
                            props.data.inputs['text'],
                            props.handleSubmit,
                            'custom',
                            {
                                form_name:props.name,
                                styles: { verticalAlign: 'top' }, 
                                focus: true,
                                noMargin: true,
                                bg: 'transparent',
                                placeholder: 'Write here...',
                                linkify: true,
                                autofocus: Date.now(),
                                classes:'flex-1 tiptap-default',
                                onHeight: checkEditorHeight,
                            }
                        )}
                    </Reanimated.View>
                    <View >
                    <ScrollView keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled" className="w-full " horizontal={true}>
                        {prevList}
                    </ScrollView>
                        <View className="">
                            {props.data.inputs['labels'] && (
                                <View className="flex-auto">
                                    {labels}
                                </View>
                            )}
                        </View>
                    </View>
                </View>

            <View className="  ">

                <View className={
                    '  items-center flex-auto w-full gap-x-[8px] p-[12px] bg-neutral-500/5  ' +
                    (isWeb ? ' ' : ' ') +
                    (isSmall
                        ? ' ' +
                        (isIos ? '  ' : ' bottom-0 ') +
                        '  '
                        : ' lalal ')
                }>

                    <Row className="gap-x-[8px] w-full justify-between ">
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
                                            form_name:props.name,
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
                        <View className=" flex-1 web:flex-none items-end ">
                            <View>
                                {getFormFieldByData(
                                    props.data.inputs['tlb_do_submit'],
                                    props.handleSubmit,
                                    'default',
                                    {
                                        disabled: text != '' ? false : true,
                                        noMargin: true,
                                        size: 'base',
                                        notFullWidth: true,
                                        icon: "SendHorizontal",

                                    }
                                )}</View></View>
                    </Row>
                </View>
            </View>
        </View>
    </KbAvoidingView>

    if (isFormOnly) {
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
                    key={modalKey}
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
                    autoHeight={true}
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
                        setModalKey(k => k + 1)
                    }}
                />
            ) : (
                <Card
                    rounded=" rounded-none sm:rounded-2xl  "
                    margin=" mx-auto mb-1 sm:mb-3 "
                    addClassName=" w-full px-[12px] pt-[8px] pb-[12px] sm:p-[16px]  "
                >
                    {
                        props?.exProps?.showForm !== false && (
                            <View className=" flex-row gap-x-[8px] sm:gap-x-[12px] ">
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
                                            setModalKey(k => k + 1)
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
