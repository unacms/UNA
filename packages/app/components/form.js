import React from 'react';
import { useForm, FormProvider, SubmitHandler, SubmitErrorHandler,Controller  } from "react-hook-form";
import {  TextInput, Button, Alert } from "react-native";
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
import {useEffect, useState, useContext } from 'react';
import { GlobalsData } from '../context/context';
import { View } from 'app/design/view';
import { Text } from 'app/design/typography';

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
    files: Files
}

export default function Form(props) {

    let data = props.data;
    let onFormSubmit = props.onFormSubmit;
    console.log(onFormSubmit);
    /*let onFormSubmit = props.onFormSubmit;

    const defaultValues = {}
    
    Object.keys(data.inputs).forEach(function (key) {  
        if (data.inputs[key].value || data.inputs[key].value == 0)      
            defaultValues[key] = data.inputs[key].value;
    });

    const { register, handleSubmit, setValue } = useForm({
        defaultValues: defaultValues,
    });

    if (props.handleValues){
        props.handleValues(defaultValues, setValue);
        //if(props.commentData && props.commentData.parentId != defaultValues['cmt_parent_id'] && props.commentData.parentId > 0){
        //    setValue('cmt_parent_id', props.commentData.parentId);
        //    props.commentData.parentId = 0;
        //}
    }
    
    const inputs = Object.keys(data.inputs).map(function (key) {
        const a = data.inputs[key];
        const InputType = components[a.type];
        if (InputType){
           // if (data.inputs[key].value)
           //     defaultValues.key = data.inputs[key].value;
            return <InputType key={data.inputs[key].name} register={register} {...a} />;
        }
        else{
            return <Text>Unsupporded field type: {a.type}</Text>
        }
    });

    const onFormPreSubmit = async d => {
        const formData = new FormData();

        Object.keys(d).map(function (key) {
            formData.append(key, d[key]);
        });
        await onFormSubmit(formData, d); 
    }*/
    
    
    const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      firstName: '',
      lastName: ''
    }
  });
  const onSubmit = data => {
      console.log(data);
      onFormSubmit(formData, d); 
  };

return (
    <View>
      <Controller
        control={control}
        rules={{
         required: true,
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
           
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
        name="firstName"
      />
      {errors.firstName && <Text>This is required.</Text>}

      <Controller
        control={control}
        rules={{
         maxLength: 100,
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
           
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
        name="lastName"
      />

      <Button title="Submit" onPress={handleSubmit(onSubmit)} />
    </View>
  );    
    
    /*return (
        <View className="w-full grid place-items-center px-4 first:pt-4" onSubmit={ handleSubmit(onFormPreSubmit) }>
            <FormProvider {...methods}>
                {inputs}
            </FormProvider>
        </View>
    );*/
}
