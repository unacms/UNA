import { Text } from 'app/design/typography'
import { View, Row, Pressable } from 'app/design/view'
import { fetcher } from 'app/lib/fetcher';
import React, { useState, useCallback, useContext } from 'react';
import Profile from 'app/ui/molecules/profile'
import { Button, InputRounded } from 'app/design/controls'
import Loading from 'app/ui/atoms/loading'
import { BottomSheetData } from 'app/context/bottomsheet';

export default function CreateConvo ({ onSave }) {
    const [users, setUsers] = useState([]);
    const [susers, setSUsers] = useState([]);
    const [showLoading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSearchUsers = useCallback(async (sValue) => {
        setLoading(true);
        let request_url = '/api.php?r=bx_messenger/search_users/Services&params=' + JSON.stringify({ term: sValue });
        const sResponse = await fetcher(request_url);
        setUsers(sResponse.data);
        setLoading(false);

    }, [users]);

    const handlerOnSelect = useCallback((oData) => {
        if (susers.find((user) => user.id === oData.id) === undefined)
            setSUsers((prev) => ([...prev, oData]));

        setUsers(users.filter((user) => user.id !== oData.id));
    }, [users]);

    const handlerOnRemove = useCallback((oData) => {
        if (users.find((user) => user.id === oData.id) === undefined)
            setUsers((prev) => [...prev, oData]);

        setSUsers(susers.filter((user) => user.id !== oData.id));

    }, [users, susers]);

    const handleSave = async () => {
        let request_url = '/api.php?r=bx_messenger/save_parts_list/Services&params=' + JSON.stringify({ parts: susers.map(item => item.id) });
        const sResponse = await fetcher(request_url);
        if (sResponse.data.code == 0) {
            onSave(sResponse.data)
        }
        else {
            setMessage(sResponse.data.message)
        }
    };

    return <View className="">
        <Row className="text-center w-full  flex-wrap gap-x-2 py-2">
            {susers && susers.map((oItem) => <User key={oItem.id} data={oItem} onSelect={handlerOnRemove} />)}
        </Row>
        <Row className="gap-x-2">
            <InputRounded
                placeholder={"Select users..."}
                className="px-2 w-full"
                onChangeText={handleSearchUsers}
                role="textbox" aria-label="Select users..."
            />
            <Button variant="outline" disabled={susers.length == 0} startDecorator="Check" rounded align="start" onPress={() => handleSave()} />

        </Row>
        <Row>
            <Text className="ml-0.5 mt-0.5 label-text-alt text-sm text-red-600 animate-pulse dark:text-red-400 font-medium">{message}</Text>
        </Row>
        <Row className="text-center py-2 w-full  flex-wrap gap-x-2 ">
            {users && !showLoading && users.map((oItem) => <User key={oItem.id} data={oItem} onSelect={handlerOnSelect} />)}
            {showLoading && <View className=' w-full items-center justify-center py-2'><Loading /></View>}
        </Row>
    </View>
};

const User = ({ data, onSelect }) => {
    return <Pressable onPress={() => onSelect(data)}>
        <View className="p-1 pr-2 group duration-200 rounded-full active:opacity-50 active:translate-y-1
                hover:bg-bgritem-h dark:hover:bg-bgritem-dh max-w-5xl self-center w-full border border-bdrnavbar dark:border-bdrnavbar-d mb-2">
            <Profile displaySize="xs" {...data.author_data} url="" />
        </View>
    </Pressable>
};

export function CreateConvoButton({onSave, variant ='small'}) {
    const { bottomSheetData, setBottomSheetData } = useContext(BottomSheetData);
    const newConvo = () => {
        setBottomSheetData({ title: 'Add users to start messaging', content: <CreateConvo onSave={onSaveHandler} />, showClose: true, snapPoints: ['25%', '50%'] });
    }

    const onSaveHandler = (data) => {
        setBottomSheetData(false);
        onSave(data);
       
    }

    if (variant == 'small')
        return <View className="ml-2 " key={`add-1`} ><Button startDecorator={"Plus"} variant="outline" rounded size="sm" onPress={() => newConvo()} /></View>

    return <Button startDecorator={"Plus"} variant="primary" title="Create your first conversation" rounded  onPress={() => newConvo()} />

}