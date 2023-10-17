import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Button } from 'app/design/controls'
import Link from 'app/ui/atoms/link'

import { useCurrentUser } from 'app/context/user'
import Profile from 'app/ui/molecules/profile'
import { BlockByName } from 'app/components/block'
import { useState } from 'react';
import { Modal } from 'app/design/controls'
import Card from 'app/ui/molecules/card'
import { appSetting } from 'app/lib/util'
import JitSi from 'app/ui/molecules/jitsi'
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { menuItemsByName } from 'app/lib/util'
import i18n from 'i18next';
import { useTranslation } from 'react-i18next';
import { Appearance } from 'react-native';
import { Platform } from 'react-native'
import { storageSet, storageClear, storageGet } from 'app/lib/util'
import {useColorScheme} from 'react-native';
import { fetcher } from 'app/lib/fetcher';

export default function PageLayout(props) {
    const { t } = useTranslation();
    let { currentUser, setCurrentUser } = useCurrentUser()
    const [showImage, setShowImage] = useState(false);
    const [showImage2, setShowImage2] = useState(false);
    const [reload, setReload] = useState(false);
    let profile = null
    if (currentUser) {
        let dUser = Object.assign({}, currentUser)
        dUser.url_avatar = dUser.avatar
        profile = <Profile {...dUser} displayType="unit_wo_info" size="lg" />
    }
    if (!currentUser) 
        return <></>

    const handleLang =  async (item) => { 
        i18n.changeLanguage(item); 
        if(Platform.OS == 'web'){
            storageClear();
            storageSet('layout:lang', '', item, true)
        }
        const sResponse = await fetcher('/api.php?r=system/get_page_by_request/TemplServicePages&params[]=home&lang=' + item );
    }

    const scheme = '';//useColorScheme();

    const handleTheme =  async (item) => { 
        if(Platform.OS == 'web'){
            const root = window.document.documentElement;
            if (item == 'auto')
                item = '';
            if (item == '')
                root.setAttribute('data-mode', scheme);
            else
                root.setAttribute('data-mode', item);
            
            storageSet('layout:theme', '', item, true);
            location.reload();
        }
        else{
            Appearance.setColorScheme(item);
        }
    }
    let currentTheme =  storageGet('layout:theme','', true);
    if (!currentTheme)
        currentTheme = 'auto';

    return (
        <>
            <Modal id='file-preview' title = { t ("Your Profiles") } onVisible={!!showImage} onClose={() => {setShowImage(null)}}>
                <BlockByName name={props.blocks.profile_switcher} data={props.data} hideTitle={true} />
            </Modal>
            <Modal id='file-preview2' title="VideoChat" onVisible={!!showImage2} onClose={() => {setShowImage2(null)}}>
                
            </Modal>
            <View className="w-full p-2 max-w-screen-2xl mx-auto flex-col    ">
           
                <View className=" w-full p-2">
                    <Card rounded=" rounded-2xl " addClassName="w-full p-4 flex-row ">
                       
                    </Card>
                </View>
            </View>
        </>
    )
}
