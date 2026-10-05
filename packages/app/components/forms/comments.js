import { View, Row, ScrollView } from 'app/design/view'
import { useEffect, useMemo } from 'react'
import { getFormFieldByData } from 'app/lib/form/form-helpers'
import { Keyboard, Platform } from 'react-native'
import { useFormContext } from 'react-hook-form'
import { editorHtmlHasContent, removeEmptyTags, getStoragePickerKind } from 'app/lib/util'
import { useCurrentUser } from 'app/context/user'
import Profile from 'app/ui/molecules/profile/profile'
import { FileButton } from 'app/lib/form/form-helpers'
import { useWindowHeight, useIsDesktop } from 'app/context/measure';
import emitter, { EVENTS } from 'app/context/emitter';
import { useSound } from 'app/lib/hooks/use-sound';
import { useTranslation } from 'react-i18next'
import { StarsAction } from 'app/ui/atoms/stars'

export default function FormComments(props) {
    const { t } = useTranslation()
    const isWeb = Platform.OS == 'web'
    const screenHeight = useWindowHeight();
    const isDesktop = useIsDesktop();
    const exProps = props?.exProps ?? {};
    const isModalForm = !!exProps.isModal;
    const shouldGrowFromBottom = isModalForm || !isDesktop;
    const minHeightEditor = props.data.inputs['cmt_id']?.value ? 160 : 20;
    const maxHeightEditor = isWeb ? 160 : (screenHeight - 300) / 2 // 300 is approximate keyboard height
    const formContext = useFormContext()
    const { register, setValue } = formContext
    const { currentUser } = useCurrentUser()
    let isAutoFocus = false;
    if (props.data.inputs['cmt_text']?.value){
        isAutoFocus = true;
    }
    if (props.data.inputs['cmt_text'].autofocus){
        isAutoFocus = props.data.inputs['cmt_text'].autofocus;
    }
   
  

    const rawEditorText = formContext.watch('cmt_text')
    const imagesValue = formContext.watch('cmt_image')
    const moodValue = formContext.watch('cmt_mood')

    const hasText = useMemo(
        () => editorHtmlHasContent(rawEditorText),
        [rawEditorText]
    );

    const hasSubmittableText = useMemo(() => {
        const sanitized = removeEmptyTags(rawEditorText || '')
        return sanitized.trim().length > 0
    }, [rawEditorText]);

    function setIsFocus() {
        // setIsExImage(false)
    }

    const playSound = useSound('success');

    useEffect(() => {
        if (formContext.formState.isSubmitted) {
            playSound();
            formContext.setValue('cmt_text', '');
            if (props.data.inputs['cmt_mood']) {
                formContext.setValue('cmt_mood', 0);
            }
            emitter.emit(EVENTS.comment, { action: 'send'})
            emitter.emit(EVENTS.editor, { action: 'set_content', value: '' })
            emitter.emit(EVENTS.fieldFiles('cmt_image'), { action: 'clear' })
            if (!isWeb) {
                emitter.emit(EVENTS.editor, { action: 'blur' })
                Keyboard.dismiss()
            }
        }
    }, [formContext.formState.isSubmitted, formContext, isWeb]);

    const handleSubmitWithSanitization = () => {
        let sanitizedHtml = removeEmptyTags(formContext.getValues('cmt_text') || '');
        const images = formContext.getValues('cmt_image');
        if (!sanitizedHtml.trim() && !images) return;

        formContext.setValue('cmt_text', sanitizedHtml, { shouldValidate: true, shouldDirty: true });
        props.handleSubmit();
    };

    const handleEditorEnterSubmit = () => {
        handleSubmitWithSanitization();
    };

    props.data.inputs['cmt_submit'].hide_errors = true
    props.data.inputs['cmt_submit'].icon = 'ArrowUp'
    props.data.inputs['cmt_submit'].style = 'bordered'
    props.data.inputs['cmt_submit'].rounded = 'true'
    props.data.inputs['cmt_submit'].icon_only = true
    props.data.inputs['cmt_image'].rounded = 'true'
    props.data.inputs['cmt_image'].variant = 'default'
    // Comment storage decides: images-only modules keep the photo icon, others get a generic attachment.
    const attachIcon = getStoragePickerKind(props.data.inputs['cmt_image'].ext_allow) === 'any' ? 'Paperclip' : 'Image'

    const hasContent = !!hasText || !!imagesValue || props.data.inputs['cmt_text'].html == 2 || props.data.inputs['cmt_text'].html == 1
    // Jobs reviews send `cmt_mood` (star rating). Keep it on the composer
    // toolbar so the empty pill stays a single line — same row as the
    // placeholder and attach button — then it drops to the bottom with
    // attach/send once the composer expands.
    const hasMood = !!props.data.inputs['cmt_mood']
    const moodInline = hasMood && !hasContent

    useEffect(() => {
        if (!hasMood) return
        register('cmt_mood')
    }, [register, hasMood])

    return (
        
        // Resting composer is a single-line pill; once there's content (or the
        // rich toolbar expands it) the taller box switches to a card radius.
        <View className={`w-full flex-auto bg-card/90 backdrop-blur-lg shadow-input-outline dark:shadow-input-outline-deep ${hasContent ? 'rounded-xl' : 'rounded-full'}`}>
            {getFormFieldByData(
                props.data.inputs['action'],
                props.handleSubmit,
                'custom'
            )}
            {getFormFieldByData(
                props.data.inputs['cmt_cf'],
                props.handleSubmit,
                'custom'
            )}
            {getFormFieldByData(
                props.data.inputs['cmt_parent_id'],
                props.handleSubmit,
                'custom'
            )}
            {getFormFieldByData(
                props.data.inputs['id'],
                props.handleSubmit,
                'custom'
            )}
            {getFormFieldByData(
                props.data.inputs['sys'],
                props.handleSubmit,
                'custom'
            )}
            <Row className={`w-full gap-1 flex-auto ${shouldGrowFromBottom ? 'items-end' : 'items-start'} `}>
                <View className="flex-auto">
                    <View className="relative items-stretch">
                        <Row className={moodInline ? 'items-center' : undefined}>
                            <View
                                className={`p-3 min-h-12 flex-auto min-w-0 items-center ${shouldGrowFromBottom ? 'justify-center' : 'justify-start'} ${hasContent ? 'mb-10 w-full' : 'ms-10'}`}
                                style={{
                                    ...(isWeb && { transition: 'height 0.1s cubic-bezier(0.25, 0.1, 0.25, 1), padding-bottom 0.1s cubic-bezier(0.25, 0.1, 0.25, 1)' }),
                                }}
                            >
                                {getFormFieldByData(
                                    props.data.inputs['cmt_text'],
                                    props.handleSubmit,
                                    'custom',
                                    {
                                        form_name: props.name,
                                        container_class: 'comments',
                                        classes: 'text-card-foreground tiptap-comments',
                                        autofocus: isAutoFocus,
                                        bg: 'transparent',
                                        placeholder: t('Leave a comment...'),
                                        noPadding: true,
                                        initialHeight: minHeightEditor,
                                        maxHeight: maxHeightEditor,
                                        onFocus: setIsFocus,
                                        onEnterSubmit: handleEditorEnterSubmit,
                                        enableSubmitOnEnter: isDesktop,
                                    }
                                )}
                            </View>
                            <View className={moodInline ? 'pe-1.5' : 'absolute bottom-1.5 right-1.5'}>
                                <Row className="items-center justify-center gap-1.5">
                                    {hasMood ? (
                                        <StarsAction
                                            rating={Number(moodValue) || 0}
                                            onChange={(next) => setValue('cmt_mood', next, { shouldDirty: true })}
                                            starSize={isDesktop ? 22 : 20}
                                            hitSize={isDesktop ? 40 : 36}
                                        />
                                    ) : null}
                                    <FileButton style="borderless" field_name="cmt_image" size="sm" icon={attachIcon} source="library" />
                                    {!isWeb ? (
                                        <FileButton field_name="cmt_image" style="borderless" size="sm" icon="Camera" source="camera" />
                                    ) : null}
                                    {hasContent ? (
                                        <View>
                                            {getFormFieldByData(
                                                props.data.inputs['cmt_submit'],
                                                handleSubmitWithSanitization,
                                                'custom',
                                                {
                                                    form_name: props.name,
                                                    disabled: !hasSubmittableText && !imagesValue,
                                                    className: 'w-full h-full',
                                                    notFullWidth: true,
                                                    noPadding: true,
                                                    icon_only: true,
                                                    icon: 'ArrowUp',
                                                    title: t('Send'),
                                                    size: 'sm',
                                                    style: 'glassProminent',
                                                    rounded: true,
                                                    alt: t('Post'),
                                                    tooltip: t('Post'),
                                                }
                                            )}
                                        </View>
                                    ) : null}
                                </Row>
                            </View>
                        </Row>
                        {currentUser ? (
                            <View className="absolute flex bottom-1.5 left-1.5 items-center justify-center">
                                <Profile
                                    {...currentUser}
                                    url_avatar={currentUser.avatar}
                                    displayType="unit_wo_info"
                                    displaySize="md"
                                />
                            </View>
                        ) : null}
                    </View>
                </View>
            </Row>
            <ScrollView horizontal={true}>
                <Row className={imagesValue ? 'flex-wrap mb-1 mx-1' : 'flex-wrap'}>
                    {getFormFieldByData(
                        props.data.inputs['cmt_image'],
                        props.handleSubmit,
                        'notitle',
                        { hide_button: true, list_only: true, asDefaultStorage: true, form_name: props.name}
                    )}
                </Row>
            </ScrollView>
        </View>
    )
}
