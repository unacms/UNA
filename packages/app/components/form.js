import React from 'react';

//import { useForm, Controller } from 'react-hook-form';
import {  Button, Alert, StyleSheet } from "react-native";
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
    files: Files
}

export default function Form(props) {

    let data = props.data;
    let onFormSubmit = props.onFormSubmit;
   

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
    
    const {...methods} = useForm();  
    
    const inputs = Object.keys(data.inputs).map(function (key) {
        const a = data.inputs[key];
        const InputType = components[a.type];
        if (InputType){
            return <InputType key={data.inputs[key].name} {...a} handleSubmit = {methods.handleSubmit(onSubmit, onError)} />;
        }
        else{
            return <Text>Unsupporded field type: {a.type}</Text>
        }
    });    
    
    return (
        <View className="w-full grid place-items-center px-4 first:pt-4" >
            <FormProvider {...methods}> 
                {inputs}
            </FormProvider>
        </View>
    );
}
