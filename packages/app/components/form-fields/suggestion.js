import Field from './_field';
import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import { useState, useRef, useEffect } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { Input } from 'app/design/controls'
import Dropdown from 'app/ui/atoms/dropdown'
import { fetcher } from 'app/lib/fetcher';
import { Hidden } from 'app/design/controls'

export default function FormFieldSuggestion(props) {

    let rules = {};
    let defaultValue = props.value ? props.value : '';
    const formContext = useFormContext();
    let name = props.name ? props.name : '';
    let { field } = useController({ name, rules, defaultValue });
   
    const [selectedValues, setSelectedValues] = useState([]);

    const handleSearch = async (value) => {
        const sResponse = await fetcher('/api.php?r=' + props.ajax_get_suggestions+"&term="+value);
        setSelectedValues([{label:"--- Please select ---", value: ""}, ...sResponse.data]);
    };

    const setValueF = (val) =>  {
        formContext.setValue(name, val);   
    }

    useEffect(() => {
        (async () => {
            if (props.custom?.callback){
                const sResponse = await fetcher('/api.php?r=' + props.custom.callback + field.value);
                const names = Object.keys(sResponse.data);
                names.forEach(name2 => {
                    formContext.setValue(name2, (sResponse.data[name2].value));
                });
            }
        })();
    }, [field.value]);

    return (
        <Field {...props}>
            <View className='gap-y-4'>
            <Input onChangeText={(value) => handleSearch(value)}    />
            { selectedValues.length > 0 && <Dropdown 
                labelField="label"
                valueField="value"
                onChange={setValueF}
                data={selectedValues}
            />}
            </View>
            <Hidden 
                name={props.name}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                value={String(field.value)}
            />
        </Field>
    );
}
