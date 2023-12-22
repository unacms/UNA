import Field from './_field';
import { Text} from 'app/design/typography'
import { useController, useFormContext } from 'react-hook-form';
import { Input } from 'app/design/controls'
import React, { useState, useEffect, useCallback } from 'react';
import { RangeSlider } from '@react-native-assets/slider'
import { Theme } from 'app/design/theme';
import { View, Row, ScrollView } from 'app/design/view'

export default function FormFieldText(props) {
    const { colors } = Theme();
    let formContext = useFormContext();
    
    let rules = {};
    let name = props.name;
    let defaultValue = props.value ? props.value : '';
    let { field } = useController({ name, rules, defaultValue });

    let range =[props.attrs.min, props.attrs.max]
    if (props.value != '')
        range = props.value.split('-');

    const [value, setValue] = useState(range)

    useEffect(() => {
        formContext.setValue(props.name, value.join('-'))
    }, [props.name, value]);

    const setValueF = (val) => {
        setValue(val);
    }

    return (
        <Field {...props}>
            <Row className='w-full gap-x-2 items-center justify-stretch'>
                <View className='w-12 bg-bgrinput dark:bg-bgrinput-d border border-bdrinput p-2 text-center rounded-lg'>
                    <Text className='text-center '>{value[0]} </Text>
                </View>
                <View className='flex-auto'>
                <RangeSlider
                    onValueChange={setValueF}         
                    trackHeight={4}                   // The track's height in pixel
                    thumbSize={15}   
                    slideOnTap={true}           
                    range={value}                    // set the current slider's value
                    minimumValue={0+props.attrs.min}                  // Minimum value
                    maximumValue={0+props.attrs.max}                  // Maximum value
                    step={1}                          // The step for the slider (0 means that the slider will handle any decimal value within the range [min, max])
                    minimumRange={0}                  // Minimum range between the two thumbs (defaults as "step")
                    crossingAllowed={false}           // If true, the user can make one thumb cross over the second thumb
                    outboundColor={colors.background}              // The track color outside the current range value
                    inboundColor={colors.background}               // The track color inside the current range value
                    thumbTintColor={colors.primary}         // The color of the slider's thumb
                                    // Add any View Props that will be applied to the container (style, ref, etc)
                />
                </View>
                <View className='w-12 bg-bgrinput dark:bg-bgrinput-d border border-bdrinput p-2 text-center rounded-lg'>
                    <Text className='text-center '>{value[1]} </Text>
                </View>
            </Row>
        </Field>
    );
}
