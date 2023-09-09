import { View, Row } from 'app/design/view'
import { useState } from 'react';
import { getFormFieldByData } from 'app/lib/form-helpers'
import React from 'react'
import dynamic from 'next/dynamic'
import { Platform } from 'react-native'
import { Dimensions } from 'react-native';
import { env } from 'app/lib/env';

export default function FormPost(props) {
    
    const [imageSource, setImageSource] = useState([]);

    function setPlaceHolder(name, previews) {
        if (JSON.stringify(previews) != JSON.stringify(imageSource[name])) {
            setImageSource(prevImageSource => ({
                ...prevImageSource,
                [name]: previews,
            }));
        }
    }

    let prevList = Object.values(imageSource).flat();
    if ( props.data.inputs['covers']){
        props.data.inputs['covers'].viewClasses = 'border-dashed border-bdrinput dark:border-bdrinput-dark';
        props.data.inputs['covers'].caption = "Add header image"
    }
    props.data.inputs['title'].type = 'textarea';
    props.data.inputs['title'].height = 38;
    props.data.inputs['title'].viewClasses = ' text-xl lg:text-3xl font-bold my-4 font-bold tracking-tight placeholder-neutral-600 text-neutral-900 dark:text-neutral-50  focus:outline-none'

    props.data.inputs['text'].viewClasses = 'dark:focus:bg-red-500';

    return <View className='w-full max-w-5xl'>
        <View className='bg-white dark:bg-backgroundbody-dark border border-neutral-500/10 p-4 pb-0 rounded-lg mb-2'>
            {getFormFieldByData(props.data.inputs['covers'], props.handleSubmit, 'notitle', {format:'custom'})}
            {getFormFieldByData(props.data.inputs['title'], props.handleSubmit, 'notitle', {placeholder: 'Title...', format:'custom'})}
            {getFormFieldByData(props.data.inputs['text'], props.handleSubmit, 'notitle', {placeholder: 'Write your text here...'})}
        </View>
        <Row>
            <View className='w-12'>{getFormFieldByData(props.data.inputs['pictures'], props.handleSubmit, 'custom', {previewPlaceHolder: setPlaceHolder})}</View>
            <View className='w-12'>{getFormFieldByData(props.data.inputs['videos'], props.handleSubmit, 'custom', {previewPlaceHolder: setPlaceHolder})}</View>
            <View className='w-12'>{getFormFieldByData(props.data.inputs['files'], props.handleSubmit, 'custom', {previewPlaceHolder: setPlaceHolder})}</View>
            <View className='w-12'>{getFormFieldByData(props.data.inputs['sounds'], props.handleSubmit, 'custom', {previewPlaceHolder: setPlaceHolder})}</View>
           
        </Row>
        { (prevList.length> 0 && prevList[0]?.key) && <Row className='flex-wrap gap-2 mb-4'>{prevList}</Row>}
        {getFormFieldByData(props.data.inputs['cat'], props.handleSubmit, 'notitle')}
        {getFormFieldByData(props.data.inputs['allow_view_to'], props.handleSubmit,  'notitle')}
        {getFormFieldByData(props.data.inputs['do_publish'], props.handleSubmit,  'default')}
        {getFormFieldByData(props.data.inputs['do_submit'], props.handleSubmit,  'default')}
        

    </View>
}
