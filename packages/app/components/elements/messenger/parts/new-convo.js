import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { fetcher } from 'app/lib/fetcher';
import React, { useContext, useState } from 'react';
import { Button, Modal } from 'app/design/controls'
import { useBottomSheetData } from 'app/context/bottomsheet';
import { SelectUsers } from 'app/components/form-fields/initial_members';
import Loading from 'app/ui/atoms/loading'
import { FormError } from 'app/components/form-fields/_field';

export default function CreateConvo({ onSave, initedData = [], convoId }) {
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const handleSave = async (data) => {
        setLoading(true);
        const params = {
            parts: data.map(item => item.id),
            ...(convoId && { lot_id: convoId })
        };
        const request_url = '/api.php?r=bx_messenger/save_parts_list/Services&params=' + JSON.stringify(params);
        const sResponse = await fetcher(request_url);
        setLoading(false);
        if (sResponse.data.code == 0) {
            onSave(sResponse.data)
        }
        else {
            setMessage(sResponse.data.message)
        }
    };

    return (
        <>
            {!loading && <SelectUsers onlyOnce={false} onSave={handleSave} requestUrl={'/api.php?r=bx_messenger/search_users/Services&params='} initedData={initedData} />}
            {loading && <View className='w-full pt-8 items-center'><Loading /><Text className="pt-8 text-base text-neutral-600 dark:text-neutral-400 animate-pulse  font-medium">Creating new conversation, please wait...</Text></View>}
            <Row>
                <FormError errorText={message} />
            </Row>
        </>
    )
};

export function CreateConvoButton({ onSave, onShow, size = 'small', variant = 'secondary' }) {
    const { setBottomSheetData } = useBottomSheetData();

    const [showModal, setShowModal] = useState(false);
    const newConvo = () => {
        setShowModal(true);
        //  setBottomSheetData({ title: 'Add users to start messaging', content: <CreateConvo onSave={onSaveHandler} />,  showClose: true, snapPoints: ['75%', '90%'] });
    }

    const onSaveHandler = (data) => {
        setBottomSheetData(false);
        onSave(data);
    }

    let btn = null

    if (size == 'small')
        btn = <View key={`add-1`} ><Button startDecorator={"Plus"} variant={variant} rounded onPress={() => newConvo()} /></View>
    else {
        btn = <Button startDecorator={"Plus"} variant="secondary" title="Create your first conversation" rounded onPress={() => { newConvo(), onShow() }} />
    }
    return <>
        {btn}
        <Modal  title="Add users to start messaging" onVisible={!!showModal} onClose={() => { setShowModal(false) }} transparent={false}>
            <CreateConvo onSave={onSaveHandler} />
        </Modal>
    </>

}