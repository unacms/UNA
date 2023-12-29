import { View, Row } from 'app/design/view'
import { useRef, useState, useEffect } from 'react';
import { getFormFieldByData } from 'app/lib/form-helpers'
import { useWindowDimensions } from 'react-native';
import { Platform } from 'react-native'

export default function FormMessenger(props) {
    const [imageSource, setImageSource] = useState([]);

    function setPlaceHolder(name, previews) {
        if (JSON.stringify(previews) != JSON.stringify(imageSource[name])) {
            setImageSource(prevImageSource => ({
                ...prevImageSource,
                [name]: previews,
            }));
        }
    }

    const windowWidth = useWindowDimensions().width;

    let styles = { };
    if(Platform.OS !== 'web') {
        styles = { width: windowWidth - 110 }
    }

    let prevList = Object.values(imageSource).flat();

    const [sizes, setSizes] = useState({ formHeight: 0 });
    const viewFormRef = useRef();
    const handleLayout = () => {
        if (viewFormRef?.current)
            viewFormRef.current.measure((x, y, width, height, pageX, pageY) => {
            setSizes({ formHeight: height });
        });
    };

    if (typeof props.data.inputs['send'] !== 'undefined' )
        props.data.inputs['submit'].icon = 'PaperPlaneRight';

    return <View className="w-full my-1 flex items-center" ref={viewFormRef} onLayout={handleLayout} style={{ marginBottom: ( Platform.OS !== 'web' ? sizes.formHeight : 8 ) }}>
                <Row className="w-full flex flex-row items-center">
                  <View className="flex-0">
                      { getFormFieldByData(props.data.inputs['files'], props.handleSubmit, 'custom', { previewPlaceHolder: setPlaceHolder }) }
                  </View>
                  <View className="mr-2 flex-1 w-full " style={styles}>
                      { getFormFieldByData(props.data.inputs['action'], props.handleSubmit, 'custom') }
                      { getFormFieldByData(props.data.inputs['cf'], props.handleSubmit, 'custom') }
                      { getFormFieldByData(props.data.inputs['payload'], props.handleSubmit, 'custom') }
                      { getFormFieldByData(props.data.inputs['message'], props.handleSubmit, 'custom', { submitOnEnter: true, styles: { minHeight: "auto" }, placeholder: 'Message ...' }) }
                      { getFormFieldByData(props.data.inputs['id'], props.handleSubmit, 'custom') }
                      { getFormFieldByData(props.data.inputs['send'], props.handleSubmit, 'custom') }
                  </View>
                  <View className="flex-0 w-10">{getFormFieldByData(props.data.inputs['submit'], props.handleSubmit, 'custom')}</View>
                </Row>
                {(prevList.length>0 && prevList[0]?.key) && <Row className='flex-wrap gap-2 mt-3'>{prevList}</Row> }
            </View>
}
