import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { Button, Input, Modal } from 'app/design/controls';
import { fetcher } from 'app/lib/fetcher';
import { useState } from 'react';
import { setClipboard } from 'app/lib/util'
import { APP_URL } from 'app/config';
import { BlockWrapper } from 'app/components/block-wrapper'
import { useTranslation } from 'react-i18next'

export default function ElementInvite({ data, blockWrapperProps }) {
    const { t } = useTranslation();
    const [showModal, setShowModal] = useState(false);
    const handleClick = async () => {
        const sResponse = await fetcher('/api.php?r=' + data.request_url);
        setShowModal(sResponse.data.link)
    }

    const handleCopy = async () => {
        setClipboard(APP_URL + showModal);
    }

    return (
        <BlockWrapper {...blockWrapperProps}>
            <Modal id={'file-preview'} title={t('Invitation link')} onVisible={!!showModal} onClose={() => { setShowModal(null) }}>
                <Row className='gap-x-4'>
                    <Input value={APP_URL + showModal} />
                    <Button variant="text" size="base" rounded startDecorator="Clipboard" onPress={() => handleCopy()} />
                </Row>
            </Modal>
            <View className="p-4">
                <Text className="text-card-foreground text-center">{t('You can invite your friends to join. You have {{count}} invites to share.', { count: data.remain })}</Text>
                <View className='mx-auto pt-4'>
                    <Button variant="default" size="base" rounded title={"Get invite link"} onPress={() => handleClick()} />
                </View>
            </View>
        </BlockWrapper>
    );
}
