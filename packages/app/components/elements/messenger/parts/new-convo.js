import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { fetcher } from 'app/lib/fetcher';
import React, { useContext, useState  } from 'react';
import { Button } from 'app/design/controls'
import { useBottomSheetData } from 'app/context/bottomsheet';
import {SelectUsers} from 'app/components/form-fields/initial_members';
import Loading from 'app/ui/atoms/loading'

export default function CreateConvo ({ onSave, initedData=[], convoId }) {
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
            {loading && <View className='w-full pt-8 items-center'><Loading/><Text className="pt-8 text-base text-neutral-600 dark:text-neutral-400 animate-pulse  font-medium">Creating new conversation, please wait...</Text></View>}
            <Row>
                <Text className="ml-0.5 mt-0.5 label-text-alt text-sm text-red-600 animate-pulse dark:text-red-400 font-medium">{message}</Text>
            </Row>
        </>
    )
};

export function CreateConvoButton({onSave, onShow, size ='small', variant = 'outline'}) {
    const { setBottomSheetData } = useBottomSheetData();
    const newConvo = () => {
        setBottomSheetData({ title: 'Add users to start messaging', content: <CreateConvo onSave={onSaveHandler} />, showClose: true, snapPoints: ['85%', '85%'] });
    }

    const onSaveHandler = (data) => {
        setBottomSheetData(false);
        onSave(data);
    }

    if (size == 'small')
        return <View key={`add-1`} ><Button startDecorator={"Plus"} variant={variant} rounded onPress={() => newConvo()} /></View>

    return <Button startDecorator={"Plus"} variant="primary" title="Create your first conversation" rounded  onPress={() => {newConvo(), onShow()}} />

}