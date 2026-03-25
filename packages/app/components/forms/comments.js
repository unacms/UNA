import { View, Row, ScrollView } from 'app/design/view'
import { useEffect, useMemo } from 'react'
import { getFormFieldByData } from 'app/lib/form-helpers'
import { Platform } from 'react-native'
import { useFormContext } from 'react-hook-form'
import { stripTags, removeEmptyTags } from 'app/lib/util'
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

    const hasText = useMemo(() => stripTags(rawEditorText || '').trim().length > 0, [rawEditorText]);

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
            
        }
    }, [formContext.formState.isSubmitted, formContext]);

    const handleSubmitWithSanitization = () => {
        let sanitizedHtml = formContext.getValues('cmt_text');
        sanitizedHtml = removeEmptyTags(sanitizedHtml);

        formContext.setValue('cmt_text', sanitizedHtml, { shouldValidate: true, shouldDirty: true });
        props.handleSubmit();
    };

    const handleEditorEnterSubmit = () => {
        const currentText = formContext.getValues('cmt_text');
        const currentHasText = stripTags(currentText || '').trim().length > 0;
        if (currentHasText) {
            handleSubmitWithSanitization();
        }
    };

    props.data.inputs['cmt_submit'].hide_errors = true

    props.data.inputs['cmt_submit'].icon = 'SendHorizontal'
    props.data.inputs['cmt_submit'].variant = 'primary'
    props.data.inputs['cmt_submit'].rounded = 'true'
    props.data.inputs['cmt_submit'].icon_only = true
    props.data.inputs['cmt_image'].rounded = 'true'
    props.data.inputs['cmt_image'].variant = 'default'

    const hasContent = !!hasText || !!imagesValue

    return (
        
        <View className="w-full  flex-auto">
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
            <Row className={`w-full gap-x-2 ${shouldGrowFromBottom ? 'items-end' : 'items-start'}`}>
                {currentUser && (
                    <View className="h-11 py-1"> 
                        <Profile
                            {...currentUser}
                            url_avatar={currentUser.avatar}
                            displayType="unit_wo_info"
                            displaySize="md"

                        />
                    </View>
                )}
                <View className="flex-auto ">
                    <View className=" items-stretch bg-input rounded-xl flex-auto" >
                        <View
                            className={`p-3 min-h-11  flex-auto items-center ${shouldGrowFromBottom ? "justify-end" : "justify-start"} py-3 ${hasContent ? 'mb-11' : ''}`}
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
                        <View className={`flex-row absolute  bottom-0 ${hasContent ? 'justify-between w-full' : 'justify-end right-0'}`}>
                            <Row className={'items-center justify-center h-11 p-1 '}>
                                <FileButton field_name='cmt_image' size="sm" icon="Image" source='library' variant='text' />
                                {!isWeb && (
                                    <View className="h-full p-1 flex items-center justify-center">
                                        <FileButton field_name='cmt_image' size='sm' icon="Camera" source='camera' variant='text' />
                                    </View>
                                )}
                            </Row>
                            {(hasContent) && (
                                <View className="p-1">
                                    {getFormFieldByData(
                                        props.data.inputs['cmt_submit'],
                                        handleSubmitWithSanitization,
                                        'custom',
                                        {
                                            disabled: !hasText && !imagesValue,
                                            className: 'w-full h-full',
                                            notFullWidth: true,
                                            noPadding: true,
                                            icon_only: true,
                                            icon: 'ArrowUp',
                                            title: 'Send',
                                            size: 'sm',
                                            variant: 'primary',
                                            rounded: true,
                                            alt: 'Post',
                                            tooltip: 'Post',
                                        }
                                    )}
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </Row>
            <ScrollView horizontal={true}>
                <Row className="flex-wrap">{
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
