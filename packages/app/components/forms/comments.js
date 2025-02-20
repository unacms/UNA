import { View, Row, ScrollView } from 'app/design/view'
import { useState, useEffect } from 'react';
import { getFormFieldByData } from 'app/lib/form-helpers'
import { Platform } from 'react-native'
import { Button } from 'app/design/controls'
import Animated, { SlideInLeft, SlideOutLeft } from 'react-native-reanimated';
import { useFormContext } from 'react-hook-form';
import { stripTags } from 'app/lib/util'

export default function FormComments(props) {
    const [imageSource, setImageSource] = useState([]);
    const formContext = useFormContext();
    const [isExImage, setIsExImage] = useState(false);
    const isWeb = Platform.OS == 'web';
    const isIos = Platform.OS == 'ios'

    function setPlaceHolder(name, previews) {
        if (JSON.stringify(previews) != JSON.stringify(imageSource[name])) {
            setImageSource(prevImageSource => ({
                ...prevImageSource,
                [name]: previews,
            }));
        }
    }

    let text = formContext.watch('cmt_text')
    if (!text) text = ''
    if (typeof text === 'string') {
        text = stripTags(text).trim()
    }

    useEffect(() => {
        if (formContext.formState.isSubmitted)
            setImageSource([]);
    }, [formContext.formState.isSubmitted]);

    let prevList = Object.values(imageSource).flat();

    props.data.inputs['cmt_submit'].hide_errors = true;

    props.data.inputs['cmt_submit'].icon = 'PaperPlane';
    props.data.inputs['cmt_submit'].variant = 'primary';
    props.data.inputs['cmt_submit'].rounded = 'true';

    props.data.inputs['cmt_image'].rounded = 'true';
    props.data.inputs['cmt_image'].variant = 'default';

    const sPad = 'px-3 py-2';//isWeb ? 'p-2' : (isIos || isWeb) ? 'px-2 pb-2' : 'px-1';
    return <View className='w-full ' >
        <Row className='w-full items-end  '>
            <View className={'mr-2 ' + (isWeb ? '' : (isExImage ? ' w-28 ' : 'w-12'))}>
                {isWeb && getFormFieldByData(props.data.inputs['cmt_image'], props.handleSubmit, 'custom', { previewPlaceHolder: setPlaceHolder, noMargin: true, asDefaultStorage: true, source: 'library', })}
                {!isWeb && !isExImage && <Button startDecorator="Plus" rounded onPress={() => setIsExImage(true)}></Button>}
                {!isWeb && !!isExImage &&
                    <Animated.View  entering={SlideInLeft.duration(300)} 
                    exiting={SlideOutLeft.duration(300)}>
                    <Row className="gap-x-2">
                        <View>
                            {getFormFieldByData(props.data.inputs['cmt_image'], props.handleSubmit, 'custom', { previewPlaceHolder: setPlaceHolder, noMargin: true, asDefaultStorage: true, source: 'library', })}
                        </View>
                        <View>
                            {getFormFieldByData(props.data.inputs['cmt_image'], props.handleSubmit, 'custom', { previewPlaceHolder: setPlaceHolder, noMargin: true, asDefaultStorage: true, source: 'camera', })}
                        </View>
                    </Row>
                    </Animated.View>
                }

            </View>
            <View className={`flex-auto bg-bgritem dark:bg-bgritem-d rounded-3xl justify-center  ${isWeb ? 'min-h-[44px]' : 'min-h-[44px] '} items-end ${sPad}`} >
                {getFormFieldByData(props.data.inputs['action'], props.handleSubmit, 'custom')}
                {getFormFieldByData(props.data.inputs['cmt_cf'], props.handleSubmit, 'custom')}
                {getFormFieldByData(props.data.inputs['cmt_parent_id'], props.handleSubmit, 'custom')}
                {getFormFieldByData(props.data.inputs['cmt_text'], props.handleSubmit, 'custom', { container_class: 'comments', focus: true, bg: 'transparent', placeholder: 'Write your comment here...', noMargin: true, onFocus: () => setIsExImage(false) })}
                {getFormFieldByData(props.data.inputs['id'], props.handleSubmit, 'custom')}
                {getFormFieldByData(props.data.inputs['sys'], props.handleSubmit, 'custom')}
            </View>

            <View className={'ml-2 ' + (isWeb ? '' : ' w-12 ')}>{getFormFieldByData(props.data.inputs['cmt_submit'], props.handleSubmit, 'custom', {  disabled: text != '' ? false : true, classes: isWeb ? 'ml-0 ' : '', noMargin: true, size: 'base' })}</View>
        </Row>
        {(prevList.length > 0 && prevList[0]?.key) && <ScrollView horizontal={true}><Row className='flex-wrap gap-2 mt-3'>{prevList}</Row></ScrollView>}
        {getFormFieldByData(props.data.inputs['cmt_mood'], props.handleSubmit, 'custom')}
    </View>
}
