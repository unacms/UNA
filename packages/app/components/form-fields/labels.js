import Field from './_field';
import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { useState, useRef, useEffect } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { Input } from 'app/design/controls'
import Dropdown from 'app/ui/atoms/dropdown'
import { fetcher } from 'app/lib/fetcher';
import { Hidden } from 'app/design/controls'
import { Button } from "app/design/controls";

export default function FormFieldLabels(props) {

    let rules = {};
    let defaultValue = props.value ? props.value : '';
    const formContext = useFormContext();
    let name = props.name ? props.name : '';
    let { field } = useController({ name, rules, defaultValue });
    const labelsData = props.values;
    // const [labelsData, setLabelsData ] = useState(false);
    let selectedValues = String(field.value).split(',');
   
    /*const fetchData = async () => {
        const sResponse = await fetcher('/api.php?r=' + props.ajax_get_suggestions);
        if (sResponse?.data){
            setLabelsData(sResponse?.data)
        }
    };*/

    const addValue = (value) => {
        if (selectedValues.includes(value)){
            selectedValues = selectedValues.filter(function(item) {
                return item !== value
            })
        }
        else{
            selectedValues.push(value)
           
        }
        formContext.setValue(props.name, selectedValues.join(','))
    }

    /*useEffect(() => {
        fetchData();
    }, []);*/

    const renderLabelSection = (data, title) => {
        if (data.length > 0) {

            let dataFlat = data.flatMap(item => 
                item.subitems ? [item, ...item.subitems] : item
            );

            return (
                <View className='w-full'>
                    <Text className="font-medium text-sm text-neutral-800 dark:text-neutral-200">{title}</Text>
                    <Row className="gap-x-2 justify-start items-start mt-1.5">
                        {dataFlat.map((item, index) => <View  key={item.value + index} >
                            <Button 
                                variant={selectedValues.includes(item.value) ? "primary" : "default"} 
                                size="xs" 
                                fullWidth 
                                title={item.value} 
                                onPress={() => addValue(item.value)} 
                            />
                        </View>)}
                    </Row>
                </View>
            );
        }
    }

    return (
        <Field {...props}>
            {labelsData && (
                <View className='w-full'>
                    {renderLabelSection(labelsData.system, "Choose labels:")}
                    {renderLabelSection(labelsData.context, "Context labels")}
                </View>
            )}
            <Hidden 
                name={props.name}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                value={String(field.value)}
            />
        </Field>
    );
}
