import { Text} from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { Button, Input, InputRounded, Modal } from 'app/design/controls';
import { fetcher } from 'app/lib/fetcher';
import { useState } from 'react';
import { appSetting, setClipboard } from 'app/lib/util'

export default function ElementInvite({data}) {
    const [showModal, setShowModal] = useState(false);
   
    const handleClick = async () => {
        const sResponse = await fetcher('/api.php?r='+data.request_url);
        console.log(sResponse)
        setShowModal(sResponse.data.link)
    }

    const handleCopy = async () => {
        setClipboard(appSetting("urls", "site") + showModal);
    }

    return (
        <>
            <Modal id={'file-preview'} title="Invitation link" onVisible={!!showModal} onClose={() => {setShowModal(null)}}>
                <Row className='gap-x-4'>
                    <Input value={appSetting("urls", "site") + showModal}/>
                    <Button variant="text" size="base" rounded  startDecorator="Clipboard" onPress={() => handleCopy()} />
                </Row>
            </Modal>
            <View className="p-4">
                    <Text className="text-black dark:text-white text-center">You can invite your friends to join. You have {data.remain} invites to share.</Text>
                    <View className='mx-auto pt-4'>
                        <Button variant="default" size="base" rounded  title={"Get invite link"} onPress={() => handleClick()} />
                    </View>
            </View>
        </>
    );
}
