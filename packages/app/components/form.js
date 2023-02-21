import React from 'react';

import { useForm, Controller } from 'react-hook-form';
import {  TextInput, Button, Alert, StyleSheet } from "react-native";
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

   // let data = props.data;
    let onFormSubmit = props.onFormSubmit;
    //console.log(onFormSubmit);
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
    
    
  const { register, setValue, handleSubmit, control, reset, formState: { errors } } = useForm();
   
   const onSubmit = async d => {
        const formData = new FormData();

        Object.keys(d).map(function (key) {
            formData.append(key, d[key]);
        });
       console.log(555);
       console.log(formData.get('email'));
       await onFormSubmit(formData, d); 
    }
   
    const styles = StyleSheet.create({});

  return (
    <View style={styles.container}>
      <Text style={styles.label}>First name</Text>
      <Controller
        control={control}
        render={({field: { onChange, onBlur, value }}) => (
          <TextInput
            style={styles.input}
            onBlur={onBlur}
            onChangeText={value => onChange(value)}
            value={value}
          />
        )}
        name="email"
        rules={{ required: true }}
      />
      <Text style={styles.label}>Last name</Text>
      <Controller
        control={control}
        render={({field: { onChange, onBlur, value }}) => (
          <TextInput
            style={styles.input}
            onBlur={onBlur}
            onChangeText={value => onChange(value)}
            value={value}
          />
        )}
        name="password"
        rules={{ required: true }}
      />

      <View style={styles.button}>
        <Button
          style={styles.buttonInner}
          color
          title="Reset"
          onPress={() => {
            reset({
              email: 'jane@example.com',
              password: '****'
            })
          }}
        />
      </View>

      <View style={styles.button}>
        <Button
          style={styles.buttonInner}
          color
          title="Button"
          onPress={handleSubmit(onSubmit)}
        />
      </View>
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
