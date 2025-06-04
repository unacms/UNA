import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import Link from 'app/ui/atoms/link'
import { linkedText } from 'app/lib/text-helpers';
import { appSetting, stripTags } from 'app/lib/util';
import { Icon } from 'app/ui/atoms/icon';
import { Button } from 'app/design/controls';

export default function (props) {
    let caption = props.caption;
    if (props.format == 'notitle')
        caption = '';
    let sClassName = ' w-full form-control form-control-' + props.name + (props.noMargin === true ? '  ' : ' mb-[12px] ') +  (props?.classes ? ' ' + props?.classes : '');

    const optionalText = appSetting('forms', 'optional_text');
    const mandatoryIcon = appSetting('forms', 'mandatory_icon');
    const isShowOptional = optionalText != '' ? '(' + optionalText + ')' : '';
    const isShowCaption = !!props.caption && props.format == 'default' && !props.use_caption_as_placeholder && ['switcher', 'checkbox'].includes(props.type) == false;

    const captionElement = (
        <View className=' w-full bg-neutral-200/50 dark:bg-neutral-700/20 rounded-[16px] p-[4px]'>
            <Text className="label-text block px-[12px] pt-[4px] pb-[6px] w-full ">
                <Row className='items-center gap-x-1' >
                    <Text className={appSetting('forms', 'caption_classes')}>{caption}</Text>
                    {((props.checker || props.required) ? <></> : <Text className="text-sm sm:text-base text-neutral-700 dark:text-neutral-300">{isShowOptional}</Text>)}
                    {((!!mandatoryIcon && (props.checker || props.required)) ? <Text className="text-red-600 h-[16px] w-[16px]"><Icon icon={mandatoryIcon} size={16} /></Text> : <></>)}
                </Row >
            </Text>
            
            {props.children}
        </View>
    );

    return (
        <View className={sClassName}>
            {(props.name && props.last_changed == props.name) && <View className='absolute right-0 top-0 mb-1'>
                <Button onPress={props.handleSubmit} startDecorator="ArrowClockwise" variant="primary" size="xs" rounded />
            </View>}
            {isShowCaption ? captionElement : props.children}
            {!!props.error && Array.isArray(props.error) && <FormError errorText={props.error[0]} errorLink={props.error[1]} />}
            {!!props.error && !Array.isArray(props.error) && <FormError errorText={props.error} />}
            {(props.error2 && props.checker.error!='') && <FormError errorText={props.checker.error} />}
            {!!props.info &&
                <View className="label" >
                    <Text className="mt-1 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">{stripTags(props.info)}</Text>
                </View>
            }
        </View>
    );
}

export function FormError({ errorText, errorLink }) {
    const errorMessage = (
        <View className="label">
            <Text className="ml-0.5 mt-0.5 label-text-alt text-sm text-red-600 animate-pulse dark:text-red-400">
                {linkedText(errorText)}
            </Text>
        </View>
    );

    return errorLink ? <Link href={errorLink}>{errorMessage}</Link> : errorMessage;
}

export function getValidationRules({ checker, caption }) {
    const funct = checker?.func.toLowerCase();
    if (funct) {
        if (funct == 'avail' || funct == 'date_time') {
            return {
                required: {
                    value: true,
                    message: caption + ' - ' + checker.error,
                }
            }
        }

        if (funct == 'date_range') {
            return {
                validate: value => {
                    const age = Math.abs(new Date(Date.now() - new Date(value).getTime()).getUTCFullYear() - 1970);
                    if (age < checker.params.min || age > checker.params.max) {
                        return checker.error;
                    }
                }
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
                }
            }
        }
    }

    return {}
}
