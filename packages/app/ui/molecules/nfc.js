import { View, ScrollView, Row, Pressable } from 'app/design/view'
import { Modal } from 'app/design/controls'
import { useState, useEffect } from 'react';
import { useCurrentUser } from 'app/context/user';
import { appSetting, storageSet, storageGet } from 'app/lib/util'
import Browse from 'app/components/elements/browse'
import { fetcher } from 'app/lib/fetcher';
import { useWindowDimensions} from 'react-native';
import { Text } from 'app/design/typography'
import { Button } from 'app/design/controls'
import NfcManager, { Ndef } from 'react-native-nfc-manager';
import Profile from 'app/ui/molecules/profile';

export default function Nfc(props) {

    let { currentUser, setCurrentUser } = useCurrentUser();
    const [showModal, setShowModal] = useState(false);

    async function writeUserId() {
        try {
            const bytes = Ndef.encodeMessage([Ndef.textRecord(currentUser.id)]);
            await NfcManager.writeNdefMessage(bytes);
            setShowModal(true);
            console.log('NFC Tag written successfully!');

        } catch (err) {
            console.warn('Error writing NFC tag:', err);
        }
    }
    
    
    function readUserId() {

        /*const handleTag = async () => {
            let userId = 26
            let request_url = '/api.php?r=system/befriend/TemplServiceProfiles&params[]=' + userId;
            const sResponse = await fetcher(request_url);
            setShowModal(sResponse.data);
        }
        handleTag();*/

        NfcManager.registerTagEvent(tag => {
            const handleTag = async (tag) => {
                let userId = Ndef.text.decodePayload(tag.ndefMessage[0].payload);
                let request_url = '/api.php?r=system/befriend/TemplServiceProfiles&params[]=' + userId;
                  const sResponse = await fetcher(request_url);
                setShowModal(sResponse.data);
            }
            handleTag(tag);
        }).catch(err => console.warn(err));
    }

    return (
        <Row className='justify-between'>
            <Button onPress={() => writeUserId()} title="Share My ID" />
            <Button onPress={() => readUserId()} title="Scan ID" />
            <Modal onVisible={!!showModal} title="You have a new friend!" outerClickClose={true} >
                <View className='pb-4'>
                    <Profile { ...showModal } displaySize="xl" />
                </View>
                <Button onPress={() => setShowModal(false)} title="OK" />
            </Modal>
        </Row>
    );
}