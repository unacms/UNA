import Field from './_field';
import { Text } from 'app/design/typography'
import { useController, useFormContext } from 'react-hook-form';
import React, { useState, useEffect, useCallback } from 'react';
import { RangeSlider } from '@react-native-assets/slider'
import { Theme, ThemeName } from 'app/design/theme';
import { View, Row, ScrollView } from 'app/design/view'
import { appSetting } from 'app/lib/util';

const themeSettings = appSetting('theme', 'doublerange');

export default function FormFieldText(props) {
    const themeName = ThemeName();
    let formContext = useFormContext();


    let range = [props.attrs.min, props.attrs.max]
    if (props.value != '' && Array.isArray(props.value)) {
        range = props.value.split('-').map(str => parseInt(str, 10));
    }
   
    const [value, setValue] = useState(range)

    useEffect(() => {
        formContext.setValue(props.name, value.join('-'))
    }, [props.name, value]);

    const setValueF = (val) => {
        setValue(val);
    }

    return (
        <Field {...props}>
            <View className='flex-auto'>
                    <RangeSlider
                        onSlidingComplete={setValueF}
                        trackHeight={themeSettings.track_height}                   // The track's height in pixel
                        thumbSize={themeSettings.thumb_size}  
                        slideOnTap={true}
                        range={value}                    // set the current slider's value
                        minimumValue={props.attrs.min}                  // Minimum value
                        maximumValue={props.attrs.max}                  // Maximum value
                        step={1}                          // The step for the slider (0 means that the slider will handle any decimal value within the range [min, max])
                        minimumRange={0}                  // Minimum range between the two thumbs (defaults as "step")
                        crossingAllowed={false}           // If true, the user can make one thumb cross over the second thumb
                        outboundColor={themeSettings.outbound_color[themeName]}              // The track color outside the current range value
                        inboundColor={themeSettings.inbound_color[themeName]}               // The track color inside the current range value
                        thumbTintColor={themeSettings.thumb_tint_color[themeName]}         // The color of the slider's thumb
                    />
                </View>
            <Row className={themeSettings.container}>
                <Row className={themeSettings.value_container}>
                    <Text className={themeSettings.text_info}>From</Text>
                    <Text className={themeSettings.text_value}>{value[0]}</Text>
                </Row>
                
                <Row className={themeSettings.value_container}>
                    <Text className={themeSettings.text_info}>To</Text>
                    <Text className={themeSettings.text_value}>{value[1]} </Text>
                </Row>
            </Row>
        </Field>
    );
}
