import { View, Row, ScrollView } from 'app/design/view'
import { useEffect, useMemo } from 'react'
import { getFormFieldByData } from 'app/lib/form/form-helpers'
import { Keyboard, Platform } from 'react-native'
import { useFormContext } from 'react-hook-form'
import { editorHtmlHasContent, editorHtmlIsSubmittable, hasFiles, removeEmptyTags } from 'app/lib/util'
import { useCurrentUser } from 'app/context/user'
import Profile from 'app/ui/molecules/profile/profile'
import { FileButton } from 'app/lib/form/form-helpers'
import { useWindowHeight, useIsDesktop } from 'app/context/measure'
import emitter, { EVENTS } from 'app/context/emitter'
import { useTranslation } from 'react-i18next'
import { MessageInput } from 'app/components/elements/chat/parts/message-input'

/** Send time in seconds. Module level on purpose: it is called from the submit handler, never while rendering. */
const nowInSeconds = () => Math.floor(Date.now() / 1000)

export default function FormMessenger(props) {
    const { t } = useTranslation()
    const isWeb = Platform.OS == 'web'
    const screenHeight = useWindowHeight()
    const isDesktop = useIsDesktop()
    const minHeightEditor = 20
    const maxHeightEditor = isWeb ? 160 : (screenHeight - 300) / 2
    const formContext = useFormContext()
    const { currentUser } = useCurrentUser()

    const rawEditorText = formContext.watch('message')
    const imagesValue = formContext.watch('files')

    const hasText = useMemo(
        () => editorHtmlHasContent(rawEditorText),
        [rawEditorText]
    )

    const hasSubmittableText = useMemo(
        () => editorHtmlIsSubmittable(rawEditorText),
        [rawEditorText]
    )

    useEffect(() => {
        // The success cue plays when UNA returns the sent message (messenger/parts/common.js).
        if (formContext.formState.isSubmitted) {
            formContext.setValue('message', '')
            emitter.emit(EVENTS.editor, { action: 'set_content', value: '' })
            emitter.emit(EVENTS.fieldFiles('files'), { action: 'clear' })
            if (!isWeb) {
                emitter.emit(EVENTS.editor, { action: 'blur' })
                Keyboard.dismiss()
            }
        }
    }, [formContext.formState.isSubmitted, formContext, isWeb])

    const handleSubmitWithSanitization = () => {
        let sanitizedHtml = removeEmptyTags(formContext.getValues('message') || '')
        const images = formContext.getValues('files')
        if (!editorHtmlIsSubmittable(sanitizedHtml) && !hasFiles(images)) return

        formContext.setValue('message', sanitizedHtml, { shouldValidate: true, shouldDirty: true })
        formContext.setValue('payload', nowInSeconds())
        props.handleSubmit()
    }

    const handleEditorEnterSubmit = () => {
        handleSubmitWithSanitization()
    }

    // Copies with the composer's look; `props` itself is never written to.
    const submitInput = {
        ...props.data.inputs['submit'],
        hide_errors: true,
        icon: 'ArrowUp',
        style: 'bordered',
        rounded: 'true',
        icon_only: true,
    }
    const filesInput = {
        ...props.data.inputs['files'],
        rounded: 'true',
        variant: 'default',
    }

    const hasContent = !!hasText || !!imagesValue

    return (
        <MessageInput
            expanded={hasContent}
            header={<>
                {getFormFieldByData(props.data.inputs['action'], props.handleSubmit, 'custom')}
                {getFormFieldByData(props.data.inputs['cf'], props.handleSubmit, 'custom')}
                {getFormFieldByData(props.data.inputs['payload'], props.handleSubmit, 'custom')}
                {getFormFieldByData(props.data.inputs['id'], props.handleSubmit, 'custom')}
                {getFormFieldByData(props.data.inputs['message_id'], props.handleSubmit, 'custom')}
                {getFormFieldByData(props.data.inputs['send'], props.handleSubmit, 'custom')}
            </>}
            avatar={currentUser ? (
                <Profile
                    {...currentUser}
                    url_avatar={currentUser.avatar}
                    displayType="unit_wo_info"
                    displaySize="sm"
                />
            ) : null}
            actions={<>
                <FileButton style="borderless" field_name='files' size="sm" icon="Image" source='library' />
                {!isWeb ? (
                    <FileButton field_name='files' style="borderless" size='sm' icon="Camera" source='camera' />
                ) : null}
                {hasContent ? (
                    <View className="">
                        {getFormFieldByData(
                            submitInput,
                            handleSubmitWithSanitization,
                            'custom',
                            {
                                form_name: props.name,
                                disabled: !hasSubmittableText && !hasFiles(imagesValue),
                                className: 'w-full h-full',
                                notFullWidth: true,
                                noPadding: true,
                                icon_only: true,
                                icon: 'ArrowUp',
                                title: t('Send'),
                                size: 'sm',
                                style: 'glassProminent',
                                rounded: true,
                                alt: t('Send'),
                                tooltip: t('Send'),
                            }
                        )}
                    </View>
                ) : null}
            </>}
            footer={<>
                <ScrollView horizontal={true}>
                    <Row className="flex-wrap  mx-1">
                        {getFormFieldByData(
                            filesInput,
                            props.handleSubmit,
                            'notitle',
                            { hide_button: true, list_only: true, asDefaultStorage: true, form_name: props.name }
                        )}
                    </Row>
                </ScrollView>
                {getFormFieldByData(props.data.inputs['cmt_mood'], props.handleSubmit, 'custom')}
            </>}
        >
            {getFormFieldByData(
                props.data.inputs['message'],
                props.handleSubmit,
                'custom',
                {
                    form_name: props.name,
                    container_class: 'comments',
                    classes: 'text-card-foreground tiptap-comments',
                    autofocus: false,
                    bg: 'transparent',
                    placeholder: t('Message...'),
                    noPadding: true,
                    initialHeight: minHeightEditor,
                    maxHeight: maxHeightEditor,
                    onEnterSubmit: handleEditorEnterSubmit,
                    enableSubmitOnEnter: isDesktop,
                    focus: true,
                }
            )}
        </MessageInput>
    )
}
