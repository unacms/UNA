import { View, Row, ScrollView } from 'app/design/view'
import { useEffect, useMemo, useState } from 'react'
import { getFormFieldByData, getEditorHeight } from 'app/lib/form-helpers'
import { Platform } from 'react-native'
import { useFormContext } from 'react-hook-form'
import { stripTags, removeEmptyTags } from 'app/lib/util'
import { useCurrentUser } from 'app/context/user'
import Profile from 'app/ui/molecules/profile'
import { FileButton } from 'app/lib/form-helpers'
import { useWindowHeight, useIsDesktop } from 'app/context/measure';
import emitter from 'app/context/emitter';

export default function FormComments(props) {
    const screenHeight = useWindowHeight();
    const isDesktop = useIsDesktop();
    const exProps = props?.exProps ?? {};
    const isModalForm = !!exProps.isModal;
    const forceBottomGrowth = !!exProps.forceBottomGrowth;
    const shouldGrowFromBottom = forceBottomGrowth || isModalForm || !isDesktop;
    const baseHeight = props.data.inputs['cmt_id']?.value ? 160 : 18
    const maxHeight = Platform.OS === 'web' ? /*screenHeight / 2*/ 160 : (screenHeight - 300) / 2 // 300 is approximate keyboard height
    const formContext = useFormContext()

    const [editorHeight, setEditorHeight] = useState(baseHeight)

    const isWeb = Platform.OS == 'web'
    const { currentUser } = useCurrentUser()
    const isAutoFocus =
        props.data.inputs['cmt_text']?.value ||
            props.data.inputs['cmt_text'].autofocus
            ? true
            : false

    const rawEditorText = formContext.watch('cmt_text')
    const imagesValue = formContext.watch('cmt_image')


    const hasText = useMemo(() => stripTags(rawEditorText || '').trim().length > 0, [rawEditorText]);

    const updateEditorHeight = (newHeight) => {
        if (Math.round(editorHeight) !== Math.round(newHeight)) {
            setEditorHeight(newHeight);
        }
    };

    function setIsFocus() {
        // setIsExImage(false)
    }

    function checkEditorHeight(reportedInternalHeight) {
        const actualHasText = stripTags(formContext.getValues('cmt_text') || '').trim().length > 0;
        const growthStepAmount = 18; // Define early for use in placeholder check

        if (!actualHasText) {
            // If no text, clamp to baseHeight unless the editor reports something
            // significantly larger than what baseHeight can contain (which shouldn't happen for a placeholder).
            // The main goal here is to ensure it stays at baseHeight (40px) for the placeholder.
            const placeholderChromeEstimate = 18; // Matches totalChromeEstimate for placeholder state
            const placeholderVisualHeight = reportedInternalHeight + placeholderChromeEstimate;
            // If the reported placeholder content + its chrome fits within baseHeight, or slightly over by less than a full step,
            // force it to baseHeight. This prevents small placeholder overflows from bumping height by a full step.
            if (placeholderVisualHeight < baseHeight + growthStepAmount) {
                updateEditorHeight(baseHeight);
                return;
            }
            // If placeholder is unusually large, let normal logic handle it, but it will start from baseHeight.
        }

        // When typing, initial visual height should accommodate 1 line + all relevant chrome.
        // 1 line content ~20px. Wrapper chrome when expanded (pt-10, pb-48) = 58px. Editor internal est. ~2px. Total ~80px.
        const minVisualHeightWhenTyping = 64;
        const visualFloorHeight = actualHasText ? minVisualHeightWhenTyping : baseHeight;

        let totalChromeHeightEstimate;
        if (actualHasText) {
            // Chrome when editorHeight > baseHeight (triggers pb-12):
            // Wrapper: 10px (top) + 48px (bottom) = 58px
            // Editor internal (estimate): 2px
            totalChromeHeightEstimate = 58 + 2; // 60px
        } else {
            // This path is for initial calculation if the above early return for !actualHasText wasn't met.
            // Or if somehow called with !actualHasText after initial placeholder setup.
            totalChromeHeightEstimate = 18; // Wrapper: 10px top/bottom
        }

        const newCalculatedHeight = getEditorHeight(
            reportedInternalHeight,
            visualFloorHeight,
            totalChromeHeightEstimate,
            growthStepAmount,
            maxHeight
        );
        updateEditorHeight(newCalculatedHeight);
    }

    useEffect(() => {
        const strippedText = stripTags(rawEditorText || '').trim();
        const actualHasText = strippedText.length > 0;

        const minVisualHeightWhenTyping = 80;

        if (actualHasText) {
            updateEditorHeight(Math.max(editorHeight, minVisualHeightWhenTyping));
        } else {
            updateEditorHeight(baseHeight);
        }
    }, [rawEditorText, baseHeight]);

    useEffect(() => {
        if (formContext.formState.isSubmitted) {
            formContext.setValue('cmt_text', '');
            emitter.emit(`fld_files_cmt_image`, { action: 'clear' })
        }
    }, [formContext.formState.isSubmitted, formContext]);

    const handleSubmitWithSanitization = () => {
        let sanitizedHtml = formContext.getValues('cmt_text');
        sanitizedHtml = removeEmptyTags(sanitizedHtml);

        formContext.setValue('cmt_text', sanitizedHtml, { shouldValidate: true, shouldDirty: true });
        props.handleSubmit();
    };

    const handleKeyPress = (e) => {
        // rawEditorText is watched by formContext, hasText updates accordingly.
        // We need to get the most current hasText state.
        const currentText = formContext.getValues('cmt_text');
        const currentHasText = stripTags(currentText || '').trim().length > 0;

        if (Platform.OS === 'web') {
            if (e.key === 'Enter') {
                if (e.altKey) {
                    // Alt+Enter on web: allow default (newline)
                    return;
                }
                // Enter alone on web: prevent default and submit if hasText
                e.preventDefault();
                if (currentHasText) {
                    handleSubmitWithSanitization();
                }
            }
        } else { // Native (iOS/Android)
            // For React Native, e is { nativeEvent: { key: 'Enter' } }
            // Standard TextInput onKeyPress doesn't easily expose modifier keys (altKey).
            // This means "Option+Enter for newline" is hard to distinguish from "Enter" alone.
            // The current requirement is "Enter to submit".
            // If cmt_text is multiline, this will make Enter submit, not add a newline by default.
            if (e.nativeEvent.key === 'Enter') {
                const currentText = formContext.getValues('cmt_text'); // Re-fetch for safety, or rely on closure
                const currentHasText = stripTags(currentText || '').trim().length > 0;
                if (currentHasText) {
                    handleSubmitWithSanitization();
                    // Note: If the underlying component is a standard multiline TextInput,
                    // this submits. To also allow newlines on native via Enter key differently,
                    // the component would need more advanced capabilities or a different event.
                }
            }
        }
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
    //const minVisualHeightWhenTypingForPadding = 80;
   // const shouldHaveExtraPadding = (false) || (!hasText && baseHeight > 40);

    const attachmentButtonContainerClasses = [
        'absolute',
        'bottom-0',
        'flex',
        'items-center',
        'justify-center',
        'px-1'
    ];

    let currentAttachmentButtonWidthClass;
    if (isWeb) {
        currentAttachmentButtonWidthClass = ' w-9 h-9';
    } else {
        currentAttachmentButtonWidthClass = 'w-18 h-9';
    }
    attachmentButtonContainerClasses.push(currentAttachmentButtonWidthClass);

    if (hasText || imagesValue) {
        attachmentButtonContainerClasses.push('left-0 bottom-0 p-1');
    } else {
        attachmentButtonContainerClasses.push('right-0 bottom-0 p-1');
    }

    return (
        <View className="w-full ">
            <Row className={`w-full gap-x-2 ${shouldGrowFromBottom ? 'items-end' : 'items-start'}`}>
                {currentUser && (

                    <Profile
                        {...currentUser}
                        url_avatar={currentUser.avatar}
                        displayType="unit_wo_info"
                        displaySize="sm"

                    />

                )}
                <View className="flex-1">
                    <View className=" items-stretch bg-input/40 border border-input rounded-xl px-2.5 py-2" >
                    <View 
                        style={{
                            alignItems: 'center',
                            justifyContent: shouldGrowFromBottom ? 'flex-end' : 'flex-start',
                            paddingBottom: isWeb ? (maxHeight == editorHeight ? '40px' : '0px') : maxHeight == editorHeight ? 40 : 0,
                            height: isWeb ? `${editorHeight}px` : editorHeight,
                            ...(isWeb && { transition: 'height 0.1s cubic-bezier(0.25, 0.1, 0.25, 1), padding-bottom 0.1s cubic-bezier(0.25, 0.1, 0.25, 1)' })
                        }}
                   >
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
                            props.data.inputs['cmt_text'],
                            props.handleSubmit,
                            'custom',
                            {
                                form_name: props.name,
                                container_class: 'comments',
                                classes: 'flex-1 text-card-foreground tiptap-comments',
                                autofocus: isAutoFocus,
                                bg: 'transparent',
                                placeholder: 'Leave a comment...',
                                noPadding: true,
                                onHeight: checkEditorHeight,
                                onFocus: setIsFocus,
                                onEnterSubmit: handleEditorEnterSubmit,
                                enableSubmitOnEnter: true
                            }
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
                    </View>
                    </View>
                    <View className={attachmentButtonContainerClasses.join(' ')}>
                        <FileButton field_name='cmt_image' size={isWeb ? 'sm' : 'xs'} icon="Image" source='library' variant='text' />
                        {!isWeb && (
                                    <View className="h-full p-1 flex items-center justify-center">
                                        <FileButton field_name='cmt_image' size='xs' icon="Camera" source='camera' variant='text' />
                                    </View>
                        )}
                    </View>
                    {(!!hasText || !!imagesValue) && (
                        <View className="absolute right-0 bottom-0 p-1">
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
                                    size: 'xs',
                                    variant: 'primary',
                                    rounded: true,
                                    alt: 'Post',
                                    tooltip: 'Post',
                                }
                            )}
                        </View>
                    )}
                </View>
            </Row>

            <ScrollView horizontal={true}>
                <Row className="flex-wrap">{
                    getFormFieldByData(
                        props.data.inputs['cmt_image'],
                        props.handleSubmit,
                        'notitle',
                        { hide_button: true, list_only: true}
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
