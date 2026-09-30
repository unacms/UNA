import Field from './_field';
import { View } from 'app/design/view'
import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Input, Hidden } from 'app/design/controls'
import Dropdown from 'app/ui/atoms/dropdown'
import { fetcher } from 'app/lib/fetcher';
import { useFetch } from 'app/lib/hooks/use-fetch';
import { useFormField } from 'app/lib/form/use-form-field';

export default function FormFieldSuggestion(props) {
    const { setValue } = useFormContext();
    const { name, field } = useFormField(props);
    const defaultValue = props.value ? props.value : '';

    const isDisabled = props?.attrs?.disabled == 'disabled';

    // Search as you type: the latest term wins; the previous options stay while it loads.
    const [term, setTerm] = useState(null);
    const { data: searchResponse } = useFetch(
        term !== null ? '/api.php?r=' + props.ajax_get_suggestions + "&term=" + term : null,
        { keepPreviousData: true }
    );
    const selectedValues = Array.isArray(searchResponse?.data)
        ? [{ label: "--- Please select ---", value: "" }, ...searchResponse.data]
        : [];

    // Read-only field shows the name behind its stored value.
    const { data: nameResponse } = useFetch(
        isDisabled && props.custom?.callback ? '/api.php?r=' + props.custom.callback + defaultValue : null
    );
    const selectedValue = nameResponse?.data?.name?.value ?? '';

    const setValueF = (val) =>  {
        field.onChange(val);
    }

    // Picking a value fills dependent form fields from the callback (a side effect, not a query).
    useEffect(() => {
        if (!props.custom?.callback || isDisabled) return;
        let cancelled = false;
        (async () => {
            const sResponse = await fetcher('/api.php?r=' + props.custom.callback + field.value);
            if (cancelled || !sResponse?.data) return;
            Object.keys(sResponse.data).forEach(name2 => {
                setValue(name2, (sResponse.data[name2].value));
            });
        })();
        return () => {
            cancelled = true;
        };
    }, [field.value]);

    return (
        <Field {...props}>
            <View className='gap-y-4'>
                { !isDisabled && <Input onChangeText={(value) => setTerm(value)}    />}
                { isDisabled && <Input value={selectedValue} readOnly={true}    />}
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
