import Field from './_field';
import { View } from 'app/design/view'
import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Input, Hidden } from 'app/design/controls'
import Dropdown from 'app/ui/atoms/dropdown'
import { fetcher } from 'app/lib/fetcher';
import { useFormField } from 'app/lib/hooks/use-form-field';

export default function FormFieldSuggestion(props) {
    const { setValue } = useFormContext();
    const { name, field } = useFormField(props);
    const defaultValue = props.value ? props.value : '';

    const [selectedValues, setSelectedValues] = useState([]);
    const [selectedValue, setSelectedValue] = useState('');

    const handleSearch = async (value) => {
        const sResponse = await fetcher('/api.php?r=' + props.ajax_get_suggestions+"&term="+value);
        setSelectedValues([{label:"--- Please select ---", value: ""}, ...sResponse.data]);
    };

    const setValueF = (val) =>  {
        field.onChange(val);
    }

    useEffect(() => {
        (async () => {
            if (props.custom?.callback && props?.attrs?.disabled != 'disabled'){
                const sResponse = await fetcher('/api.php?r=' + props.custom.callback + field.value);
                const names = Object.keys(sResponse.data);
                names.forEach(name2 => {
                    setValue(name2, (sResponse.data[name2].value));
                });
            }
        })();

        if (props?.attrs?.disabled == 'disabled'){
            (async () => {
                const sResponse = await fetcher('/api.php?r=' + props.custom.callback + defaultValue);
                setSelectedValue(sResponse.data['name'].value);
            })();
        }

    }, [field.value]);

    return (
        <Field {...props}>
            <View className='gap-y-4'>
                { props?.attrs?.disabled != 'disabled' && <Input onChangeText={(value) => handleSearch(value)}    />}
                { props?.attrs?.disabled == 'disabled' && <Input value={selectedValue} readOnly={true}    />}
                { selectedValues.length > 0 && <Dropdown 
                    labelField="label"
                    valueField="value"
                    onChange={setValueF}
                    data={selectedValues}
                />}
            </View>
            <Hidden 
                name={name}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                value={String(field.value)}
            />
        </Field>
    );
}
