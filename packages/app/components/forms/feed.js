import { View, Row } from 'app/design/view'
import { Button } from 'app/design/controls'
import { useState, useRef, useMemo, useEffect } from 'react'
import { getFormFieldByData } from 'app/lib/form-helpers'
import KbAvoidingView from 'app/ui/atoms/kb-avoiding-view'
import { Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useCurrentUser } from 'app/context/user'
import Profile from 'app/ui/molecules/profile'
import { stripTags } from 'app/lib/util'
import { Keyboard } from 'react-native'
import { useFormContext } from 'react-hook-form'
import { PollButton, LabelButton, FileButton } from 'app/lib/form-helpers'
import { useWindowHeight } from 'app/context/measure';
import ProfileSwitcher from 'app/components/elements/profile_switcher'
import emitter from 'app/context/emitter';
import { Icon } from 'app/ui/atoms/icon'
import { Text } from 'app/design/typography';
import { useSound } from 'app/lib/hooks/useSound';

export default function FormFeed({ data, handleSubmit, exProps, name, response }) {
    const formContext = useFormContext()
    const isFormOnly = exProps?.formOnly === true || name === 'feed_edit';

    const [showImage, setShowImage] = useState(isFormOnly ? true : false);
    const [responseId, setResponseId] = useState(0)

    const isWeb = Platform.OS === 'web'
    const isIos = Platform.OS === 'ios'
    const scrollViewRef = useRef(null)
    const screenHeight = useWindowHeight();
    const insets = useSafeAreaInsets();
    const { currentUser } = useCurrentUser();

    // iOS: расстояние от верха экрана до KbAvoidingView = safe area + паддинг модалки (16) + шапка формы (~48) + gap (12).
    // Android окно ресайзится само, оставляем прежний рабочий offset.
    const modalOffset = isIos ? insets.top + 76 : 60;

    const rawEditorText = formContext.watch('text');
    const object_privacy_view = formContext.watch('object_privacy_view');

    const hasText = useMemo(() => stripTags(rawEditorText || '').trim().length > 0, [rawEditorText]);

    const playSound = useSound('success');

    function onClose() {
        setShowImage(false)
        exProps?.onClose?.();
    }

    useEffect(() => {
        if (response?.id && response?.id != responseId) {
            playSound();
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

    const isHiddenVisibility = data?.inputs?.['object_privacy_view']?.origtype == 'hidden' || !data?.inputs?.['object_privacy_view']

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

    const isPollsPresent = !!data.inputs['polls'];
    const isLabelsPresent = !!data.inputs['labels'];
    const isButtonDisabled = !hasText || ((!isHiddenVisibility && object_privacy_view == '')) ? true : false;
    if (isFormOnly) {
        return (
            <View className="w-full flex-1 gap-3">
                <View className="items-start justify-start ">
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
                                    className="text-muted-foreground"
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
                </View>
                <KbAvoidingView className="flex-auto" modalOffset={modalOffset}>
                    {getFormFieldByData(data.inputs['action'], handleSubmit, 'default')}
                    {getFormFieldByData(data.inputs['object_cf'], handleSubmit, 'default')}
                    {getFormFieldByData(data.inputs['owner_id'], handleSubmit, 'default')}
                    {getFormFieldByData(data.inputs['type'], handleSubmit, 'default')}
                    <View className="justify-between flex-auto gap-2">
                        <View className="w-full flex-auto justify-start ">
                            <View
                                className="flex-auto "
                                style={{
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
                                        classes: 'flex-auto',
                                        initialHeight: 160,
                                        maxHeight: screenHeight / 2 - 80 ,
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
                        <View className="pb-0">
                            <View className={`items-center flex-auto w-full gap-2  `}>
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
                                                    size: 'sm',
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
            </View>
        )
    }
}
