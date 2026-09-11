import Field, { getValidationRules } from './_field';
import Dropdown from 'app/ui/atoms/dropdown'
import { Row } from 'app/design/view'
import { Button } from 'app/design/controls'
import { useFormField } from 'app/lib/form/use-form-field';

export default function FormFieldSelect(props) {
    const { field, readOnly } = useFormField(props, {
        rules: getValidationRules(props),
    });

    const setValueF = (val) => {
        field.onChange(val);
        if (props.onChange) {
            props.onChange(val);
        }
    };

    const values = getVisibilityValues(props.values);

    if (props.mode == 'buttons') {
        return (
            <Field {...props}>
                <Row className="gap-x-2">
                    {values.map((item) => (
                        <Button
                            key={item.value}
                            variant="outline"
                            pressed={field.value == item.value}
                            title={item.label}
                            onPress={() => {
                                setValueF(item.value);
                            }}
                        />
                    ))}
                </Row>
            </Field>
        );
    }

    return (
        <Field {...props}>
            <Dropdown
                disabled={readOnly || props.type == 'value'}
                labelField="label"
                valueField="value"
                onChange={setValueF}
                value={field.value}
                data={values}
                size={props.size}
            />
        </Field>
    );
}

export function getVisibilityValues(valuesIn){
    if (valuesIn == null) {
        return [];
    }

    let values = [];
    if (!Array.isArray(valuesIn)){
        values = Object.keys(valuesIn).map(function (key) {
            
            if (typeof valuesIn[key] == 'string')
                return {label: valuesIn[key], value: key}
            else{
                return {label: valuesIn[key].value, value: valuesIn[key].key,  icon: valuesIn[key].icon}
            }
                
        }); 
    }
    if (Array.isArray(valuesIn)){
        values = valuesIn.map(function (key) {
            if (typeof key == 'string'){
                return {label: key, value: key};
            }
            else{
                return key.value ? {label: key.value, value: key.key, icon: key.icon} : null
            }
            
        }); 
        values = values.filter(Boolean);
    }
    
    return values;
}
