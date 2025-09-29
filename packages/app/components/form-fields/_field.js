import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import Link from 'app/ui/atoms/link'
import { linkedText } from 'app/lib/text-helpers'
import { appSetting, stripTags } from 'app/lib/util'
import { Icon } from 'app/ui/atoms/icon'
import { Button } from 'app/design/controls'

export default function (props) {
    const caption = props.format === 'notitle' ? '' : props.caption

    const sClassName =
        ' form-control form-control-' +
        props.name +
        (props.form_layout !== 'hor' ? ' w-full ' : '') +
        (props.noPadding === true ? '  ' : ' ' + appSetting('forms', 'field_padding') + ' ') +
        (props?.classes ? ' ' + props?.classes : '')

    const optionalText = appSetting('forms', 'optional_text')
    const mandatoryIcon = appSetting('forms', 'mandatory_icon')
    const isShowOptional = optionalText != '' ? '(' + optionalText + ')' : ''
    const isShowCaption =
        !!props.caption &&
        props.format == 'default' &&
        !props.use_caption_as_placeholder &&
        ['switcher', 'checkbox'].includes(props.type) == false

    const captionElement = (
        <View className=" gap-y-2 z-10">
            <Text className="label-text block px-0.5 w-full ">
                <Row className="items-center gap-x-1">
                    <Text className={appSetting('forms', 'caption_classes')}>
                        {caption}
                    </Text>
                    {props.checker || props.required ? (
                        <></>
                    ) : (
                        <Text className="text-sm sm: text-base text-neutral-700 dark:text-neutral-300">
                            {isShowOptional}
                        </Text>
                    )}
                    {!!mandatoryIcon && (props.checker || props.required) ? (
                        <Text className="text-red-600 h-4 w-4">
                            <Icon icon={mandatoryIcon} size={16} />
                        </Text>
                    ) : (
                        <></>
                    )}
                </Row>
            </Text>
            <View className="w-full">{props.children}</View>
        </View>
    )

    return (
        <View className={sClassName}>
            {props.name && props.last_changed == props.name && (
                <View className="absolute right-0 top-0 mb-1">
                    <Button
                        onPress={props.handleSubmit}
                        startDecorator="ArrowClockwise"
                        variant="primary"
                        size="xs"
                        rounded
                    />
                </View>
            )}
            {isShowCaption ? captionElement : props.children}
            {!!props.error && Array.isArray(props.error) && (
                <FormError
                    errorText={props.error[0]}
                    errorLink={props.error[1]}
                />
            )}
            {!!props.error && !Array.isArray(props.error) && (
                <FormError errorText={props.error} />
            )}
            {/*(props.error2 && props.checker.error!='') && <FormError errorText={props.checker.error} />*/}
            {!!props.info && (
                <View className="label">
                    <Text className="mt-1 px-1 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
                        {stripTags(props.info)}
                    </Text>
                </View>
            )}
        </View>
    )
}

export function FormError({ errorText, errorLink }) {
    const errorMessage = (
        <View className="label px-1">
            <Text className="ml-0.5 mt-0.5 label-text-alt text-sm text-red-600 animate-pulse dark:text-red-400">{errorText}</Text>
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
