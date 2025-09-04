import { View, Row } from 'app/design/view'
import { Modal } from 'app/design/controls'
import { useState, useEffect } from 'react';
import { useCurrentUser } from 'app/context/user';
import { fetcher } from 'app/lib/fetcher';
import { Text } from 'app/design/typography'
import { Button } from 'app/design/controls'
import NfcManager, { Ndef, NfcTech, } from 'react-native-nfc-manager';
import Profile from 'app/ui/molecules/profile';
import { Theme } from 'app/design/theme';

export default function Nfc(props) {
    const { colors } = Theme();
    let { currentUser, setCurrentUser } = useCurrentUser();
    const [showModal, setShowModal] = useState(false);
    const [hasNfc, setHasNFC] = useState(null);
    const [isEnabled, setIsEnabled] = useState(false);
    const [nfcStatus, setNfcStatus] = useState('');
    const toggleSwitch = () => setIsEnabled(previousState => !previousState);

    useEffect(() => {
        const checkIsSupported = async () => {
            const deviceIsSupported = await NfcManager.isSupported()
            setHasNFC(deviceIsSupported)
            if (deviceIsSupported) {
            //    await NfcManager.start()
            }
        }
        checkIsSupported()
    }, []);

    function readNdef1() {
        
        setNfcStatus('read')
    }

    function writeUserId1(){
        setNfcStatus('write')
    }

    async function readNdef() {
        try {
            console.log('READ START');
           
            await NfcManager.requestTechnology(NfcTech.Ndef);
            const tag = await NfcManager.getTag();
            let userId = Ndef.text.decodePayload(tag.ndefMessage[0].payload); //MAIN ERROR IN THIS LINE no ndefMessage
            //let userId=37;
            let request_url = '/api.php?r=system/befriend/TemplServiceProfiles&params[]=' + userId;
            const sResponse = await fetcher(request_url);
            setShowModal(sResponse.data);
        } catch (ex) {
            console.log('ERROR READ', ex);
        } finally {
            setNfcStatus('')
        }
    }

    async function writeUserId() {
        try {
            console.log('WRITE START');
            await NfcManager.requestTechnology(NfcTech.Ndef);
            const bytes = Ndef.encodeMessage([Ndef.textRecord(currentUser.id)]);
            if (bytes) {
                await NfcManager.ndefHandler
                    .writeNdefMessage(bytes);
            }
        } catch (ex) {
            console.log('ERROR WRITE', ex);
        } finally {
            setNfcStatus('')
        }
    }

    useEffect(() => {  
        async function reset() {

            await NfcManager.cancelTechnologyRequest();  
          /*  setTimeout(() => {
                console.log('RESET'); 
            }, 5000);*/
        }
        reset();
        //NfcManager.cancelTechnologyRequest();    
        if (nfcStatus === 'read') {     
            readNdef();
        }
        if (nfcStatus === 'write') {
            writeUserId();
        }       
    }, [nfcStatus]); 

    if (hasNfc === null) {
        return (
            <View></View>
        )
    }

    if (!hasNfc) {
        return (
            <View>
                <Text>NFC not supported</Text>
            </View>
        )
    }


    return (
        <Row className='justify-between w-full '>
            <Button disabled={nfcStatus=='write'} startDecorator="Megaphone" onPress={() => writeUserId1()} title="Share  Profile" />
            
                <Button disabled={nfcStatus=='read'} startDecorator="SquareUser" onPress={() => readNdef1()} title="Scan Profile" />

           

            <Modal onVisible={!!showModal} title="You have a new friend!" >
                <View className='pb-4'>
                    <Profile {...showModal} displaySize="xl" />
                </View>
                <Button onPress={() => setShowModal(false)} title="OK" />
            </Modal>
        </Row>
    );
}