import Field from './_field';
import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { useState, useRef, useEffect, useContext } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import CheckBox from 'app/ui/atoms/checkbox';
import { Hidden } from 'app/design/controls'
import { Button } from "app/design/controls";
import { BottomSheetData } from 'app/context/bottomsheet';

export default function FormFieldLabels(props) {

    const rules = {};
    const defaultValue = props.value ? props.value : '';
    const formContext = useFormContext();
    const name = props.name ? props.name : '';
    const { field } = useController({ name, rules, defaultValue });
    const { bottomSheetData, setBottomSheetData } = useContext(BottomSheetData);
    
    const setFormValue = (value) => {
        value = value.filter(item => item);
        field.onChange(value);
        setBottomSheetData(false);
    }
    const dataFlat = [...props.values.system, ...props.values.context].flatMap(item =>
        item.subitems ? [item, ...item.subitems] : item
    );

    const showSelect = (val) => {
        setBottomSheetData({ title: 'Choose labels', showClose: true, content: <ChkList values={dataFlat} selectedValues={field.value} setFormValue={setFormValue}></ChkList> });
    }

    return (
        <Field {...props} error2={formContext.formState.errors[name]}>
           <View className='w-full'>
                    <Button
                        title={field.value ? 'Selected: ' + field.value.length : 'Select labels'}
                        startDecorator="Plus"
                        variant="outline"
                        size="sm"
                        onPress={() => showSelect()}
                    />
                </View>
        </Field>
    );
}

function ChkList({ values, selectedValues, setFormValue }) {
    const [value2, setValue2] = useState(selectedValues)

    const addValue2 = (value) => {
        const selectedValues = value2.includes(value) 
            ? value2.filter(item => item !== value)
            : [...value2, value];
        setValue2(selectedValues);
    }

    return (
        <>
            {values.map((item2, index) => (
                <Row className='gap-x-2 items-center mb-2' key={'chk' + index}>
                    <CheckBox
                        value={value2.includes(item2.value)}
                        onValueChange={() => addValue2(item2.value)}
                    />
                    <Text className="text-neutral-700 dark:text-neutral-200  text-sm">{item2.value}</Text>
                </Row>
            ))}
            <Button
                title={'Save'}
                startDecorator=""
                variant="outline"
                size="sm"
                onPress={() => setFormValue(value2)}
            />
        </>
    );
}
