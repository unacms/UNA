import { View, Row, ScrollView } from 'app/design/view'
import { useState, useEffect, useMemo } from 'react'
import { getFormFieldByData, getEditorHeight } from 'app/lib/form-helpers'
import { Platform, useWindowDimensions } from 'react-native'
import { Button } from 'app/design/controls'
import Reanimated, { useSharedValue, useAnimatedStyle, withTiming, Easing, SlideInLeft, SlideOutLeft } from 'react-native-reanimated'
import { useFormContext } from 'react-hook-form'
import { stripTags } from 'app/lib/util'
import { useCurrentUser } from 'app/context/user'
import Profile from 'app/ui/molecules/profile'

export default function FormComments(props) {
    const { height: screenHeight } = useWindowDimensions()
    const baseHeight = props.data.inputs['cmt_id']?.value ? 160 : 48
    const maxHeight = Platform.OS === 'web' ? screenHeight / 2 : (screenHeight - 300) / 2 // 300 is approximate keyboard height
    const [imageSource, setImageSource] = useState([])
    const formContext = useFormContext()
    
    const animatedEditorHeight = useSharedValue(baseHeight)
    
    const isWeb = Platform.OS == 'web'
    const { currentUser } = useCurrentUser()
    const isAutoFocus =
        props.data.inputs['cmt_text']?.value ||
        props.data.inputs['cmt_text'].autofocus
            ? true
            : false

    const rawEditorText = formContext.watch('cmt_text')
    const hasText = useMemo(() => stripTags(rawEditorText || '').trim().length > 0, [rawEditorText]);

    const inputWrapperAnimatedStyle = useAnimatedStyle(() => {
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

    function setPlaceHolder(name, previews) {
        if (JSON.stringify(previews) != JSON.stringify(imageSource[name])) {
            setImageSource((prevImageSource) => ({
                ...prevImageSource,
                [name]: previews,
            }))
        }
    }

    function setIsFocus() {
        // setIsExImage(false)
    }

    function checkEditorHeight(reportedInternalHeight) {
        const actualHasText = stripTags(formContext.getValues('cmt_text') || '').trim().length > 0;
    
        // When typing, initial visual height should accommodate 1 line + all relevant chrome.
        // 1 line content ~24px. Wrapper chrome when expanded (pt-10, pb-48) = 58px. Editor internal est. ~10px. Total ~92px.
        const minVisualHeightWhenTyping = 92;
        const visualFloorHeight = actualHasText ? minVisualHeightWhenTyping : baseHeight;
        
        let totalChromeHeightEstimate;
        if (actualHasText) {
            // Chrome when editorHeight > baseHeight (triggers pb-[48px]):
            // Wrapper: 10px (top) + 48px (bottom) = 58px
            // Editor internal (estimate): 10px
            totalChromeHeightEstimate = 58 + 10; // 68px
        } else {
            // Chrome when editorHeight is baseHeight (e.g. 48px) (pt-10, pb-10):
            // Wrapper: 10px (top) + 10px (bottom) = 20px
            // Editor internal (estimate for placeholder line, can be small or same): 10px, or 0 if placeholder is simple
            // To ensure baseHeight (48px) fits one line (~24px content), chrome should be < 24. So use wrapper's 20px.
            totalChromeHeightEstimate = 20; 
        }

        const growthStepAmount = 24;

        const newCalculatedHeight = getEditorHeight(
            reportedInternalHeight,
            visualFloorHeight,
            totalChromeHeightEstimate,
            growthStepAmount,
            maxHeight
        );
        updateAnimatedHeight(newCalculatedHeight);
    }

    useEffect(() => {
        const strippedText = stripTags(rawEditorText || '').trim();
        const actualHasText = strippedText.length > 0;

        const minVisualHeightWhenTyping = 92; // Synchronized with checkEditorHeight logic

        if (actualHasText) {
            updateAnimatedHeight(Math.max(animatedEditorHeight.value, minVisualHeightWhenTyping)); 
        } else {
            updateAnimatedHeight(baseHeight); 
        }
    }, [rawEditorText, baseHeight, animatedEditorHeight]);

    useEffect(() => {
        if (formContext.formState.isSubmitted) {
            setImageSource([]);
            formContext.setValue('cmt_text', '');
        }
    }, [formContext.formState.isSubmitted, formContext]);

    let prevList = Object.values(imageSource).flat()

    props.data.inputs['cmt_submit'].hide_errors = true

    props.data.inputs['cmt_submit'].icon = 'SendHorizontal'
    props.data.inputs['cmt_submit'].variant = 'primary'
    props.data.inputs['cmt_submit'].rounded = 'true'
    props.data.inputs['cmt_submit'].icon_only = true
    props.data.inputs['cmt_image'].rounded = 'true'
    props.data.inputs['cmt_image'].variant = 'default'

    const inputWrapperClasses = [
        'flex-auto',
        'flex',
        'flex-col',
        'items-stretch',
        'bg-bgritem',
        'dark:bg-bgritem-d',
        'rounded-[12px]',
        'px-[12px]',
        'py-[10px]',
        'overflow-hidden'
    ];

    const minVisualHeightWhenTyping = 92;
    const shouldHaveExtraPadding = (hasText && minVisualHeightWhenTyping > baseHeight) || (!hasText && baseHeight > 48);
    if (shouldHaveExtraPadding) {
        inputWrapperClasses.push('pb-[48px]');
    }

    const attachmentButtonContainerClasses = [
        'absolute',
        'bottom-0',
        'z-10',
        'h-[48px]',
        'flex',
        'items-center',
        'justify-center'
    ];
    
    let currentAttachmentButtonWidthClass;
    if (isWeb) {
        currentAttachmentButtonWidthClass = 'w-[48px]';
    } else {
        currentAttachmentButtonWidthClass = 'w-fit';
    }
    attachmentButtonContainerClasses.push(currentAttachmentButtonWidthClass);

    if (hasText) {
        attachmentButtonContainerClasses.push('left-0');
    } else {
        attachmentButtonContainerClasses.push('right-0');
    }

    return (
        <View className="w-full ">
            <Row className="w-full gap-x-[8px]">
                {currentUser && (
                    <View className="flex-none p-1">
                        <Profile
                            {...currentUser}
                            url_avatar={currentUser.avatar}
                            displayType="unit_wo_info"
                            displaySize="base"
                        />
                    </View>
                )}
                <View className="flex-1 relative">
                    <Reanimated.View
                        className={inputWrapperClasses.join(' ')}
                        style={inputWrapperAnimatedStyle}
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
                                classes: 'flex-1 text-[14px] leading-[18px] text-neutral-800 dark:text-neutral-200',
                                autofocus: isAutoFocus,
                                bg: 'transparent',
                                placeholder: 'Leave a comment...',
                                noMargin: true,
                                onHeight: checkEditorHeight,
                                onFocus: setIsFocus
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
                    </Reanimated.View>
                    <View className={attachmentButtonContainerClasses.join(' ')}>
                        {isWeb &&
                            getFormFieldByData(
                                props.data.inputs['cmt_image'],
                                props.handleSubmit,
                                'custom',
                                {
                                    form_name: props.name,
                                    previewPlaceHolder: setPlaceHolder,
                                    noMargin: true,
                                    size: 'sm',
                                    hitSlop: 4,
                                    variant: 'secondary',
                                    asDefaultStorage: true,
                                    source: 'library',
                                }
                            )}
                        {!isWeb && (
                            <Reanimated.View
                                entering={SlideInLeft.duration(300)}
                                exiting={SlideOutLeft.duration(300)}
                                className="h-full w-full"
                            >
                                <Row className="h-full px-[4px] gap-x-[4px] items-center">
                                    <View className="h-full flex items-center justify-center">
                                        {getFormFieldByData(
                                            props.data.inputs['cmt_image'],
                                            props.handleSubmit,
                                            'custom',
                                            {
                                                form_name: props.name,
                                                previewPlaceHolder: setPlaceHolder,
                                                noMargin: true,
                                                variant: 'secondary',
                                                size: 'sm',
                                                hitSlop: 4,
                                                asDefaultStorage: true,
                                                source: 'library',
                                            }
                                        )}
                                    </View>
                                    <View className="h-full flex items-center justify-center">
                                        {getFormFieldByData(
                                            props.data.inputs['cmt_image'],
                                            props.handleSubmit,
                                            'custom',
                                            {
                                                form_name: props.name,
                                                previewPlaceHolder: setPlaceHolder,
                                                noMargin: true,
                                                size: 'sm',
                                                hitSlop: 4,
                                                variant: 'secondary',
                                                asDefaultStorage: true,
                                                source: 'camera',
                                            }
                                        )}
                                    </View>
                                </Row>
                            </Reanimated.View>
                        )}
                    </View>
                    {hasText && (
                        <View className="absolute right-0 bottom-0 w-[48px] h-[48px] z-10">
                            {getFormFieldByData(
                                props.data.inputs['cmt_submit'],
                                props.handleSubmit,
                                'custom',
                                {
                                    disabled: !hasText,
                                    className: 'w-full h-full',
                                    notFullWidth: true,
                                    noMargin: true,
                                    icon_only: true,
                                    icon: 'SendHorizontal',
                                    size: 'sm',
                                    variant: 'primary',
                                    rounded: true,
                                    hitSlop: 4,
                                    alt: 'Send',
                                    tooltip: 'Send',
                                }
                            )}
                        </View>
                    )}
                </View>
            </Row>
            {prevList.length > 0 && prevList[0]?.key && (
                <ScrollView horizontal={true}>
                    <Row className="flex-wrap gap-[8px] mt-[12px]">{prevList}</Row>
                </ScrollView>
            )}
            {getFormFieldByData(
                props.data.inputs['cmt_mood'],
                props.handleSubmit,
                'custom'
            )}
        </View>
    )
}
