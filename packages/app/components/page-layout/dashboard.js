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
import { storageSet } from 'app/lib/util'
import {useColorScheme} from 'react-native';
import { fetcher } from 'app/lib/fetcher';

export default function PageLayout(props) {
    const { t } = useTranslation();
    let { currentUser, setCurrentUser } = useCurrentUser()
    const [showImage, setShowImage] = useState(false);
    const [showImage2, setShowImage2] = useState(false);
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
            storageSet('layout:lang', '', item, true)
        }
        const sResponse = await fetcher('/api.php?r=system/get_page_by_request/TemplServicePages&params[]=home&lang=' + item );
    }
    const handleTheme =  async (item) => { 
        console.log(Appearance.getColorScheme());
        if(Platform.OS == 'web'){
            const root = window.document.documentElement;
            if (item == 'auto')
                item = '';
            root.setAttribute('data-mode', item);
            storageSet('layout:theme', '', item, true)
        }
        else{
            Appearance.setColorScheme(item);
        }
    }

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
                        <View className="justify-between flex-auto gap-x-2 flex-row my-auto">
                            <View className="flex-row gap-x-2 my-auto    items-center">
                                {profile}
                                <Link href={currentUser.url}>
                                    <Text className="my-auto text-neutral-800 hover:text-neutral-950 dark:text-neutral-200 hover:dark:text-neutral-50 text-lg font-semibold ">
                                        {currentUser.display_name}
                                    </Text>
                                </Link>
                            </View>
                            <View className="flex-row gap-x-2 my-auto lg:hidden">
                                {appSetting('layout', 'allow_switch_profile') && <Button variant="outline" startDecorator="UserSwitch" rounded onPress = {() => setShowImage(true)} />}
                                {
                                    appSetting('layout', 'switch_lang').length > 1 && (
                                        <DropdownMenu 
                                            items={appSetting('layout', 'switch_lang').map(lang => ({
                                                id: lang,
                                                key: lang,
                                                name: lang,
                                                title: t('lang_' + lang)
                                            }))} 
                                            onSelect={(oItem) => {handleLang(oItem.id)}}>
                                                <Button
                                                    variant="outline"                                               
                                                    startDecorator="Translate"
                                                    rounded
                                                    align="left"
                                                />
                                        </DropdownMenu>)
                                }
                                {
                                    appSetting('layout', 'switch_theme') && (
                                        <DropdownMenu items={['dark', 'light','auto'].map(theme => ({
                                                key: theme,
                                                id: theme,
                                                name: theme,
                                                title: t('theme_' + theme)
                                            }))} 
                                            onSelect={(oItem) => {handleTheme(oItem.id)}}>
                                                <Button
                                                    variant="outline"
                                                    startDecorator="Moon"
                                                    rounded
                                                    align="left"
                                                />
                                        </DropdownMenu>)
                                }
                               
                                
                                <Link href="/logout"><Button variant="outline" startDecorator="SignOut" rounded /></Link>
                            </View>
                            <View className="flex-row gap-x-2 hidden lg:flex">
                                {appSetting('layout', 'allow_switch_profile') && <Button
                                    variant="text"
                                    title={ t("Switch Profile") }
                                    startDecorator="UserSwitch"
                                    fullWidth
                                    onPress = {() => setShowImage(true)}
                                    align="left"
                                />}
                            
                               
                                {
                                    appSetting('layout', 'switch_lang').length > 1 && (
                                        <DropdownMenu items={appSetting('layout', 'switch_lang').map(lang => ({
                                                id: lang,
                                                key: lang,
                                                name: lang,
                                                title: t('lang_' + lang)
                                            }))} 
                                            onSelect={(oItem) => {handleLang(oItem.id)}}>
                                        <Button
                                                
                                                variant="text"
                                                title= {t("Language")}
                                                startDecorator="Translate"
                                                fullWidth
                                                align="left"
                                            />
                                        </DropdownMenu>)
                                }
                                {
                                    appSetting('layout', 'switch_theme') && (
                                        <DropdownMenu items={['dark', 'light','auto'].map(theme => ({
                                                key: theme,
                                                id: theme,
                                                name: theme,
                                                title: t('theme_' + theme)
                                            }))} 
                                            onSelect={(oItem) => {handleTheme(oItem.id)}}>
                                                <Button
                                                    variant="text"
                                                    title= {t("Dark Mode")}
                                                    startDecorator="Moon"
                                                    fullWidth
                                                    align="left"
                                                />
                                        </DropdownMenu>)
                                }
                                <Link href="/logout"><Button
                                    variant="text"
                                    title= {t("Sign out")}
                                    startDecorator="SignOut"
                                    fullWidth
                                    align="left"
                                /></Link>
                            </View>
                        </View>
                    </Card>
                </View>
                <View className=" w-full">
                    <BlockByName name={props.blocks.stat_block} data={props.data} hideTitle={true} />
                </View>
                <View className=" w-full p-2">
                    <Card rounded=" rounded-2xl " addClassName="w-full p-4 flex-row ">
                        <View className="justify-between flex-auto gap-x-2 flex-row my-auto">
                            <View className="flex-row gap-x-2 lg:flex">
                                <Button
                                    variant="text"
                                    title= {t("Meet *alpha")}
                                    startDecorator="UsersFour"
                                    fullWidth
                                    onPress = {() => setShowImage2(true)}
                                    align="left"
                                />
                            </View>
                        </View>
                    </Card>
                </View>
            </View>
        </>
    )
}
