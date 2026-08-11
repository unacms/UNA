import Field from './_field';
import { Text } from 'app/design/typography'
import { View, Row, Pressable, ScrollView } from 'app/design/view'
import { useState, useEffect, useCallback, useReducer } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { fetcher } from 'app/lib/fetcher';
import Profile from 'app/ui/molecules/profile/profile'
import { Button, NeoButton, Input, Modal } from 'app/design/controls'
import Loading from 'app/ui/atoms/loading'
import { Icon } from 'app/ui/atoms/icon'
import { useTranslation } from 'react-i18next';

const User = ({ data, onSelect, type }) => {
    if (type !== 'multi'){
        return (
            <Pressable className="" onPress={() => onSelect(data)}>
                <Row className="  p-1.5 h-9 overflow-hidden truncate bg-muted rounded-full items-center justiy-center">
                    {<Profile displaySize="xs" displayType="unit_wo_info" {...data} showLinks={false} />}
                    <Text className="text-card-foreground web:hover:text-primary text-sm px-1.5 font-semibold tracking-tight truncate">
                        {data.display_name}
                    </Text>
                </Row>
            </Pressable>
        )
    }
    return (
        <Pressable className="" onPress={() => onSelect(data)}>
            <Row className=" p-1.5 h-9 overflow-hidden truncate rounded-full shadow-btn-outline dark:shadow-btn-outline-deep bg-card items-center justiy-center">
                {<Profile displaySize="xs" displayType="unit_wo_info" {...data} showLinks={false} />}
                <Text className="text-card-foreground px-1.5 web:hover:text-primary text-sm font-semibold tracking-tight truncate">
                    {data.display_name}
                </Text>
                <Text className="text-card-foreground rounded-full bg-muted p-0.5 my-auto h-6 w-6 items-center justify-center"><Icon icon="X" size={20} /></Text>
            </Row>
        </Pressable>
    );
};


export function SelectUsers({ onSave, initedData = [], requestUrl, isSingle = false }) {

    const { t } = useTranslation();
    const initialState = {
        suggestedUsers: [],
        selectedUsers: Array.isArray(initedData) ? initedData : [],
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
        <ScrollView keyboardDismissMode="none" keyboardShouldPersistTaps="handled" className="w-full overflow-visible min-h-64" >
            <Row className="text-center w-full flex-wrap gap-1 pb-4">
                {state.selectedUsers && state.selectedUsers.map((item) => <User key={item.id} data={item} onSelect={onRemove} />)}
            </Row>
            <Row className="pb-4 gap-2 px-1">
                <Input
                    placeholder={"Select users..."}
                    className="px-2 mr-2  w-full"
                    onChangeText={onChangeText}
                    role="textbox"
                />
                <Button variant="primary" size="lg" disabled={state.selectedUsers.length == 0} startDecorator="Check" onPress={() => onSaveInt()} />
            </Row>
            <Row className="text-center w-full flex-wrap gap-1 ">
                {state.suggestedUsers && !state.showLoading && state.suggestedUsers.map((item) => <User key={item.id} data={item} onSelect={onSelectUser} />)}
                {state.showLoading && <View className=' w-full items-center justify-center py-2'><Loading /></View>}
                {state.suggestedUsers.length == 0 && state.searchText != '' && !state.showLoading && <Text className="text-sm py-2">{t('Nothing found')}</Text>}
            </Row>
        </ScrollView>
    </View>
};

export default function (props) {
    const rules = {};
    const defaultValue = props.value ? props.value : '';
    const formContext = useFormContext();
    const name = props.name ? props.name : '';
    const { field } = useController({ name, rules, defaultValue });
    const [selected, setSelected] = useState(props.value_data ? props.value_data : []);
    const [isModal, setIsModal] = useState(false);
    const isSingle = props?.custom?.only_once;
    const onSave = (data, isAdd = false) => {
        if (isAdd) {
            data = [...selected, ...data]
        }
        data = data.filter((v, i, a) => a.map(e => e.id).indexOf(v.id) === i);
        const value = data.map(item => item.id);
        setSelected(data)
        field.onChange(value);
        //setBottomSheetData(false);
        setIsModal(false);
    }

    const showSelect = (val) => {
        setIsModal(true);

    }

    const onRemove = useCallback((valueToRemove) => {
        if (!isSingle) {
            onSave(selected.filter(item => item.id !== valueToRemove.id))
        }
    }, [selected]);

    return (
        <Field {...props} error2={formContext.formState.errors[name]}>
            <Modal id='file-preview2' title={props.title || "Choose users"} onVisible={!!isModal} onClose={() => { setIsModal(false) }}>
                <SelectUsers isSingle={isSingle} onSave={onSave} requestUrl={'/api.php?r=' + props.ajax_get_suggestions + (props.ajax_get_suggestions.includes("params[]") ? '' : "&params=")} initedData={[]} />
            </Modal>
            <Row className='w-full px-1.5 py-1 items-center justify-between flex-wrap shadow-input-outline dark:shadow-input-outline-deep rounded-lg bg-input/60'>
                <Row className='gap-2 items-center flex-wrap my-auto flex-1'>
                    {selected && selected.map((oItem) => <User type={isSingle ? '' : "multi"} key={oItem.id} data={oItem} onSelect={isSingle ? showSelect : onRemove} />)}
                </Row>
                <NeoButton
                    image={isSingle ? 'RefreshCw' : 'Plus'}
                    style="borderless"
                    controlSize="small"
                    accessibilityLabel={isSingle ? 'Change' : 'Add'}
                    onPress={() => showSelect()}
                />
            </Row>
        </Field>
    );
}
