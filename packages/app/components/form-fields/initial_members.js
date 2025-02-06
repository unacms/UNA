import Field from './_field';
import { Text } from 'app/design/typography'
import { View, Row, Pressable } from 'app/design/view'
import { useState, useRef, useEffect, useCallback, useContext, useReducer } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { fetcher } from 'app/lib/fetcher';
import Profile from 'app/ui/molecules/profile'
import { Button, InputRounded } from 'app/design/controls'
import Loading from 'app/ui/atoms/loading'
import { useBottomSheetData } from 'app/context/bottomsheet';
import { Icon } from 'app/ui/atoms/icon'
import KbAvoidingView from 'app/ui/atoms/kb-avoiding-view';

const User = ({ data, onSelect, type }) => {
    return (
        <Pressable onPress={() => onSelect(data)}>
            <Row className=" p-[5px] pr-2 sm:pr-3 rounded-full border border-bdr dark:border-bdr-d mb-2 mr-2 items-center justiy-center">
                <Profile displaySize="sm" {...data} showLinks={false} />
                {type == 'remove' && <Icon icon="X" />}
            </Row>
        </Pressable>
    );
};

export function SelectUsers({ onSave, initedData = [], requestUrl, isSingle = false }) {

    const initialState = {
        suggestedUsers: [],
        selectedUsers: initedData,
        showLoading: false,
        searchText: ''
    };

    const [state, dispatch] = useReducer(reducer, initialState);

    function reducer(state, action) {
        if (action.suggestedUsers)
            action.suggestedUsers = action.suggestedUsers.filter((v, i, a) => a.map(e => e.id).indexOf(v.id) === i);

        if (action.selectedUsers)
            action.selectedUsers = action.selectedUsers.filter((v, i, a) => a.map(e => e.id).indexOf(v.id) === i);

        switch (action.type) {
            case 'setSelectedUsers':
                return { ...state, selectedUsers: action.selectedUsers };
            case 'setLoading':
                return { ...state, showLoading: true };
            case 'searchFinished':
                const selectedUserIds = state.selectedUsers.map(user => user.id);
                action.suggestedUsers = action.suggestedUsers.filter(user => !selectedUserIds.includes(user.id));
                return { ...state, suggestedUsers: action.suggestedUsers, showLoading: false, searchText: action.searchText };
            case 'userSelected':
                return { ...state, suggestedUsers: action.suggestedUsers, selectedUsers: action.selectedUsers };
        }
    }

    const onChangeText = useCallback(async (sValue) => {
        dispatch({ type: 'setLoading' })
        const sResponse = await fetcher(requestUrl + JSON.stringify({ term: sValue }));
        dispatch({ type: 'searchFinished', suggestedUsers: sResponse.data, searchText: sValue })
    }, []);

    const onSelectUser = useCallback((oData) => {
        dispatch({ type: 'userSelected', selectedUsers: [...state.selectedUsers, oData], suggestedUsers: state.suggestedUsers.filter((user) => user.id !== oData.id) })
    }, [state.suggestedUsers]);

    useEffect(() => {
        if (isSingle && state.selectedUsers.length > 0)
            onSave(state.selectedUsers);
    }, [state.selectedUsers]);

    const onRemove = useCallback((oData) => {
        dispatch({ type: 'userSelected', selectedUsers: state.selectedUsers.filter((user) => user.id !== oData.id), suggestedUsers: [...state.suggestedUsers, oData] })
    }, [state.suggestedUsers, state.selectedUsers]);

    const onSaveInt = useCallback(async () => {
        onSave(state.selectedUsers, !isSingle);
    }, [state.selectedUsers, isSingle]);

    return <View className="px-1">
        <KbAvoidingView>
            <Row className="text-center w-full  flex-wrap gap-x-2 ">
                {state.selectedUsers && state.selectedUsers.map((item) => <User key={item.id} data={item} onSelect={onRemove} />)}
            </Row>
            <Row className="py-2 gap-x-2 ">
                <InputRounded
                    placeholder={"Select users..."}
                    className="px-2 mr-2 w-full"
                    onChangeText={onChangeText}
                    role="textbox"
                    autoFocus={true}
                />
                <Button variant="outline" disabled={state.selectedUsers.length == 0} startDecorator="Check" rounded align="start" onPress={() => onSaveInt()} />
            </Row>
            <Row className="text-center w-full flex-wrap gap-x-2 ">
                {state.suggestedUsers && !state.showLoading && state.suggestedUsers.map((item) => <User key={item.id} data={item} onSelect={onSelectUser} />)}
                {state.showLoading && <View className=' w-full items-center justify-center py-2'><Loading /></View>}
                {state.suggestedUsers.length == 0 && state.searchText != '' && !state.showLoading && <Text className="text-sm py-2">Nothing found</Text>}
            </Row>
        </KbAvoidingView>
    </View>
};

export default function (props) {
    const rules = {};
    const defaultValue = props.value ? props.value : '';
    const formContext = useFormContext();
    const name = props.name ? props.name : '';
    const { field } = useController({ name, rules, defaultValue });
    const { setBottomSheetData } = useBottomSheetData();
    const [selected, setSelected] = useState(props.value_data ? props.value_data : []);
    const isSingle = props?.custom?.only_once;
    const onSave = (data, isAdd = false) => {
        if (isAdd) {
            data = [...selected, ...data]
        }
        data = data.filter((v, i, a) => a.map(e => e.id).indexOf(v.id) === i);
        const value = data.map(item => item.id);
        setSelected(data)
        field.onChange(value);
        setBottomSheetData(false);
    }

    const showSelect = (val) => {
        setBottomSheetData({ title: 'Choose users', showClose: true, content: <SelectUsers isSingle={isSingle} onSave={onSave} requestUrl={'/api.php?r=' + props.ajax_get_suggestions + "&params="} initedData={[]} /> });
    }

    const onRemove = useCallback((valueToRemove) => {
        if (!isSingle) {
            onSave(selected.filter(item => item.id !== valueToRemove.id))
        }
    }, [selected]);

    return (
        <Field {...props} error2={formContext.formState.errors[name]}>
            <View className='w-full '>
                <Row className='gap-x-2  justify-start items-start flex-row flex-wrap'>
                    {selected && selected.map((oItem) => <User type={isSingle ? '' : "remove"} key={oItem.id} data={oItem} onSelect={onRemove} />)}
                    <View className=''>
                        <Button
                            title={'Select ...'}
                            startDecorator="Plus"
                            variant="default"
                            rounded
                            size="base"
                            onPress={() => showSelect()}
                        />
                    </View>
                </Row>
            </View>
        </Field>
    );
}
