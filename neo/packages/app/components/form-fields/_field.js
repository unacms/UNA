import { useCallback, useEffect, useRef, useState } from 'react'
import { useAnimatedValue } from 'app/lib/hooks/use-animated-value';
import { Animated, Platform } from 'react-native'
import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import Link from 'app/ui/atoms/link'
import { appSetting, cn, stripTags } from 'app/lib/util'
import { Icon } from 'app/ui/atoms/icon'
import { Button } from 'app/design/controls'
import { queueFormEnsureVisible } from 'app/lib/form/form-ensure-visible'
import { nativeDriver } from 'app/lib/platform/animation'

const isWeb = Platform.OS === 'web'
const inputSettings = appSetting('theme', 'inputs')
const restingOffset = inputSettings.adaptive_label_resting_offset ?? 0
const floatedOffset = inputSettings.adaptive_label_floated_offset ?? -2
const duration = inputSettings.adaptive_label_duration ?? 200

export function getFormFieldDomId(name) {
    if (name == null || name === '') return undefined
    return `form-field-${String(name).replace(/[^A-Za-z0-9_-]/g, '-')}`
}

export function getFormFieldErrorDomId(name) {
    const id = getFormFieldDomId(name)
    return id ? `${id}-error` : undefined
}

function FieldCaption({ htmlFor, className, children }) {
    const label = <Text className={className}>{children}</Text>
    if (isWeb && htmlFor) {
        return (
            <label htmlFor={htmlFor} className="block">
                {label}
            </label>
        )
    }
    return label
}

function AdaptiveLabel({ caption, value, focused, htmlFor, children }) {
    const hasValue = value != null && String(value).length > 0
    const floated = !!focused || hasValue

    const [boxH, setBoxH] = useState(0)
    const [labelH, setLabelH] = useState(0)
    const translateY = useAnimatedValue(0)
    const readyRef = useRef(false)

    const restingY =
        boxH > 0 && labelH > 0
            ? Math.max(0, (boxH - labelH) / 2) + restingOffset
            : 0
    const floatedY =
        labelH > 0 ? -labelH / 2 + floatedOffset : floatedOffset

    useEffect(() => {
        if (boxH <= 0 || labelH <= 0) return

        const toValue = floated ? floatedY : restingY

        if (!readyRef.current) {
            readyRef.current = true
            translateY.setValue(toValue)
            return
        }

        Animated.timing(translateY, {
            toValue,
            duration,
            useNativeDriver: nativeDriver,
        }).start()
    }, [floated, restingY, floatedY, boxH, labelH, translateY])

    const onBoxLayout = useCallback((event) => {
        const next = event?.nativeEvent?.layout?.height ?? 0
        setBoxH((prev) => (prev === next ? prev : next))
    }, [])

    const onLabelLayout = useCallback((event) => {
        const next = event?.nativeEvent?.layout?.height ?? 0
        setLabelH((prev) => (prev === next ? prev : next))
    }, [])

    return (
        <View className="relative w-full" onLayout={onBoxLayout}>
            <Animated.View
                pointerEvents="none"
                collapsable={false}
                style={{
                    position: 'absolute',
                    top: 0,
                    zIndex: 10,
                    opacity: boxH > 0 && labelH > 0 ? 1 : 0,
                    transform: [{ translateY }],
                }}
            >
                <View
                    onLayout={onLabelLayout}
                    className={cn(
                        inputSettings.adaptive_label,
                        floated ? inputSettings.adaptive_label_floated : null
                    )}
                >
                    <FieldCaption
                        htmlFor={htmlFor}
                        className={
                            floated
                                ? inputSettings.adaptive_label_text_floated
                                : inputSettings.adaptive_label_text_resting
                        }
                    >
                        {caption}
                    </FieldCaption>
                </View>
            </Animated.View>
            {children}
        </View>
    )
}

export default function Field({
    format,
    caption: captionProp,
    error,
    name,
    form_layout,
    noPadding,
    classes,
    use_caption_as_placeholder,
    type,
    checker,
    required,
    children,
    last_changed,
    handleSubmit,
    value,
    focused,
    isAdaptiveLabel,
    info,
}) {
    const caption = format === 'notitle' ? '' : captionProp
    const wrapRef = useRef(null)
    const inputId = getFormFieldDomId(name)
    const errorText = Array.isArray(error) ? error[0] : error
    const errorId = errorText ? getFormFieldErrorDomId(name) : undefined

    useEffect(() => {
        if (!errorText) return

        const node = wrapRef.current
        if (!node) return

        const reportY = (y) => {
            if (typeof y === 'number' && !Number.isNaN(y)) {
                queueFormEnsureVisible(y)
            }
        }

        // Defer until after layout paints the error bubble.
        const id = requestAnimationFrame(() => {
            // Web: prefer real DOM node — RN View ref often has no scrollIntoView,
            // and modal RemoveScroll needs the modal ScrollView handler path.
            if (isWeb && typeof document !== 'undefined' && name) {
                const el = document.querySelector(
                    `.form-control-${CSS.escape(String(name))}`
                )
                if (el?.getBoundingClientRect) {
                    reportY(el.getBoundingClientRect().top)
                    const control = el.querySelector?.('input, textarea, select')
                    if (control) {
                        const scope = control.closest('form') || document
                        const firstInvalid = scope.querySelector('[aria-invalid="true"]')
                        if (!firstInvalid || firstInvalid === control) {
                            control.focus()
                        }
                    }
                    return
                }
            }

            if (typeof node.measureInWindow === 'function') {
                node.measureInWindow((_x, y) => reportY(y))
            }
        })

        return () => cancelAnimationFrame(id)
    }, [errorText, name])

    const sClassName =
        '  form-control' +
        (name ? ' form-control-' + name : '') +
        (form_layout !== 'hor' ? ' w-full ' : '') +
        (noPadding === true ? '  ' : ' ' + appSetting('forms', 'field_padding') + ' ') +
        (classes ? ' ' + classes : '')

    const optionalText = appSetting('forms', 'optional_text')
    const mandatoryIcon = appSetting('forms', 'mandatory_icon')
    const isShowOptional = optionalText != '' ? '(' + optionalText + ')' : ''
    const isShowCaption =
        !!captionProp &&
        format == 'default' &&
        !use_caption_as_placeholder &&
        ['switcher', 'checkbox'].includes(type) == false

    // Wide form container: caption column 1/4, control column 3/4.
    // Captionless fields (switcher, checkbox, notitle, submit) keep the
    // control column aligned via ml-auto. Inline ('hor') and placeholder-caption
    // forms keep the flat full-width layout.
    const isGrid = form_layout !== 'hor' && !use_caption_as_placeholder

    const captionElement = isShowCaption ? (
        <View className="w-full @5xl/form-container:w-1/4 @5xl/form-container:pr-4 @5xl/form-container:min-h-11 @5xl/form-container:justify-center">
            <Text className=" text-secondary-foreground block px-0.5 w-full ">
                <Row className="items-center gap-0.5">
                    <FieldCaption
                        htmlFor={inputId}
                        className={appSetting('forms', 'caption_classes')}
                    >
                        {caption}
                    </FieldCaption>
                    {checker || required ? (
                        <></>
                    ) : (
                        <Text className="text-sm sm: text-base text-muted-foreground ">
                            {isShowOptional}
                        </Text>
                    )}
                    {!!mandatoryIcon && (checker || required) ? (
                        <Text className="text-destructive mb-auto leading-5">
                            <Icon icon={mandatoryIcon} size={12} />
                        </Text>
                    ) : (
                        <></>
                    )}
                </Row>
            </Text>
        </View>
    ) : null

    const control = (
        <>
            {!isShowCaption && isAdaptiveLabel && caption ? (
                <AdaptiveLabel
                    caption={caption}
                    value={value}
                    focused={focused}
                    htmlFor={inputId}
                >
                    {children}
                </AdaptiveLabel>
            ) : (
                children
            )}
            {!!error && Array.isArray(error) && (
                <FormError
                    errorText={error[0]}
                    errorLink={error[1]}
                    errorId={errorId}
                />
            )}
            {!!error && !Array.isArray(error) && (
                <FormError errorText={error} errorId={errorId} />
            )}
            {!!info && (
                <View className="label">
                    <Text className="mt-1 px-1 text-xs text-muted-foreground">
                        {stripTags(info)}
                    </Text>
                </View>
            )}
        </>
    )

    return (
        <View ref={wrapRef} collapsable={false} className={sClassName}>
            {name && last_changed == name && (
                <View className="absolute right-0 top-0 mb-1">
                    <Button
                        onPress={handleSubmit}
                        startDecorator="RotateCw"
                        variant="primary"
                        size="xs"
                        rounded
                    />
                </View>
            )}
            {isGrid ? (
                <View className="@5xl/form-container:flex-row @5xl/form-container:items-start gap-y-1 z-10">
                    {captionElement}
                    <View
                        className={cn(
                            'w-full gap-1 @5xl/form-container:w-3/4',
                            !isShowCaption && '@5xl/form-container:ml-auto'
                        )}
                    >
                        {control}
                    </View>
                </View>
            ) : (
                control
            )}
        </View>
    )
}

/**
 * @param {{
 *   errorText: string,
 *   errorLink?: string,
 *   errorId?: string,
 * }} props
 */
export function FormError({ errorText, errorLink, errorId }) {
    if (!errorText.trim())
        return 
    const errorMessage = (
        <View className="items-start mr-auto mt-0.5">
            <View
                className="ml-3 w-0 h-0 border-l-transparent border-r-transparent border-b-destructive/20 dark:border-b-destructive"
                style={{
                    borderLeftWidth: 6,
                    borderRightWidth: 6,
                    borderBottomWidth: 6,
                }}
            />
            <Text
                nativeID={errorId}
                id={errorId}
                role="alert"
                className="text-destructive text-xs bg-destructive/20 p-2 rounded-xl dark:bg-destructive dark:text-destructive-foreground"
            >
                {errorText}
            </Text>
        </View>
    )

    return errorLink ? (
        <Link href={errorLink}>{errorMessage}</Link>
    ) : (
        errorMessage
    )
}

export function getValidationRules({ checker, caption, type }) {
    return {}
    const funct = checker?.func.toLowerCase()
    if (funct) {
        if (
            funct == 'avail' ||
            funct == 'date_time' /*&& (type!= 'files' && type != 'datepicker')*/
        ) {
            return {
                required: {
                    value: true,
                    message: caption + ' - ' + checker.error,
                },
            }
        }

        if (funct == 'date_range' /* && (type != 'datepicker')*/) {
            return {
                validate: (value) => {
                    const age = Math.abs(
                        new Date(
                            Date.now() - new Date(value).getTime()
                        ).getUTCFullYear() - 1970
                    )
                    if (age < checker.params.min || age > checker.params.max) {
                        return checker.error
                    }
                },
            }
        }

        if (funct == 'length') {
            return {
                required: {
                    value: true,
                    message: caption + ' - ' + checker.error,
                },
                minLength: {
                    value: checker.params.min,
                    message: caption + ' - ' + checker.error,
                },
                maxLength: {
                    value: checker.params.max,
                    message: caption + ' - ' + checker.error,
                },
            }
        }
    }

    return {}
}
