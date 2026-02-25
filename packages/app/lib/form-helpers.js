
import { getComponent } from 'app/components/registry';
import { Text } from 'app/design/typography'
import { Button } from "app/design/controls";
import emitter from 'app/context/emitter';

export function getFormFieldByData(inputData, handleSubmit, format, externalProps) {

    if (!inputData)
        return <></>;
    const InputType = getComponent('form-field', String(inputData.type));
    if (!InputType)
        return <Text>Unsupported field type: {JSON.stringify(inputData)}</Text>
    return <InputType key={inputData.name} {...inputData} format={format} handleSubmit={handleSubmit} {...externalProps} />;

}

export function getHiddenFields(inputs, handleSubmit) {
    return Object.keys(inputs)
        .map((key) => {
            if (inputs[key].type === "hidden") {
                return getFormFieldByData(inputs[key], handleSubmit, 'nofield');
            }
            return null;
        })
        .filter((element) => element !== null);
}

export function inputByKey(array, value) {
    return array.find(obj => obj['key'] === value);
}

export function PollButton({ field_name, size = 'sm', variant = 'secondary', icon = "ChartBarBig" }) {
    return (
        <Button
            startDecorator={icon}
            size={size}
            variant={variant}
            rounded
            tooltip="Add Polls"
            onPress={() => emitter.emit(`fld_polls_${field_name}`, { action: 'add' })}
        />
    );
}

export function LabelButton({ field_name, size = 'sm', variant = 'secondary', icon = "Hash", title, rounded = true }) {
    return (
        <Button
            startDecorator={icon}
            size={size}
            title={title}
            tooltip="Add Labels"
            variant={variant}
            rounded={rounded}
            onPress={() => emitter.emit(`fld_labels_${field_name}`, { action: 'add' })}
        />
    );
}

export function FileButton({ field_name, size = 'sm', variant = 'secondary', icon = "Image", rounded = true, tooltip = "Add Files", source = 'library' }) {
    return (
        <Button
            startDecorator={icon}
            size={size}
            variant={variant}
            rounded ={rounded}
            tooltip={tooltip}
            onPress={() => emitter.emit(`fld_files_${field_name}`, { action: 'add', source: source })}
        />
    );
}
