import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import {getFormFieldByData} from 'app/lib/form-helpers'

import FormComments from 'app/components/forms/comments';
import FormFeed from 'app/components/forms/feed';
import FormPost from 'app/components/forms/post';

function getFormType(name){
    const componentsMapForms = {
        comment: FormComments,
        feed: FormFeed,
        bx_posts: FormPost,
    };

    return componentsMapForms[name];
}

function getFormFieldList(name, inputs, handleSubmit, isInitial = false){

    const ElementForm = getFormType(name);

    if ('undefined' !== typeof ElementForm && isInitial) {
        return ;
    }

    return  Object.keys(inputs).map(function (key) {
        return getFormFieldByData(inputs[key], handleSubmit, 'default', isInitial)
    });  
}

export default function Form(props) {

    let data = props.data;
    let response = props.response;
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
    let _handleSubmit = methods.handleSubmit(onSubmit, onError)
    let name = props.data.params.display.includes('_delete') ? '' : props.name
    let inputs = getFormFieldList(name, data.inputs, _handleSubmit, true) 

    
    const ElementForm = getFormType(name)

    if ('undefined' !== typeof ElementForm)
        inputs = <ElementForm data={data} response={response} handleSubmit={_handleSubmit} ></ElementForm>
    return (
        <FormProvider {...methods}> 
            {inputs}
        </FormProvider>
        
    );
}
