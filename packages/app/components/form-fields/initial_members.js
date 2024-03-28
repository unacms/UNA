import Field from './_field';
import { Text } from 'app/design/typography'
import { View, Row, Pressable } from 'app/design/view'
import { useState, useRef, useEffect, useCallback } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { Input } from 'app/design/controls'
import Dropdown from 'app/ui/atoms/dropdown'
import { fetcher } from 'app/lib/fetcher';
import { Hidden } from 'app/design/controls'
import Profile from 'app/ui/molecules/profile'

const User = ({ data, onSelect }) => {
    return <Pressable onPress={() => onSelect(data)}>
        <View className="p-1 pr-2 group duration-200 rounded-full active:opacity-50 active:translate-y-1
                hover:bg-bgritem-h dark:hover:bg-bgritem-dh max-w-5xl self-center w-full border border-bdrnavbar dark:border-bdrnavbar-d mb-2">
            <Profile displaySize="xs" {...data} url="" />
        </View>
    </Pressable>
};

export default function (props) {
    let rules = {};
    let defaultValue = props.value ? props.value : '';
    const formContext = useFormContext();
    let name = props.name ? props.name : '';
    let { field } = useController({ name, rules, defaultValue });

    const [selectedValues, setSelectedValues] = useState([]);
    const [selectedValue, setSelectedValue] = useState('');

    const [users, setUsers] = useState([]);
    const [susers, setSUsers] = useState([]);

    const handleSearch = async (value) => {
        const sResponse = await fetcher('/api.php?r=' + props.ajax_get_suggestions + "&term=" + value);
        console.log("sResponse.data", sResponse.data)
        setUsers(sResponse.data);
    };

    const setValueF = (val) => {
        formContext.setValue(name, val);
    }

    const handlerOnRemove = useCallback((oData) => {
        if (users.find((user) => user.id === oData.id) === undefined)
            setUsers((prev) => [...prev, oData]);

        setSUsers(susers.filter((user) => user.id !== oData.id));

    }, [users, susers]);

    const handlerOnSelect = useCallback((oData) => {
        if (susers.find((user) => user.id === oData.id) === undefined)
            setSUsers((prev) => ([...prev, oData]));

        setUsers(users.filter((user) => user.id !== oData.id));
    }, [users]);

    useEffect(() => {
        (async () => {
            if (props.custom?.callback && props?.attrs?.disabled != 'disabled') {
                const sResponse = await fetcher('/api.php?r=' + props.custom.callback + field.value);
                const names = Object.keys(sResponse.data);
                names.forEach(name2 => {
                    console.log(name2, (sResponse.data[name2].value))
                    formContext.setValue(name2, (sResponse.data[name2].value));
                });
            }
        })();

        if (props?.attrs?.disabled == 'disabled') {
            (async () => {
                const sResponse = await fetcher('/api.php?r=' + props.custom.callback + defaultValue);
                const names = Object.keys(sResponse.data);
                setSelectedValue(sResponse.data['name'].value);
            })();
        }

    }, [field.value]);
    return (
        <Field {...props}>
            <View className='gap-y-4'>
                <Row className="text-center w-full  flex-wrap gap-x-2 py-2">
                    {susers && susers.map((oItem) => <User key={oItem.id} data={oItem} onSelect={handlerOnRemove} />)}
                </Row>
                {props?.attrs?.disabled != 'disabled' && <Input onChangeText={(value) => handleSearch(value)} />}
                <Row className="text-center w-full  flex-wrap gap-x-2 py-2">
                    {users && users.map((oItem) => <User key={oItem.author_data.id} data={oItem.author_data} onSelect={handlerOnSelect} />)}
                </Row>
            </View>
            <Hidden
                name={props.name}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                value={String(field.value)}
            />
        </Field>
    );
}
