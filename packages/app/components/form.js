import React from 'react';

import Captcha from './form-fields/captcha';
import Custom from './form-fields/custom';
import Hidden from './form-fields/hidden';
import Password from './form-fields/password';
import Submit from './form-fields/submit';
import Switcher from './form-fields/switcher';
import TextField from './form-fields/text';
import Textarea from './form-fields/textarea';
import Select from './form-fields/select';
import Files from './form-fields/files';
import Location from './form-fields/location';
import Datetime from './form-fields/dattime';
import { Text } from 'app/design/typography';
import { useForm, FormProvider, SubmitHandler, SubmitErrorHandler } from 'react-hook-form';

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

export default function Form(props) {

    let data = props.data;
    let onFormSubmit = props.onFormSubmit;

    const defaultValues = {}

    Object.keys(data.inputs).forEach(function (key) {  
        if (data.inputs[key].value || data.inputs[key].value == 0)      
            defaultValues[key] = data.inputs[key].value;
    });


    const onSubmit = async d => {
        const formData = new FormData();
        Object.keys(d).map(function (key) {
            formData.append(key, d[key]);
        });
       await onFormSubmit(formData, d); 
    }    

    const onError = async d => {
        //TODO: gandle error
    }   
    const {...methods} = useForm({defaultValues: defaultValues});  

    React.useEffect(() => {
        if (methods.formState.isSubmitSuccessful) {
            methods.reset();
        }
      }, [methods.formState, methods.submittedData, methods.reset]);


    if(data.reset){
        //TODO: Set Value without timeout
        setTimeout(() => {
            methods.setValue('cmt_parent_id', defaultValues['cmt_parent_id']);   
        }, 100);
    }


    const inputs = Object.keys(data.inputs).map(function (key) {
        const a = data.inputs[key];
        
       
        const InputType = components[String(a.type)];
        let k = data.inputs[key].name;
        if (InputType){
            return <InputType key={k} {...a} handleSubmit = {methods.handleSubmit(onSubmit, onError)} />;
        }
        else{
            return <Text>Unsupporded field type: {a.type}</Text>
        }

    });   

    return (
        <FormProvider {...methods}> 
            {inputs}
        </FormProvider>
    );
}
