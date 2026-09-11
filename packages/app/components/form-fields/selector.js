import Field from './_field';
import { View, Row } from 'app/design/view'
import { useState, useMemo, useCallback } from 'react';
import { Button, Modal } from "app/design/controls";
import ChkList from 'app/ui/molecules/form-controls/checkbox-list';
import { Text } from 'app/design/typography';
import { appSetting } from 'app/lib/util'
import { useFormField } from 'app/lib/form/use-form-field';

const inputSettings = appSetting('theme', 'inputs');

export default function FormFieldSelector(props) {

    const [isModal, setIsModal] = useState(false);
    const isMultiple = props.origtype == 'select' || props.is_single === true ? false : true;
    const defaultValue = props?.value
        ? (Array.isArray(props.value) ? props.value.map(String) : [String(props.value)])
        : [];
    const { field } = useFormField(props, {
        defaultValue,
        syncValue: false,
    });
    const [value2, setValue2] = useState(() => (Array.isArray(field.value) ? field.value : defaultValue));

    const variant = props.variant || 'default';
    const size = props.size || 'sm';

    const setFormValue = useCallback(
        (value) => {
            const filteredValue = value.filter(item => item);
            field.onChange(filteredValue);
            setIsModal(false);
        },
        [field]
    );
    const removeValue = useCallback(
        (valueToRemove) => {
            return () => {
                const newValue = field.value.filter(item => item !== valueToRemove);
                setValue2(newValue);
                field.onChange(newValue);
            };
        },
        [field, setValue2]
    );

    const showSelect = useCallback(
        () => {
            setValue2(Array.isArray(field.value) ? field.value : []);
            setIsModal(true);
        },
        [field.value]
    );

    const valuesList = useMemo(() => {
        return Array.isArray(props.values)
            ? props.values.map(obj => ({
                ...obj,
                key: obj.key !== undefined ? String(obj.key) : String(obj.value),
            }))
            : Object.entries(props.values).map(([key, value]) => ({
                key: String(key),
                value,
            }));
    }, [props.values]);

    const selectedItems = useMemo(() => {
        const selected = Array.isArray(field.value) ? field.value : [];
        return valuesList.filter(item => selected.includes(item.key));
    }, [field.value, valuesList]);

    const header = <Row className=' w-full justify-between items-center'>
        <View><Button onPress={() => { setIsModal(null) }} variant='outline' rounded startDecorator="X" /></View>
        <View className='w-full flex-auto items-center justify-center'><Text className="text-muted-foreground  text-xl font-bold">{'Choose ' + props.caption}</Text></View>
        <View >
            <Button
                startDecorator="Check"
                variant="primary"
                size="base"
                rounded
                onPress={() => { setFormValue(value2) }}
            />
        </View>
    </Row>

    const ModalCnt = <Modal
        title={header}
        onVisible={isModal}
        onClose={() => setIsModal(false)}
        transparent={true}
        headerBorder={true}
        scrollable={true}
        skipUnsavedGuard={true}
    >
        <View className='flex-1'>
            <ChkList
                values={valuesList}
                selectedValue={value2}
                setValue={setValue2}
                showApply={false}
                multi={isMultiple}
                searchable={valuesList.length > 10}
            />
        </View>
    </Modal>

    return (
        <>
            {ModalCnt}
            <Field {...props}>

                <View className={`${props.align === 'right' ? 'justify-end' : 'justify-start'} bg-input/60 shadow-input-outline dark:shadow-input-outline-deep rounded-lg w-full items-center flex-row flex-wrap p-2 gap-1 ${inputSettings.surface_size?.regular ?? 'min-h-10'}`}>
                    {props.align == 'right' && <Button
                        startDecorator={isMultiple ? "Plus" : ""}
                        variant={variant}
                        title={isMultiple ? "" : selectedItems.length > 0 ? "Change" : "Select"}
                        size={size}
                        onPress={showSelect}
                    />}
                    {selectedItems.map((item) => (
                        <Button
                            key={item.key}
                            endDecorator="X"
                            variant={variant}
                            size={size}
                            title={item.value}
                            onPress={removeValue(item.key)}
                        />
                    ))}
                    {props.align != 'right' && <Button
                        startDecorator={isMultiple ? "Plus" : ""}
                        variant={variant}
                        size={size}
                        title={isMultiple ? "Add" : "Select"}
                        onPress={showSelect}
                    />}
                </View>

            </Field></>
    );
}
