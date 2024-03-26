
import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import Link from 'app/ui/atoms/link'
import { Platform } from 'react-native'
import { linkedText } from 'app/lib/text-helpers';
import { appSetting } from 'app/lib/util';
import { Icon } from 'app/ui/atoms/icon';

export default function FormField(props) {
    let caption = props.caption;
    if (props.format == 'notitle')
        caption = '';
    let sClassName = ' my-2 w-full form-control form-control-' + props.name + (props?.classes ? ' ' + props?.classes : '');
    if (Platform.OS != 'web')
        sClassName += '  ';

    const isShowOptional = appSetting('layout', 'form_fields_optional_text') ? '(' + appSetting('layout', 'form_fields_optional_text') + ')' : '';
    const isShowCaption = !!props.caption && props.format == 'default' && !props.use_caption_as_placeholder && ['switcher', 'checkbox'].includes(props.type) == false;
    return (
        <View className={sClassName}>
            {isShowCaption &&
                <Text className="label-text block mb-2 text-sm sm:text-base text-neutral-700 dark:text-neutral-300">
                    <Row className='items-center gap-x-1' >
                        <Text className="font-semibold">{caption}</Text>
                        {((props.checker || props.required) ? <></> : <Text>{isShowOptional}</Text>)}
                        {((props.checker || props.required) ? <Text className="text-red-600"><Icon icon={appSetting('layout', 'form_fields_mandatory_icon')} /></Text> : <></>)}
                    </Row >
                </Text>
            }
            {props.children}
            {!!props.error && Array.isArray(props.error) && <FormError errorText={error[0]} errorLink={error[1]} />}
            {!!props.error && !Array.isArray(props.error) && <FormError errorText={props.error} />}
            {!!props.error2 && <FormError errorText={props.checker.error} />}
            {!!props.info &&
                <View className="label" >
                    <Text className="mt-1 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">{props.info}</Text>
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
                    if (age< checker.params.min || age > checker.params.max) {
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
