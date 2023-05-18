import Captcha from 'app/components/form-fields/captcha';
import Custom from 'app/components/form-fields/custom';
import Hidden from 'app/components/form-fields/hidden';
import Password from 'app/components/form-fields/password';
import Submit from 'app/components/form-fields/submit';
import Switcher from 'app/components/form-fields/switcher';
import TextField from 'app/components/form-fields/text';
import Textarea from 'app/components/form-fields/textarea';
import Select from 'app/components/form-fields/select';
import Files from 'app/components/form-fields/files';
import Location from 'app/components/form-fields/location';
import Datetime from 'app/components/form-fields/dattime';

export function getFormFieldByData(inputData, handleSubmit, format, externalProps){
   
    if (!inputData)
        return <></>;

    const components = {
        captcha: Captcha,
        custom: Custom,
        hidden: Hidden,
        password: Password,
        submit: Submit,
        switcher: Switcher,
        checkbox: Switcher,
        text: TextField,
        textarea: Textarea,
        select: Select,
        files: Files,
        location: Location,
        datetime: Datetime
    }
    const InputType = components[String(inputData.type)];

    if (!InputType) 
        return <Text>Unsupported field type: {inputData.type}</Text>
    return <InputType key={inputData.name} {...inputData} format = {format} handleSubmit = {handleSubmit} {...externalProps}/>;

}

export function inputByKey(array, value) {
    return array.find(obj => obj['key'] === value);
}

