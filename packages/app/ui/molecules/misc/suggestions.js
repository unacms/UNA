import { View } from 'app/design/view'
import { useEffect } from 'react';
import { useCurrentUser } from 'app/context/user';
import { appSetting } from 'app/lib/util'
import Browse from 'app/components/elements/browse'
import { fetcher } from 'app/lib/fetcher';
import { useFetch } from 'app/lib/hooks/use-fetch';
import { useBottomSheetData } from 'app/context/bottomsheet';
import { useIsDesktop } from 'app/context/measure';

export default function Suggestions(props) {
    const { currentUser, setCurrentUser } = useCurrentUser();
    const isDesktop = useIsDesktop();
    const { setBottomSheetData } = useBottomSheetData();
    const suggestionList = appSetting('suggestion', 'list');

    const suggestionListShown = currentUser?.settings?.recomendation || [];
    const dataModal = suggestionList.find(item => !suggestionListShown.includes(item.name));
    const requestUrl = currentUser && dataModal ? dataModal.request_url.replace('{user_id}', currentUser.id) : null;

    // Only show a suggestion whose list isn't empty.
    const { data: sResponse } = useFetch(requestUrl);
    const hasItems = (sResponse?.data?.[0]?.data?.data?.length ?? 0) > 0;

    // Mark as shown through the user store (never mutate currentUser): the store
    // update re-renders onto the next suggestion; then persist it on the server.
    const onCloseEvent = async () => {
        const settings = {
            ...currentUser.settings,
            recomendation: [...suggestionListShown, dataModal.name],
        };
        setCurrentUser({ settings });
        const request_url = '/api.php?r=system/update_settings/TemplServiceProfiles&params[]={user_id}&params[]='.replace('{user_id}', currentUser.id) + JSON.stringify(settings);
        await fetcher(request_url);
    }

    useEffect(() => {
        if (currentUser && currentUser.confirmed && dataModal && hasItems) {
            const perLine = dataModal.perLine > 1 && !isDesktop ? 1 : dataModal.perLine;
            let cnt = (
                <View className={(isDesktop ? 'max-h-96' : '') + ''}>
                    <Browse sidebar={isDesktop ? false : true} only_one_page={true} data={{ request_url: requestUrl, "type": "obj_own_and_con", unit: "general-content-list" }} perLine={perLine} unitType={dataModal.unitType} />
                </View>
            );
            setBottomSheetData({ title: dataModal.title, content: cnt, showClose: true, onClose: onCloseEvent, snapPoints: ['50%', '65%'] });
        }
    }, [hasItems, dataModal, isDesktop]);

    return <></>
}
