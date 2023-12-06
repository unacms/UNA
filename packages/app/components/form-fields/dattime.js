import Field from './_field';
import { useEffect } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { Input } from 'app/design/controls'
import { View, Row } from 'app/design/view'
import Dropdown from 'app/ui/atoms/dropdown'
import { useState } from 'react';
import { Modal } from 'app/design/controls'
import { Button } from 'app/design/controls';
import { Text } from 'app/design/typography';
import { Icon } from 'app/ui/atoms/icon';
import { Theme } from 'app/design/theme';
import { Hidden } from 'app/design/controls'
import Calendar from 'app/ui/atoms/calendar'

export default function FormFieldDattime({ name, value = '', type, ...props }) {
    const formContext = useFormContext();
    const rules = {};
    const { field } = useController({ name, rules, defaultValue: value });

    const setParamValue = (value) => {
        const date = new Date(value*1000);
        let v = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:00Z`;
        setTimeout(() => {
            formContext.setValue(name, v);
        }, 100);
    }

    return (
        <Field {...props}>
            <Calendar value={field.value} type={type} name={name} onChange={(value) => { setParamValue(value)}}/>
        </Field>
    );
}
