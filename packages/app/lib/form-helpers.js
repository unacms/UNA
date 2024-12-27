import { componentsMap } from 'app/components/form-fields/_map';
import { Text } from 'app/design/typography'

export function getFormFieldByData(inputData, handleSubmit, format, externalProps) {

    if (!inputData)
        return <></>;

    const InputType = componentsMap[String(inputData.type)];

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
