import { View, Row, Pressable, ScrollView } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Button } from 'app/design/controls'
import Link from 'app/ui/atoms/link'

import { useCurrentUser } from 'app/context/user'
import Profile from 'app/ui/molecules/profile'
import { BlockByName } from 'app/components/block'
import ProfileSwitcher from 'app/components/elements/profile_switcher';
import { useState } from 'react';
import { Modal } from 'app/design/controls'
import Card from 'app/ui/molecules/card'
import { appSetting } from 'app/lib/util'
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import i18n from 'i18next';
import { useTranslation } from 'react-i18next';
import { Appearance } from 'react-native';
import { Platform } from 'react-native'
import { storageSet, storageClear, storageGet } from 'app/lib/util'
import { fetcher } from 'app/lib/fetcher';
//import Bluetooth from 'app/ui/molecules/bluetooth'

export default function PageLayout(props) {
    
    const { t } = useTranslation();
    let { currentUser, setCurrentUser } = useCurrentUser()
    
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
            storageClear();
            storageSet('layout:lang', '', item, true);
           // setCurrentUser(Object.assign({}, currentUser));
            window.location.href = window.location.href
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
                root.setAttribute('theme', scheme);
            else
                root.setAttribute('theme', item);
            
            storageSet('layout:theme', '', item, true);
            //location.reload();
            //setCurrentUser(Object.assign({}, currentUser));
        }
        else{
            Appearance.setColorScheme(item);
        }
    }
    const handleFormat =  async (item) => { 
        storageSet('layout:format', '', item, true);
        window.location.href = window.location.href
    }
    

    let currentTheme =  storageGet('layout:theme','', true);
    if (!currentTheme)
        currentTheme = 'auto';

    let currentFormat =  storageGet('layout:format','', true);
    if (!currentFormat)
        currentFormat = appSetting('layout', 'default_layout');



    return (
        <ScrollView className=''>
            <Modal id='file-preview2' title="VideoChat" onVisible={!!showImage2} onClose={() => {setShowImage2(null)}}>
                
            </Modal>
            <View className={appSetting('layout', 'max_width') +" w-full p-2  mx-auto flex-col"}>
                <View className={appSetting('layout', 'max_width_block') +" w-full p-2  mx-auto flex-col"}>
                    <Card rounded=" rounded-2xl " addClassName="  w-full p-4 flex-row ">
                        <View className="justify-center sm:justify-between flex-auto  my-auto w-full items-center">
                            <View className="flex-row gap-x-2 my-auto items-center mb-4 sm:mb-0">
                                {profile}
                                <Link href={currentUser.url}>
                                    <Text className="my-auto text-neutral-800 hover:text-neutral-950 dark:text-neutral-200 hover:dark:text-neutral-50 text-lg font-semibold ">
                                        {currentUser.display_name}
                                    </Text>
                                </Link>
                            </View>
                            <View className="flex-row  items-center gap-x-2 my-auto lg:hidden">
                                <ProfileSwitcher hideTitle={true} >
                                    <Button variant="outline" startDecorator="UserSwitch" tooltip={t('Switch profile')} rounded  />
                                </ProfileSwitcher>
                                {
                                    appSetting('dashboard', 'langs').length > 1 && (
                                        <View><DropdownMenu 
                                            items={appSetting('dashboard', 'langs').map(lang => ({
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
                                             
                                        </DropdownMenu></View>)
                                }
                                
                                {
                                    appSetting('dashboard', 'switch_theme') && (
                                        <View><DropdownMenu items={['dark', 'light','auto'].map(theme => ({
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
                                        
                                        </DropdownMenu></View>)
                                }
                               
                                
                                <Link href="/logout"><Button variant="outline" startDecorator="SignOut" rounded /></Link>
                            </View>
                            <View className="flex-row gap-x-2 hidden lg:flex">
                                <ProfileSwitcher hideTitle={true} ><Button
                                    variant="text"
                                    title={ t("Switch Profile") }
                                    startDecorator="UserSwitch"
                                    fullWidth
                                    align="left"
                                /></ProfileSwitcher>
                            
                               
                                {
                                    appSetting('dashboard', 'langs').length > 1 && (
                                        <DropdownMenu items={appSetting('dashboard', 'langs').map(lang => ({
                                                id: lang,
                                                key: lang,
                                                name: lang,
                                                title: t('lang_' + lang)
                                            }))} 
                                            onSelect={(oItem) => {handleLang(oItem.id)}}>
                                           
                                                <Button
                                                    variant="text"
                                                    title= {t('lang_' + i18n.language)}
                                                    startDecorator="Translate"
                                                    fullWidth
                                                    align="left"
                                            />
                                        </DropdownMenu>)
                                }
                                {
                                    appSetting('dashboard', 'switch_theme') && (
                                        <DropdownMenu items={['dark', 'light','auto'].map(theme => ({
                                                key: theme,
                                                id: theme,
                                                name: theme,
                                                title: t('theme_' + theme)
                                            }))} 
                                            onSelect={(oItem) => {handleTheme(oItem.id)}}>
                                              
                                                    <Button
                                                        variant="text"
                                                        title= {t('theme_' + currentTheme)}
                                                        startDecorator="Moon"
                                                        fullWidth
                                                        align="left"
                                                    />
                                           
                                        </DropdownMenu>)
                                }
                                {
                                    appSetting('layout', 'avaliable_layouts').length > 1 && (
                                        <View><DropdownMenu 
                                            items={appSetting('layout', 'avaliable_layouts').map(lang => ({
                                                id: lang,
                                                key: lang,
                                                name: lang,
                                                title: t('format_' + lang)
                                            }))} 
                                            onSelect={(oItem) => {handleFormat(oItem.id)}}>
                                               
                                                    <Button
                                                        variant="text"
                                                        title= {t('format_' + currentFormat)}
                                                        startDecorator="Layout"
                                                        fullWidth
                                                        align="left"
                                                    />
                                              
                                        </DropdownMenu></View>)
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
                { /*appSetting('native', 'bluetooth') && Platform.OS != 'web' && <View className=" w-full  p-2">
                    <Card rounded=" rounded-2xl " addClassName="w-full p-4 flex-row ">
                        <Bluetooth/>
                    </Card>
                </View>*/ }
                <View className=" w-full ">
                    <BlockByName name={props.blocks.stat_block} data={props.data} hideTitle={true} />
                </View>
            </View>
        </ScrollView>
    )
}
