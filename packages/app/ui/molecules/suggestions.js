import { View, ScrollView, Row, Pressable } from 'app/design/view'
import { Modal } from 'app/design/controls'
import { useState, useEffect, useContext } from 'react';
import { useCurrentUser } from 'app/context/user';
import { appSetting, storageSet, storageGet } from 'app/lib/util'
import Browse from 'app/components/elements/browse'
import { fetcher } from 'app/lib/fetcher';
import { useWindowDimensions } from 'react-native';
import { useBottomSheetData } from 'app/context/bottomsheet';
export default function Suggestions(props) {
    const windowWidth = useWindowDimensions().width;
    let { currentUser, setCurrentUser } = useCurrentUser();
    const [dataIndexModal, setDataIndexModal] = useState(0);
    const { setBottomSheetData } = useBottomSheetData();
    const [dataCount, setDataCount] = useState(0);
    let suggestionList = appSetting('suggestion', 'list');

    let suggestionListNames = suggestionList.map(item => item.name);
    let suggestionListShown = currentUser?.settings?.recomendation ? currentUser.settings.recomendation : [];

    if (!suggestionListShown)
        suggestionListShown = [];
    let suggestionListToShow = suggestionListNames.filter(item => !suggestionListShown.includes(item));
    let filteredList = suggestionList.filter(item => suggestionListToShow.includes(item.name));

    let dataModal = filteredList[0];

    const changeData = async (isSaveToStore) => {
        let a = dataIndexModal + 1;
        if (a >= filteredList.length)
            a = false;
        if (isSaveToStore) {
            suggestionListShown.push(filteredList[0].name)
            if (!currentUser.settings)
                currentUser.settings = {}
            currentUser.settings.recomendation = suggestionListShown
            let request_url = '/api.php?r=system/update_settings/TemplServiceProfiles&params[]={user_id}&params[]='.replace('{user_id}', currentUser.id) + JSON.stringify(currentUser.settings);
            const sResponse = await fetcher(request_url);
        }
        setDataCount(0)
        setDataIndexModal(a);
    };

    const onCloseEvent = () => {
        changeData(true)
    }

    useEffect(() => {
        const fetchData = async () => {
            let request_url = dataModal.request_url.replace('{user_id}', currentUser.id);
            const sResponse = await fetcher(request_url);
            if (sResponse.data[0].data.data.length == 0) {
                changeData(false);
            }
            else {
                setDataCount(1)
            }
        };
        if (currentUser && dataModal)
            fetchData();
    }, [currentUser, dataModal]);

    useEffect(() => {
        if (currentUser && currentUser.confirmed && dataModal && dataCount > 0) {
            if (dataModal.perLine > 1 && windowWidth < 1024)
                dataModal.perLine = 1
            let cnt = (
                <View className={(windowWidth > 1024 ? 'max-h-96' : '') + ''}>
                    <Browse sidebar={windowWidth > 1024 ? false : true} only_one_page={true} data={{ request_url: dataModal.request_url.replace('{user_id}', currentUser.id), "type": "obj_own_and_con", unit: "general-content-list" }} perLine={dataModal.perLine} unitType={dataModal.unitType} />
                </View>
            );
            setBottomSheetData({ title: dataModal.title, content: cnt, showClose: true, onClose: onCloseEvent, snapPoints: ['50%', '65%'] });
        }
    }, [dataCount, windowWidth]);

    return <></>
}