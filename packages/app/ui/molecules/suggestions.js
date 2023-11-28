import { View, ScrollView, Row, Pressable } from 'app/design/view'
import { Modal } from 'app/design/controls'
import { useState, useEffect } from 'react';
import { useCurrentUser } from 'app/context/user';
import { appSetting, storageSet, storageGet } from 'app/lib/util'
import Browse from 'app/components/elements/browse'
import { fetcher } from 'app/lib/fetcher';
import { useWindowDimensions} from 'react-native';

export default function Suggestions(props) {
    const windowWidth = useWindowDimensions().width;
    let { currentUser, setCurrentUser } = useCurrentUser();
    const [dataIndexModal, setDataIndexModal] = useState(0);
    const [dataCount, setDataCount] = useState(0);
    let suggestionList = appSetting('suggestion', 'list');

    let suggestionListNames = suggestionList.map(item => item.name);
    let suggestionListShown = currentUser?.settings?.recomendation ? currentUser.settings.recomendation : [];

    if (!suggestionListShown)
        suggestionListShown = [];
    let suggestionListToShow = suggestionListNames.filter(item => !suggestionListShown.includes(item));
    let filteredList = suggestionList.filter(item => suggestionListToShow.includes(item.name));

    let dataModal = filteredList[0];
    useEffect(() => {
        const fetchData = async () => {
                let request_url = dataModal.request_url.replace('{user_id}', currentUser.id);
                const sResponse = await fetcher(request_url);
                if (sResponse.data[0].data.data.length == 0){
                    shangeData(false);
                }
                else{
                    setDataCount(1)
                }
        };
        if (currentUser && dataModal)
            fetchData();
    }, [currentUser, dataModal]);


    if (!currentUser)
        return <></>


    const shangeData  = async (isSaveToStore) => { 
        //console.log("shangeData", shangeData, suggestionListShown)
        let a = dataIndexModal + 1;
        if (a>=filteredList.length)
            a = false;
        if (isSaveToStore){
            suggestionListShown.push(filteredList[0].name)
            if (!currentUser.settings)
                currentUser.settings = {}
            currentUser.settings.recomendation = suggestionListShown
            let request_url = '/api.php?r=system/update_settings/TemplServiceProfiles&params[]={user_id}&params[]='.replace('{user_id}', currentUser.id)+JSON.stringify(currentUser.settings);
            const sResponse = await fetcher(request_url);
        }
        setDataCount(0)
        setDataIndexModal(a);
    };


    if (dataModal && dataCount > 0){
        if(dataModal.perLine > 1 && windowWidth < 1024)
            dataModal.perLine = 1
        return (
            <View>
                <Modal title={dataModal.title} onVisible={dataIndexModal <= filteredList.length} outerClickClose={false} onClose={() => shangeData(true)}>
                    <Browse only_one_page={true} height={400} data={{request_url : dataModal.request_url.replace('{user_id}', currentUser.id), "type" : "obj_own_and_con", unit:"general-content-list"}} perLine={dataModal.perLine} unitType={dataModal.unitType}/>
                </Modal>
            </View>
        )
    }

    return <></>
}