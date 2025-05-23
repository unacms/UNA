import { View, Row, ScrollView } from 'app/design/view'
import { useState, useEffect, useMemo } from 'react'
import { getFormFieldByData, getEditorHeight } from 'app/lib/form-helpers'
import { Platform, useWindowDimensions } from 'react-native'
import { Button } from 'app/design/controls'
import Animated, { SlideInLeft, SlideOutLeft } from 'react-native-reanimated'
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
    const [isExImage, setIsExImage] = useState(false)
    const [editorHeight, setEditorHeight] = useState(baseHeight)
    const isWeb = Platform.OS == 'web'
    const { currentUser } = useCurrentUser()
    const isAutoFocus =
        props.data.inputs['cmt_text']?.value ||
        props.data.inputs['cmt_text'].autofocus
            ? true
            : false

    const rawEditorText = formContext.watch('cmt_text')
    const hasText = useMemo(() => stripTags(rawEditorText || '').trim().length > 0, [rawEditorText]);

    function setPlaceHolder(name, previews) {
        if (JSON.stringify(previews) != JSON.stringify(imageSource[name])) {
            setImageSource((prevImageSource) => ({
                ...prevImageSource,
                [name]: previews,
            }))
        }
    }

    function setIsFocus() {
        setIsExImage(false)
    }

    function checkEditorHeight(reportedInternalHeight) {
        const currentTextValue = formContext.getValues('cmt_text')
        const strippedText = stripTags(currentTextValue || '').trim()
        const hasActualText = strippedText.length > 0

        const currentMinHeight = hasActualText ? 96 : baseHeight
        
        const newCalculatedHeight = getEditorHeight(
            reportedInternalHeight,
            currentMinHeight,
            16,
            maxHeight
        )
        setEditorHeight(newCalculatedHeight)
    }

    useEffect(() => {
        const strippedText = stripTags(rawEditorText || '').trim()
        const hasActualText = strippedText.length > 0

        if (hasActualText) {
            setEditorHeight(prevHeight => Math.max(prevHeight, 96))
        } else {
            setEditorHeight(baseHeight)
        }
    }, [rawEditorText, baseHeight])

    useEffect(() => {
        if (formContext.formState.isSubmitted) {
            setImageSource([])
            formContext.setValue('cmt_text', '')
        }
    }, [formContext.formState.isSubmitted, formContext])

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
        'bg-bgritem',
        'dark:bg-bgritem-d',
        'rounded-[24px]',
        'justify-center',
        'px-[12px]', // Default horizontal padding
        'py-[10px]'  // Base vertical padding
    ];

    if (editorHeight > baseHeight) {
        inputWrapperClasses.push('pb-[48px]'); // Extra bottom padding when expanded
    }

    const attachmentButtonContainerClasses = [
        'absolute',
        'bottom-0',
        'z-10',
        'h-[48px]',
        'flex',
        'items-center'
    ];
    const attachmentButtonWidthClass = isWeb ? 'w-[48px]' : (isExImage ? 'w-[112px]' : 'w-[48px]');
    attachmentButtonContainerClasses.push(attachmentButtonWidthClass);

    if (hasText) {
        attachmentButtonContainerClasses.push('left-0');
    } else {
        attachmentButtonContainerClasses.push('right-[48px]');
    }

    return (
        <View className="w-full ">
            <Row className="w-full gap-x-[8px]">
                {currentUser && (
                    <View className="flex-none">
                        <Profile
                            {...currentUser}
                            url_avatar={currentUser.avatar}
                            displayType="unit_wo_info"
                            displaySize="base"
                        />
                    </View>
                )}
                <View className="flex-1 relative">
                    <View
                        className={inputWrapperClasses.join(' ')}
                        style={{ height: editorHeight }}
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
                                classes: 'flex-1',
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
                    </View>
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
                                    ring: 'p-[4px]',
                                    asDefaultStorage: true,
                                    source: 'library',
                                }
                            )}
                        {!isWeb && !isExImage && (
                            <Button
                                startDecorator="Plus"
                                size="sm"
                                
                                rounded
                                onPress={() => setIsExImage(true)}
                            ></Button>
                        )}
                        {!isWeb && !!isExImage && (
                            <Animated.View
                                entering={SlideInLeft.duration(300)}
                                exiting={SlideOutLeft.duration(300)}
                            >
                                <Row className="">
                                    <View className="pr-[4px]">
                                        {getFormFieldByData(
                                            props.data.inputs['cmt_image'],
                                            props.handleSubmit,
                                            'custom',
                                            {
                                                form_name: props.name,
                                                previewPlaceHolder: setPlaceHolder,
                                                noMargin: true,
                                                size: 'sm',
                                                ring: 'p-[4px]',
                                                asDefaultStorage: true,
                                                source: 'library',
                                            }
                                        )}
                                    </View>
                                    <View className="">
                                        {getFormFieldByData(
                                            props.data.inputs['cmt_image'],
                                            props.handleSubmit,
                                            'custom',
                                            {
                                                form_name: props.name,
                                                previewPlaceHolder: setPlaceHolder,
                                                noMargin: true,
                                                size: 'sm',
                                                ring: 'p-[4px]',
                                                asDefaultStorage: true,
                                                source: 'camera',
                                            }
                                        )}
                                    </View>
                                </Row>
                            </Animated.View>
                        )}
                    </View>
                    <View className="absolute right-0 bottom-0 w-[48px] h-[48px] z-10">
                        {getFormFieldByData(
                            props.data.inputs['cmt_submit'],
                            props.handleSubmit,
                            'custom',
                            {
                                disabled: !hasText,
                                className: 'w-full h-full',
                                noMargin: true,
                                icon_only: true,
                                icon: 'SendHorizontal',
                                size: 'sm',
                                variant: 'primary',
                                rounded: true,
                                padding: ' p-[4px]',
                                alt: 'Send',
                                tooltip: 'Send',
                                ring: 'p-1',
                            }
                        )}
                    </View>
                </View>
            </Row>
            {prevList.length > 0 && prevList[0]?.key && (
                <ScrollView horizontal={true}>
                    <Row className="flex-wrap gap-2 mt-3">{prevList}</Row>
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
