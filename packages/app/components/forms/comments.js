import { View, Row, ScrollView } from 'app/design/view'
import { useEffect, useMemo } from 'react'
import { getFormFieldByData } from 'app/lib/form-helpers'
import { Keyboard, Platform } from 'react-native'
import { useFormContext } from 'react-hook-form'
import { editorHtmlHasContent, removeEmptyTags } from 'app/lib/util'
import { useCurrentUser } from 'app/context/user'
import Profile from 'app/ui/molecules/profile'
import { FileButton } from 'app/lib/form-helpers'
import { useWindowHeight, useIsDesktop } from 'app/context/measure';
import emitter from 'app/context/emitter';
import { useSound } from 'app/lib/hooks/useSound';

export default function FormComments(props) {
    const isWeb = Platform.OS == 'web'
    const screenHeight = useWindowHeight();
    const isDesktop = useIsDesktop();
    const exProps = props?.exProps ?? {};
    const isModalForm = !!exProps.isModal;
    const shouldGrowFromBottom = isModalForm || !isDesktop;
    const minHeightEditor = props.data.inputs['cmt_id']?.value ? 160 : 20;
    const maxHeightEditor = isWeb ? 160 : (screenHeight - 300) / 2 // 300 is approximate keyboard height
    const formContext = useFormContext()
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
            emitter.emit(`comment`, { action: 'send'})
            emitter.emit(`editor`, { action: 'set_content', value: '' })
            emitter.emit(`fld_files_cmt_image`, { action: 'clear' })
            if (!isWeb) {
                emitter.emit('editor', { action: 'blur' })
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

    const hasContent = !!hasText || !!imagesValue || props.data.inputs['cmt_text'].html == 2 || props.data.inputs['cmt_text'].html == 1

    return (
        
        <View className={`w-full flex-auto bg-card/90 backdrop-blur-lg shadow-btn-glass dark:shadow-btn-glass-deep ${hasContent ? 'rounded-2xl' : 'rounded-full'}`}>
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
               
                <View className="flex-auto ">
                    <View className=" items-stretch " >
                        <View
                            className={`p-2.5 min-h-11 flex-auto items-center ${shouldGrowFromBottom ? "justify-center" : "justify-start"} ${hasContent ? 'mb-10' : 'ms-10'}`}
                            style={{
                                
                                ...(isWeb && { transition: 'height 0.1s cubic-bezier(0.25, 0.1, 0.25, 1), padding-bottom 0.1s cubic-bezier(0.25, 0.1, 0.25, 1)' })
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
                                    placeholder: 'Leave a comment...',
                                    noPadding: true,
                                    initialHeight: minHeightEditor,
                                    maxHeight: maxHeightEditor,
                                    onFocus: setIsFocus,
                                    onEnterSubmit: handleEditorEnterSubmit,
                                    enableSubmitOnEnter: true
                                }
                            )}
                        </View>
                        {currentUser && (
                            <View className="absolute flex bottom-1.5 left-1.5 items-center justify-center">
                   
                        <Profile
                            {...currentUser}
                            url_avatar={currentUser.avatar}
                            displayType="unit_wo_info"
                            displaySize="sm"
                        />
                   
                    </View>
                )}
                        <View className="flex-row absolute bottom-1.5 right-1.5 ">
                            
                          
                            <Row className={'items-center justify-center gap-2'}>
                                <FileButton style="borderless" field_name='cmt_image' size="sm" icon="Image" source='library' />
                                {!isWeb && (
                                        <FileButton field_name='cmt_image' style="borderless" size='sm' icon="Camera" source='camera' />
                                    
                                )}
                                {(hasContent) && (
                                <View className="">
                                    {getFormFieldByData(
                                        props.data.inputs['cmt_submit'],
                                        handleSubmitWithSanitization,
                                        'custom',
                                        {
                                            disabled: !hasSubmittableText && !imagesValue,
                                            className: 'w-full h-full',
                                            notFullWidth: true,
                                            noPadding: true,
                                            icon_only: true,
                                            icon: 'ArrowUp',
                                            title: 'Send',
                                            size: 'sm',
                                            style: 'glassProminent',
                                            rounded: true,
                                            alt: 'Post',
                                            tooltip: 'Post',
                                        }
                                    )}
                                </View>
                            )}
                            </Row>
                            
                        </View>
                    </View>
                </View>
            </Row>
            <ScrollView horizontal={true}>
                <Row className="flex-wrap mb-1 mx-1">{
                    getFormFieldByData(
                        props.data.inputs['cmt_image'],
                        props.handleSubmit,
                        'notitle',
                        { hide_button: true, list_only: true, asDefaultStorage: true, form_name: props.name}
                    )
                }</Row>
            </ScrollView>
            {getFormFieldByData(
                props.data.inputs['cmt_mood'],
                props.handleSubmit,
                'custom'
            )}
        </View>
    )
}
