import React from 'react';
import Field from './_field';
import {Text} from 'app/design/typography'

export default function FormFieldSelect(props) {
    return (
        <Field {...props}>
            <Text>TODO: select input</Text>
        </Field>
    );
// <select className="input input-bordered bg-gray-50 border border-gray-300 text-gray-900 text-base rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"></select>
}
