import { componentsMap } from 'app/components/form-fields/_map';

export function getFormFieldByData(inputData, handleSubmit, format, externalProps){
   
    if (!inputData)
        return <></>;

    const InputType = componentsMap[String(inputData.type)];

    if (!InputType) 
        return <Text>Unsupported field type: {inputData.type}</Text>
    return <InputType key={inputData.name} {...inputData} format = {format} handleSubmit = {handleSubmit} {...externalProps}/>;

}

export function inputByKey(array, value) {
    return array.find(obj => obj['key'] === value);
}

