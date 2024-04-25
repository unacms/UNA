import { useState, useEffect, useContext } from 'react';
import Field, { getValidationRules } from './_field';
import { useFormContext, useController } from 'react-hook-form';
import { Button } from 'app/design/controls'
import RadioButton from 'app/ui/atoms/radiobutton';
import { getVisibilityValues } from './select';
import { View, Row, Pressable } from 'app/design/view'
import { Text } from 'app/design/typography'
import { BottomSheetData } from 'app/context/bottomsheet';
import { truncateString } from 'app/lib/util';

export default function (props) {
    const name = props.name;
    const rules = getValidationRules(props);
    const formContext = useFormContext();
    const defaultValue = props?.value ? props.value : '';
    const [value, setValue] = useState(defaultValue)
    const { bottomSheetData, setBottomSheetData } = useContext(BottomSheetData);
    const { field } = useController({ name, rules, defaultValue });

    useEffect(() => {
        if (value != field.value)
            field.onChange(value);
    }, [value]);

    const setValueF = (val) => {
        setValue(val);
        if (props.onChange) {
            props.onChange(val)
        }
        setBottomSheetData(false);
    }

    let values = getVisibilityValues(props.values);
    values = values.filter(item => item.value != '6' && item.value != '8');
    const showSelect = (val) => {
        setBottomSheetData({ title: 'Choose audience',showClose:true, snapPoints: ['70%', '70%'], content: <RbList values={values} setValue={setValueF} selectedValue={field.value} /> });
    }
    
    if (props.format == 'nofield'){
        return  <Button
            title={truncateString(values.find(item => item.value == field.value)?.label || values[0].label,20)}
            startDecorator="Globe"
            variant="outline"
            
            size="sm"
            onPress={() => showSelect()}
        />
    }
    
    return (
        <Field {...props} error2={formContext.formState.errors[name]}>
            <Button
                title={values.find(item => item.value == field.value)?.label || values[0].label}
                startDecorator="Globe"
                variant="outline"
                size="base"
                onPress={() => showSelect()}
            />
        </Field>
    );
}

function RbList({ values, selectedValue, setValue }) {
    const [value, setValue2] = useState(selectedValue)
    return values.map((item2, index) => {
        return (
            <Row key={`rb-${index}`} className='items-center'>
                {item2.value ? <>
                    <RadioButton
                        value={item2.value}
                        status={value.toString() === item2.value.toString() ? 'checked' : 'unchecked'}
                        onPress={() => { setValue2(item2.value); setValue(item2.value) }}
                    />
                    <Pressable  onPress={() => { setValue2(item2.value); setValue(item2.value) }}><Text className="text-neutral-700 dark:text-neutral-200  text-sm">{item2.label}</Text></Pressable>
                </> : <Text className="pl-2 text-neutral-700 dark:text-neutral-200  text-sm font-medium mt-4">{item2.label}</Text>}
            </Row>
        )
    });
}
