import { View, ScrollView, Row, Pressable } from 'app/design/view'
import { Modal } from 'app/design/controls'
import { useState, useEffect } from 'react';
import { useCurrentUser } from 'app/context/user';
import { appSetting, storageSet, storageGet } from 'app/lib/util'
import Browse from 'app/components/elements/browse'


export default function Suggestions(props) {
    let { currentUser, setCurrentUser } = useCurrentUser();

    if (!currentUser)
        return <></>

    let suggestionList = appSetting('suggestion', 'list');
    let suggestionListNames = suggestionList.map(item => item.name);
    let suggestionListShown = storageGet('suggestion:list', '', true);
    if (!suggestionListShown)
        suggestionListShown = [];
    let suggestionListToShow = suggestionListNames.filter(item => !suggestionListShown.includes(item));
    let filteredList = suggestionList.filter(item => suggestionListToShow.includes(item.name));

    const [dataIndexModal, setDataIndexModal] = useState(0);
    
    const shangeData = () => { 
        let a = dataIndexModal + 1;
        if (a>=filteredList.length)
            a = false;
        suggestionListShown.push(filteredList[0].name)
        storageSet('suggestion:list', '', suggestionListShown, true);
        
        setDataIndexModal(a);
    };
    let dataModal = filteredList[0];

    if (dataModal)
        return (
            <View>
                <Modal title={dataModal.title} onVisible={dataIndexModal <= filteredList.length} outerClickClose={false} onClose={() => shangeData()}>
                    <Browse height={400} data={{request_url : dataModal.request_url.replace('{user_id}', currentUser.id), "type" : "obj_own_and_con", unit:"general-content-list"}} perLine={dataModal.perLine} unitType={dataModal.unitType}/>
                </Modal>
            </View>
        )

    return <></>
}