import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { fetcher } from 'app/lib/fetcher';
import { useFetch } from 'app/lib/hooks/use-fetch';
import { useMemo, useState } from 'react';
import { Modal, NeoButton } from 'app/design/controls'
import { useBottomSheetData } from 'app/context/bottomsheet';
import { SelectUsers } from 'app/components/form-fields/initial-members';
import Loading from 'app/ui/atoms/loading'
import { FormError } from 'app/components/form-fields/_field';
import { useTranslation } from 'react-i18next'

const AGENTS_FETCH_OPTIONS = { silent: true, maxAttempts: 1 };

function parseAgentsList(payload) {
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload)) return payload;
    return [];
}

export default function CreateConvo({ onSave, initedData = [], convoId }) {
    const { t } = useTranslation();
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    // Optional extra suggestions — quiet, single attempt; cached between openings.
    const { data: agentsPayload } = useFetch(
        '/api.php?r=bx_messenger/get_agents/Services&params=' + JSON.stringify({}),
        { fetchOptions: AGENTS_FETCH_OPTIONS }
    );
    const agents = useMemo(() => parseAgentsList(agentsPayload), [agentsPayload]);
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
            <Row>
                <FormError errorText={message} />
            </Row>
            {!loading && <SelectUsers onlyOnce={false} onSave={handleSave} requestUrl={'/api.php?r=bx_messenger/search_users/Services&params='} initedData={initedData} extraSuggestions={agents} />}
            {loading && <View className='w-full pt-8 items-center'>
                <Loading />
                <Text className="pt-8 text-base text-muted-foreground  animate-pulse  font-medium">{t('messenger_creating')}</Text>
            </View>
            }

        </>
    )
};

export function CreateConvoButton({ onSave, onShow, size = 'small', variant = 'secondary', style }) {
    const { t } = useTranslation();
    const { setBottomSheetData } = useBottomSheetData();

    const [showModal, setShowModal] = useState(false);
    const newConvo = () => {
        setShowModal(true);
        //  setBottomSheetData({ title: 'Add users to start messaging', content: <CreateConvo onSave={onSaveHandler} />,  showClose: true, snapPoints: ['75%', '90%'] });
    }

    const onSaveHandler = (data) => {
        setShowModal(false);
        setBottomSheetData(false);
        onSave(data);
    }

    let btn = null
    const iconStyle = style ?? 'bordered';

    if (size == 'small')
        btn = <View key={`add-1`}><NeoButton style={iconStyle} selected={showModal} selectedState="pressedToggle" controlSize="regular" borderShape="circle" image="Plus" accessibilityLabel={t('messenger_add_users')} onPress={() => newConvo()} /></View>
    else {
        btn = <NeoButton style="bordered" controlSize="regular" image="Plus" label={t('messenger_create_first')} onPress={() => { newConvo(); onShow(); }} />
    }
    return <>
        {btn}
        <Modal title={t('messenger_add_users')} onVisible={!!showModal} onClose={() => { setShowModal(false) }} transparent={false}>
            <CreateConvo onSave={onSaveHandler} />
        </Modal>
    </>

}