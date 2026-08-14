import Field from './_field';
import { Input, Button } from 'app/design/controls'
import { useEffect, useState } from 'react';
import { View, Row } from 'app/design/view'
import { strToObj } from 'app/lib/util';
import { useFormField } from 'app/lib/hooks/use-form-field';

export default function FormFieldList(props) {
    const params = strToObj(props.params) || {};
    const minCount = params.minCount || 1;
    const maxCount = params.maxCount || 10;

    const createEmpty = () => {
        const keys = (params.fields || []).map((f) => f.name);
        return keys.reduce((acc, key) => {
            acc[key] = '';
            return acc;
        }, {});
    };

    const initedValue = props.value
        ? (strToObj(props.value) || []).filter((obj) =>
              Object.values(obj).some((val) => val !== '')
          )
        : [createEmpty()];

    const { field } = useFormField(props, {
        defaultValue: JSON.stringify(initedValue),
        syncValue: false,
    });
    const [values, setValues] = useState(initedValue);

    useEffect(() => {
        field.onChange(JSON.stringify(values));
    }, [values]);

    const addNew = () => {
        setValues((prev) => [...prev, createEmpty()]);
    };

    const deleteValue = (index) => {
        setValues((prev) => {
            const next = [...prev];
            next.splice(index, 1);
            return next;
        });
    };

    const setValues2 = (index, fieldName, value) => {
        setValues((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], [fieldName]: value };
            return next;
        });
    };

    return (
        <Field {...props}>
            <View className="gap-y-2 sm:gap-y-3 w-full">
                {values.map((value, index) => (
                    <Row key={`vls${index}`} className="gap-x-2">
                        {(params.fields || []).map((fld) => (
                            <Input
                                key={`fld-${fld.name}`}
                                placeholder={fld.title}
                                value={values[index]?.[fld.name]}
                                onChangeText={(text) => {
                                    setValues2(index, fld.name, text);
                                }}
                            />
                        ))}
                        {index >= minCount && (
                            <View>
                                <Button
                                    variant="secondary"
                                    onPress={() => deleteValue(index)}
                                    size="lg"
                                    startDecorator="X"
                                />
                            </View>
                        )}
                        {index == 0 && values.length < maxCount && (
                            <View>
                                <Button
                                    variant="secondary"
                                    onPress={addNew}
                                    size="lg"
                                    startDecorator="Plus"
                                />
                            </View>
                        )}
                    </Row>
                ))}
            </View>
        </Field>
    );
}
