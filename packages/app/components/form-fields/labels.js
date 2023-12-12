import Field from './_field';
import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import { useState, useRef, useEffect } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { Input } from 'app/design/controls'
import Dropdown from 'app/ui/atoms/dropdown'
import { fetcher } from 'app/lib/fetcher';
import { Hidden } from 'app/design/controls'

export default function FormFieldLabels(props) {

    let rules = {};
    let defaultValue = props.value ? props.value : '';
    const formContext = useFormContext();
    let name = props.name ? props.name : '';
    let { field } = useController({ name, rules, defaultValue });
   
    const [selectedValues, setSelectedValues] = useState([]);

    return (
        <Field {...props}>
            <View className='gap-y-4'>
                TODO
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
