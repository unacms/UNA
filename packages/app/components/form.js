import React from 'react';
import { Text } from 'app/design/typography';
import { useForm, FormProvider, SubmitHandler, SubmitErrorHandler } from 'react-hook-form';
import FormExContextProvider from 'app/context/form';

import { getFormFieldType, getFormField, getFormFieldList, getFormType } from 'app/lib/form-helpers'

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
    let _handleSubmit = methods.handleSubmit(onSubmit, onError)
    let inputs = getFormFieldList(props.name, data.inputs, _handleSubmit, true) 
    const ElementForm = getFormType(props.name)

    if ('undefined' !== typeof ElementForm)
        inputs = <ElementForm data={data} handleSubmit={_handleSubmit} ></ElementForm>
    return (
        <FormProvider {...methods}> 
            {inputs}
        </FormProvider>
        
    );
}
