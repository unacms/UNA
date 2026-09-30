import { View } from 'app/design/view'
import { useState, useEffect } from 'react';
import { useCurrentUser } from 'app/context/user';
import { appSetting } from 'app/lib/util'
import Browse from 'app/components/elements/browse'
import { fetcher } from 'app/lib/fetcher';
import { useFetch } from 'app/lib/hooks/use-fetch';
import { useBottomSheetData } from 'app/context/bottomsheet';
import { useIsDesktop } from 'app/context/measure';

export default function Suggestions(props) {
    const { currentUser } = useCurrentUser();
    const isDesktop = useIsDesktop();
    const { setBottomSheetData } = useBottomSheetData();
    // Bumped when a suggestion is dismissed — re-renders onto the next one.
    const [, setDismissed] = useState(0);
    let suggestionList = appSetting('suggestion', 'list');

    let suggestionListNames = suggestionList.map(item => item.name);
    let suggestionListShown = currentUser?.settings?.recomendation ? currentUser.settings.recomendation : [];

    if (!suggestionListShown)
        suggestionListShown = [];
    let suggestionListToShow = suggestionListNames.filter(item => !suggestionListShown.includes(item));
    let filteredList = suggestionList.filter(item => suggestionListToShow.includes(item.name));

    let dataModal = filteredList[0];
    const requestUrl = currentUser && dataModal ? dataModal.request_url.replace('{user_id}', currentUser.id) : null;

    // Only show a suggestion whose list isn't empty.
    const { data: sResponse } = useFetch(requestUrl);
    const hasItems = (sResponse?.data?.[0]?.data?.data?.length ?? 0) > 0;

    const onCloseEvent = async () => {
        suggestionListShown.push(filteredList[0].name)
        if (!currentUser.settings)
            currentUser.settings = {}
        currentUser.settings.recomendation = suggestionListShown
        setDismissed((n) => n + 1);
        let request_url = '/api.php?r=system/update_settings/TemplServiceProfiles&params[]={user_id}&params[]='.replace('{user_id}', currentUser.id) + JSON.stringify(currentUser.settings);
        await fetcher(request_url);
    }

    useEffect(() => {
        if (currentUser && currentUser.confirmed && dataModal && hasItems) {
            if (dataModal.perLine > 1 && !isDesktop)
                dataModal.perLine = 1
            let cnt = (
                <View className={(isDesktop ? 'max-h-96' : '') + ''}>
                    <Browse sidebar={isDesktop ? false : true} only_one_page={true} data={{ request_url: requestUrl, "type": "obj_own_and_con", unit: "general-content-list" }} perLine={dataModal.perLine} unitType={dataModal.unitType} />
                </View>
            );
            setBottomSheetData({ title: dataModal.title, content: cnt, showClose: true, onClose: onCloseEvent, snapPoints: ['50%', '65%'] });
        }
    }, [hasItems, dataModal, isDesktop]);

    return <></>
}
