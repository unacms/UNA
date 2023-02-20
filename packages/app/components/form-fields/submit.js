import React from 'react';
import Field from './_field';
import {Text} from 'app/design/typography'
import {Button} from 'react-native';

export default function FormFieldSubmit(props) {
    
    const handleSubmit = () => {
        props.onSubmit();
  // Perform validation and/or API calls here
};
    
    return (
        <Button onPress={handleSubmit} title="xzcz"/>

    );
// <button className=" text-white bg-blue-600 hover:bg-blue-700   border border-gray-900/20 dark:border-white/20 focus:ring-4 shadow-sm hover:shadow-md active:shadow-sm hover:-translate-y-0.5 active:translate-y-0 duration-200 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-base  @xl/cell:w-auto px-5 py-2.5 text-center  dark:focus:ring-blue-800" type="submit" {...props.register(props.name)}>{props.value}</button>
}
