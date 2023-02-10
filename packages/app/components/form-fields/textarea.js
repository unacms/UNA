import React from 'react';
import Field from './_field';
import {Text} from 'app/design/typography'

export default function FormFieldTextarea(props) {
    return (
        <Field {...props}>
            <Text>TODO: textarea input</Text>
        </Field>
    );
// <textarea className=" textarea textarea-bordered bg-gray-50 border border-gray-300 text-gray-900 text-base rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-900 dark:border-gray-700 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="" {...props.register(props.name)}></textarea>
}
