import { View, Row, ScrollView } from 'app/design/view'
import { useEffect, useMemo } from 'react'
import { getFormFieldByData } from 'app/lib/form/form-helpers'
import { Keyboard, Platform } from 'react-native'
import { useFormContext } from 'react-hook-form'
import { editorHtmlHasContent, removeEmptyTags } from 'app/lib/util'
import { useCurrentUser } from 'app/context/user'
import Profile from 'app/ui/molecules/profile/profile'
import { FileButton } from 'app/lib/form/form-helpers'
import { useWindowHeight, useIsDesktop } from 'app/context/measure'
import { useSound } from 'app/lib/hooks/use-sound'
import emitter, { EVENTS } from 'app/context/emitter'
import { useTranslation } from 'react-i18next'
import { MessageInput } from 'app/components/elements/chat/parts/message-input'

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

    const hasSubmittableText = useMemo(() => {
        const sanitized = removeEmptyTags(rawEditorText || '')
        return sanitized.trim().length > 0
    }, [rawEditorText])

    const playSound = useSound('success')

    useEffect(() => {
        if (formContext.formState.isSubmitted) {
            playSound()
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
        if (!sanitizedHtml.trim() && !images) return

        formContext.setValue('message', sanitizedHtml, { shouldValidate: true, shouldDirty: true })
        props.handleSubmit()
    }

    const handleEditorEnterSubmit = () => {
        handleSubmitWithSanitization()
    }

    props.data.inputs['payload'].value = parseInt((new Date()).getTime() / 1000)

    props.data.inputs['submit'].hide_errors = true
    props.data.inputs['submit'].icon = 'ArrowUp'
    props.data.inputs['submit'].style = 'bordered'
    props.data.inputs['submit'].rounded = 'true'
    props.data.inputs['submit'].icon_only = true
    props.data.inputs['files'].rounded = 'true'
    props.data.inputs['files'].variant = 'default'

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
                            props.data.inputs['submit'],
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
                            props.data.inputs['files'],
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
