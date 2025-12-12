import { View, Row } from 'app/design/view'
import { Button, Modal } from 'app/design/controls'
import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { getFormFieldByData } from 'app/lib/form-helpers'
import { FeedbackHaptics } from 'app/lib/util'
import KbAvoidingView from 'app/ui/atoms/kb-avoiding-view'
import { Platform } from 'react-native'
import { Text } from 'app/design/typography'
import { useCurrentUser } from 'app/context/user'
import Profile from 'app/ui/molecules/profile'
import Card from 'app/ui/molecules/card'
import { useTranslation } from 'react-i18next'
import { stripTags } from 'app/lib/util'
import { Keyboard } from 'react-native'
import { useFormContext } from 'react-hook-form'
import { getEditorHeight } from 'app/lib/form-helpers';
import { PollButton, LabelButton, FileButton } from 'app/lib/form-helpers'
import { useBreakpoint, useWindowHeight } from 'app/context/measure';
import ProfileSwitcher from 'app/components/elements/profile_switcher'
import emitter from 'app/context/emitter';
import { Icon } from 'app/ui/atoms/icon'

export default function FormFeed({data, handleSubmit, exProps, name, response}) {
    const formContext = useFormContext()
    const { t } = useTranslation()
    const isFormOnly = exProps?.formOnly === true || name === 'feed_edit';

    const [showImage, setShowImage] = useState(isFormOnly ? true : false);
    const [modalKey, setModalKey] = useState(0);
    const [responseId, setResponseId] = useState(0)

    const isWeb = Platform.OS === 'web'
    const isIos = Platform.OS === 'ios'
    const currentBreakpoint = useBreakpoint();
    const isSmall = currentBreakpoint == 0 || !isWeb ? true : false
    const scrollViewRef = useRef(null)

    // Auto-growth state and logic
    const screenHeight = useWindowHeight();
    const baseEditorHeight = 120; // Initial height for the post input
    const editorMaxHeight = screenHeight / 2; // Max height it can grow to
    const [editorHeight, setEditorHeight] = useState(baseEditorHeight);
    const rawEditorText = formContext.watch('text');
    const hasText = useMemo(() => stripTags(rawEditorText || '').trim().length > 0, [rawEditorText]);

    // Track the last reported height to avoid unnecessary re-renders from small fluctuations
    const lastReportedHeightRef = useRef(baseEditorHeight);
    const lineHeight = 24; // Matches .tiptap-default line-height

    const updateEditorHeight = useCallback((newHeight) => {
        // Only update if height changed by at least half a line height (12px)
        // This prevents flickering from small scrollHeight fluctuations
        const heightDiff = Math.abs(newHeight - lastReportedHeightRef.current);
        if (heightDiff >= lineHeight / 2) {
            lastReportedHeightRef.current = newHeight;
            setEditorHeight(newHeight);
        }
    }, []);

    function checkEditorHeight(reportedInternalHeight) {
        const actualHasText = stripTags(formContext.getValues('text') || '').trim().length > 0;

        // For post editor: 1 line text ~24px. Wrapper padding (px-3) ~24px. Editor internal est. ~2px. Total ~50px.
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
        updateEditorHeight(finalHeight);
    }

    // Only reset height when text becomes completely empty (not on every keystroke)
    const prevHasTextRef = useRef(hasText);
    useEffect(() => {
        const hadText = prevHasTextRef.current;
        prevHasTextRef.current = hasText;
        
        // Only reset to base height when transitioning from having text to empty
        if (hadText && !hasText) {
            lastReportedHeightRef.current = baseEditorHeight;
            setEditorHeight(baseEditorHeight);
        }
    }, [hasText, baseEditorHeight]);

    function onClose() {
        setShowImage(false)
        exProps?.onClose?.();
    }

    useEffect(() => {
        if (response?.id && response?.id != responseId) {
            emitter.emit('feed', { action: 'new_content', data: response });
            onClose();
            setResponseId(response?.id)
        }
    }, [response?.id])

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

    let text = formContext.watch('text');
    let object_privacy_view = formContext.watch('object_privacy_view');
    const isHiddenVisibility = data?.inputs?.['object_privacy_view']?.origtype == 'hidden' || !data?.inputs?.['object_privacy_view']
    if (!text) text = ''
    if (typeof text === 'string') {
        text = stripTags(text).trim()
    }

    const { currentUser } = useCurrentUser();
    const hasMultipleProfiles = currentUser?.profiles_count > 1;

    const displayProfile = exProps?.item?.author_data || {
        ...currentUser,
        url_avatar: currentUser.avatar,
        url: null,
    };

    const profileData = {
        ...displayProfile,
        url_avatar: displayProfile.url_avatar || displayProfile.avatar,
        url: null,
    };

    const header = (
        <Row className="w-full items-center justify-between gap-x-2">
            <Row className="gap-1 flex-row flex-auto items-center">
                <ProfileSwitcher hideTitle={true} listOnly={true}>
                    <Button 
                        size="sm" 
                        variant="secondary" 
                        startDecorator={<Profile {...profileData} displaySize="xs" displayType="unit_wo_info" />} 
                        title={displayProfile.display_name} 
                        endDecorator={hasMultipleProfiles ? 'ChevronsUpDown' : null}
                    />
                </ProfileSwitcher>

                <Icon
                        icon="ChevronRight"
                        size={16}
                        className="text-muted-foreground opacity-60"
                    />

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
                        variant: 'secondary',
                        noContainer: true,
                        align: 'start',

                    }
                ) : 'hz'}
            </Row>


            <Button
                onPress={onClose}
                variant="secondary"
                rounded
                size="sm"
                startDecorator="X"
            />
        </Row>
    )

    const handleModalClose = useCallback(() => {
        Keyboard.dismiss()
        setShowImage(false)
    }, []);


    const isPollsPresent = !!data.inputs['polls'];
    const isLabelsPresent = !!data.inputs['labels'];

    let isButtonDisabled = false;
    if (text == '')
        isButtonDisabled = true;
    if (!isHiddenVisibility && object_privacy_view == '')
        isButtonDisabled = true;

    const form = <KbAvoidingView className="flex-1">
        {getFormFieldByData(data.inputs['action'], handleSubmit, 'default')}
        {getFormFieldByData(data.inputs['object_cf'], handleSubmit, 'default')}
        {getFormFieldByData(data.inputs['owner_id'], handleSubmit, 'default')}
        {getFormFieldByData(data.inputs['type'], handleSubmit, 'default')}
        <View className="justify-between flex-col flex-auto ">
            <View className="w-full flex-1 justify-start px-1.5 ">
                <View
                    className="flex-auto"
                    style={{
                        height: editorHeight,
                        ...(isWeb && { transition: 'height 0.1s cubic-bezier(0.25, 0.1, 0.25, 1)' })
                    }}
                >
                    {getFormFieldByData(
                        data.inputs['text'],
                        handleSubmit,
                        'custom',
                        {
                            form_name: name,
                            styles: { verticalAlign: 'top' },
                            focus: true,
                            noPadding: true,
                            bg: 'transparent',
                            placeholder: 'Write here...',
                            linkify: true,
                            autofocus: Date.now(),
                            classes: 'flex-1 tiptap-default',
                            onHeight: checkEditorHeight,
                        }
                    )}
                </View>
                <View >
                    <Row className='flex-wrap w-full'>
                        {
                            getFormFieldByData(
                                data.inputs['video'],
                                handleSubmit,
                                'notitle',
                                { hide_button: true, list_only: true }
                            )
                        }
                        {
                            getFormFieldByData(
                                data.inputs['photo'],
                                handleSubmit,
                                'notitle',
                                { hide_button: true, list_only: true }
                            )
                        }
                        {
                            getFormFieldByData(
                                data.inputs['file'],
                                handleSubmit,
                                'notitle',
                                { hide_button: true, list_only: true }
                            )
                        }
                    </Row>

                    {isLabelsPresent && (
                        <View className="flex-auto">
                            {
                                getFormFieldByData(
                                    data.inputs['labels'],
                                    handleSubmit,
                                    'notitle',
                                    { hide_button: true, noPadding: true }
                                )
                            }
                        </View>
                    )}
                    {isPollsPresent && (
                        <View className="">
                            {getFormFieldByData(
                                data.inputs['polls'],
                                handleSubmit,
                                'custom',
                                { hide_button: true }
                            )}
                        </View>
                    )}

                </View>
            </View>

            <View className="  ">

                <View className={
                    '  items-center flex-auto w-full gap-x-2 sm:p-1   ' +
                    (isWeb ? ' ' : ' ') +
                    (isSmall
                        ? ' ' +
                        (isIos ? '  ' : ' bottom-0 ') +
                        '  '
                        : ' lalal ')
                }>

                    <Row className="gap-x-2 w-full justify-between ">
                        <Row className="flex-none gap-x-2">
                            {data.inputs['obfuscate_faces'] && (
                                <View className="">
                                    {getFormFieldByData(
                                        data.inputs['obfuscate_faces'],
                                        handleSubmit,
                                        'default'
                                    )}
                                </View>
                            )}
                            {data.inputs['photo'] && (
                                <View className="">
                                    <FileButton field_name='photo' icon="Image" tooltip='Add Photos' />
                                </View>
                            )}
                            {data.inputs['video'] && (
                                <View className="">
                                    <FileButton field_name='video' icon="Image" tooltip='Add Photos or Videos' />
                                </View>
                            )}
                            {(data.inputs['video'] && !isWeb) && (
                                <View className="">
                                    <FileButton field_name='video' icon="Image" />
                                </View>
                            )}
                            {data.inputs['file'] && (
                                <View>
                                    <FileButton field_name='file' icon="Paperclip" />
                                </View>
                            )}
                            {isLabelsPresent && (
                                <View>
                                    <LabelButton field_name='labels' />
                                </View>
                            )}
                            {isPollsPresent && (
                                <View className="">
                                    <PollButton field_name='polls' />
                                </View>
                            )}
                        </Row>
                        <View className=" flex-1 web:flex-none items-end ">
                            <View>
                                {getFormFieldByData(
                                    data.inputs['tlb_do_submit'],
                                    handleSubmit,
                                    'default',
                                    {
                                        disabled: isButtonDisabled,
                                        noPadding: true,
                                        size: 'base',
                                        notFullWidth: true,
                                        icon: "SendHorizontal",

                                    }
                                )}
                            </View>
                        </View>
                    </Row>
                </View>
            </View>
        </View>
    </KbAvoidingView>

    if (isFormOnly) {
        return (
            <View className="w-full flex-1 h-full">
                <View className="items-start justify-start sm:p-1 ">
                    {header}
                </View>
                {form}
            </View>
        )
    }

    /*return (
        <View className="w-full">
            {showImage && (
                <Modal
                    key={modalKey}
                    title={isSmall ? header : (
                        <ProfileView
                            data={data}
                            handleSubmit={handleSubmit}
                            showImage={showImage}
                            setShowImage={setShowImage}
                        />
                    )}
                    onVisible={showImage}

                    {...(!isSmall && { onClose: handleModalClose })}
                    padding=" p-0 "
                    transparent={true}
                    autoHeight={true}
                    onRequestClose={handleModalClose}
                >
                    {form}
                </Modal>
            )}
            {exProps?.mode == 'button' ? (
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
                    rounded=" rounded-none sm:rounded-2xl   "
                    margin=" mx-auto mb-1 sm:mb-3 border-y border-x-none sm:border-x "
                    addClassName=" w-full px-3 pt-2 pb-3 sm:p-4  "
                    border="border-y border-x-none sm:border "
                >
                    {
                        props?.exProps?.showForm !== false && (
                            <Row className="gap-2 lg:gap-3">
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
                            </Row>)
                    }
                </Card>
            )}
        </View>
    )*/
}
