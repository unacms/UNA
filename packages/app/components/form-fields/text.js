import React from 'react';
import Field from './_field';
import {Text} from 'app/design/typography'
import {TextInput} from 'react-native';

export default function FormFieldText(props) {
    
    
    
    return (
 
            <TextInput onChangeText={handlePasswordChange}
    placeholder="Username" className="input bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-900 dark:border-gray-700 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"

  
  />
 
    );
// <input className="input bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-900 dark:border-gray-700 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" type="text" {...props.register(props.name)} />
}
