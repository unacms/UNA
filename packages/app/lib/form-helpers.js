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

import FormComments from 'app/components/forms/comments';
import FormFeed from 'app/components/forms/feed';
import FormPost from 'app/components/forms/post';

import { View, Row } from 'app/design/view'
import Image from 'app/ui/atoms/image';
import { Button } from 'app/design/controls';
import { Icon } from 'app/ui/atoms/icon';

export function getFormType(name){
    const componentsMapForms = {
        comment: FormComments,
        feed: FormFeed,
        bx_posts: FormPost,
    };

    return componentsMapForms[name];
}

export function getFormFieldList(name, inputs, handleSubmit, isInitial = false){
console.log('aaa', name);
    const ElementForm = getFormType(name);

    if ('undefined' !== typeof ElementForm && isInitial) {
        return ;
    }

    return  Object.keys(inputs).map(function (key) {
        return getFormFieldByData(inputs[key], handleSubmit, 'default', isInitial)
    });  
}

export function getFormFieldByData(inputData, handleSubmit, format, externalProps){
   
    if (!inputData)
        return ;

    const components = {
        captcha: Captcha,
        custom: Custom,
        hidden: Hidden,
        password: Password,
        submit: Submit,
        switcher: Switcher,
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

