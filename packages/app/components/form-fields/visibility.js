import { useState, useEffect, useContext } from 'react';
import Field, { getValidationRules } from './_field';
import { useFormContext, useController } from 'react-hook-form';
import { Button } from 'app/design/controls'
import { getVisibilityValues } from './select';
import { useBottomSheetData } from 'app/context/bottomsheet';
import { truncateString } from 'app/lib/util';
import RbList from 'app/ui/molecules/radio_list';

export default function (props) {
    const name = props.name;
    const rules = getValidationRules(props);
    const formContext = useFormContext();
    const defaultValue = props?.value ? props.value : '';
    const [value, setValue] = useState(defaultValue)
    const { setBottomSheetData } = useBottomSheetData();
    const { field } = useController({ name, rules, defaultValue });

    /*useEffect(() => {
        console.log("----", field.value, value)
        if (value != field.value)
            field.onChange(value);
    }, [value]);
*/
    const setValueF = (val) => {
        field.onChange(val);
        //setValue(val);
        if (props.onChange) {
            props.onChange(val)
        }
        if (props.onShowModal){
            props.onShowModal(true);
        }
        setBottomSheetData(false);
        
    }

    let values = getVisibilityValues(props.values);
    values = values.filter(item => item.value != '6' && item.value != '8');
    const showSelect = (val) => {
        setBottomSheetData({ title: 'Choose audience',showClose: props.onShowModal ? false : true, snapPoints: ['70%', '70%'], content: <RbList values={values} setValue={setValueF} selectedValue={field.value} /> });
        if (props.onShowModal){
            props.onShowModal(false);
        }
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