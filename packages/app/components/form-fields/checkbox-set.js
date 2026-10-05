import Field from './_field';
import CheckBox from 'app/ui/atoms/checkbox';
import { View, Row } from 'app/design/view'
import { appSetting } from 'app/lib/util';
import { useFormField } from 'app/lib/form/use-form-field';
import { stringArrayInitialValue } from 'app/lib/form/field-initial-values';

const themeSettings = appSetting('theme', 'checkbox_set');

export default function FormFieldCheckboxSet(props) {
    const df = stringArrayInitialValue(props.value);
    const { field } = useFormField(props, {
        defaultValue: df,
        syncValue: false,
    });

    const selected = Array.isArray(field.value) ? field.value : df;

    const setSelection = (val) => {
        const id = String(val);
        field.onChange(
            selected.includes(id)
                ? selected.filter((item) => item !== id)
                : [...selected, id]
        );
    };

    const values = Array.isArray(props.values)
        ? props.values.map((obj) => ({ id: obj.key, label: obj.value }))
        : Object.entries(props.values).map(([key, value]) => ({ id: key, label: value }));

    return (
        <Field {...props}>
            <View className={`${props.view != 'column' ? 'flex-row justity-center' : 'items-start'}  ${themeSettings.container} flex-wrap`}>
                {values.map((item2, index) => {
                    const checked = selected.includes(String(item2.id));
                    return (
                        <Row className="items-center flex-wrap w-full" key={'chk' + index}>
                            <CheckBox
                                value={checked}
                                status={checked ? 'checked' : 'unchecked'}
                                onPress={() => setSelection(item2.id)}
                                title={item2.label}
                            />
                        </Row>
                    );
                })}
            </View>
        </Field>
    );
}
