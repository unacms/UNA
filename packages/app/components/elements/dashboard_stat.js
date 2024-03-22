import { Icon } from 'app/ui/atoms/icon'
import Card from 'app/ui/molecules/card'
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Row, Pressable, ScrollView } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Button } from 'app/design/controls'
import Link from 'app/ui/atoms/link'
import { useCurrentUser } from 'app/context/user'
import Profile from 'app/ui/molecules/profile'
import ProfileSwitcher from 'app/components/elements/profile_switcher';
import { Modal } from 'app/design/controls'
import { appSetting } from 'app/lib/util'
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import i18n from 'i18next';
import { Appearance } from 'react-native';
import { Platform } from 'react-native'
import { storageSet, storageClear, storageGet } from 'app/lib/util'
import { fetcher } from 'app/lib/fetcher';
import Bluetooth from 'app/ui/molecules/bluetooth'

function getCounter(num, icon = '', add = '') {
    if (!num) num = 0;
    let sColor = 'gray'

    if (num > 0) {
        sColor = 'green'
        if (icon == '')
            icon = 'ArrowFatUp';
    }
    if (num < 0) {
        sColor = 'red'
        if (icon == '')
            icon = 'ArrowFatDown';
    }

    return (
        <Row className={'mb-auto    text-' + sColor + '-800 bg-' + sColor + '-200 dark:bg-' + sColor + '-950 gap-x-1 py-1 px-2 rounded-full mb-auto dark:text-' + sColor + '-200 '}>
            <Icon className={"text-" + sColor + "-600 dark:text-" + sColor + "-400"} icon={icon}  size={16} />
            <Text className={"flex-none text-" + sColor + "-800 dark:text-" + sColor + "-200 text-xs"}>{num}{add}</Text>
        </Row>
    )
}

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
            setCurrentUser(Object.assign({}, currentUser));
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
            setCurrentUser(Object.assign({}, currentUser));
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
        currentFormat = appSetting('layout', 'format');



    return (
        <ScrollView className=''>
            <Modal id='file-preview2' title="VideoChat" onVisible={!!showImage2} onClose={() => {setShowImage2(null)}}>
                
            </Modal>
            <View className={appSetting('layout', 'max_width') +" w-full  mx-auto flex-col"}>
                <View className={appSetting('layout', 'max_width_block') +" w-full p-2  mx-auto flex-col"}>
                    <Card rounded=" rounded-2xl " addClassName="  w-full p-4 flex-row ">
                        <View className="justify-center sm:justify-between flex-auto my-auto w-full items-center">
                            <View className="flex-row gap-x-2 items-center mb-4">
                                {profile}
                                <Link href={currentUser.url}>
                                    <Text className="my-auto text-neutral-800 hover:text-neutral-950 dark:text-neutral-200 hover:dark:text-neutral-50 text-lg font-semibold ">
                                        {currentUser.display_name}
                                    </Text>
                                </Link>
                            </View>
                            <View className="flex-row  items-center gap-x-2 my-auto lg:hidden">
                                {appSetting('layout', 'allow_switch_profile') && <ProfileSwitcher hideTitle={true} >
                                    <Button variant="outline" startDecorator="UserSwitch" tooltip={t('Switch profile')} rounded  />
                                </ProfileSwitcher>}
                                {
                                    appSetting('layout', 'switch_lang').length > 1 && (
                                        <View><DropdownMenu 
                                            items={appSetting('layout', 'switch_lang').map(lang => ({
                                                id: lang,
                                                key: lang,
                                                name: lang,
                                                title: t('lang_' + lang)
                                            }))} 
                                            onSelect={(oItem) => {handleLang(oItem.id)}}>
                                                <Pressable>
                                                    <Button
                                                        variant="outline"                                               
                                                        startDecorator="Translate"
                                                        rounded
                                                        align="left"
                                                    />
                                                </Pressable>
                                        </DropdownMenu></View>)
                                }
                                
                                {
                                    appSetting('layout', 'switch_theme') && (
                                        <View><DropdownMenu items={['dark', 'light','auto'].map(theme => ({
                                                key: theme,
                                                id: theme,
                                                name: theme,
                                                title: t('theme_' + theme)
                                            }))} 
                                            onSelect={(oItem) => {handleTheme(oItem.id)}}>
                                                <Pressable>
                                                    <Button
                                                        variant="outline"
                                                        startDecorator="Moon"
                                                        rounded
                                                        align="left"
                                                    />
                                                </Pressable>
                                        </DropdownMenu></View>)
                                }
                               
                                
                                <Link href="/logout"><Button variant="outline" startDecorator="SignOut" rounded /></Link>
                            </View>
                            <View className="flex-row flex-wrap gap-x-2 gap-y-2 hidden justify-center lg:flex">
                                {appSetting('layout', 'allow_switch_profile') && <ProfileSwitcher hideTitle={true} ><Button
                                    variant="text"
                                    title={ t("Switch Profile") }
                                    startDecorator="UserSwitch"
                                    fullWidth
                                    align="left"
                                /></ProfileSwitcher>}
                            
                               
                                {
                                    appSetting('layout', 'switch_lang').length > 1 && (
                                        <DropdownMenu items={appSetting('layout', 'switch_lang').map(lang => ({
                                                id: lang,
                                                key: lang,
                                                name: lang,
                                                title: t('lang_' + lang)
                                            }))} 
                                            onSelect={(oItem) => {handleLang(oItem.id)}}>
                                            <Pressable>
                                                <Button
                                                    variant="text"
                                                    title= {t('lang_' + i18n.language)}
                                                    startDecorator="Translate"
                                                    fullWidth
                                                    align="left"
                                            /></Pressable>
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
                                                <Pressable>
                                                    <Button
                                                        variant="text"
                                                        title= {t('theme_' + currentTheme)}
                                                        startDecorator="Moon"
                                                        fullWidth
                                                        align="left"
                                                    />
                                                </Pressable>
                                        </DropdownMenu>)
                                }
                                {
                                    appSetting('layout', 'format_list').length > 1 && (
                                        <View><DropdownMenu 
                                            items={appSetting('layout', 'format_list').map(lang => ({
                                                id: lang,
                                                key: lang,
                                                name: lang,
                                                title: t('format_' + lang)
                                            }))} 
                                            onSelect={(oItem) => {handleFormat(oItem.id)}}>
                                                <Pressable>
                                                    <Button
                                                        variant="text"
                                                        title= {t('format_' + currentFormat)}
                                                        startDecorator="Layout"
                                                        fullWidth
                                                        align="left"
                                                    />
                                                </Pressable>
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
                { appSetting('layout', 'bluetooth') && Platform.OS != 'web' && <View className=" w-full  p-2">
                    <Card rounded=" rounded-2xl " addClassName="w-full p-4 flex-row ">
                        <Bluetooth/>
                    </Card>
                </View> }
                <View className=" w-full ">
                    <ElementDashboardStat {...props}/>
                </View>
            </View>
        </ScrollView>
    )
}


function ElementDashboardStat(props) {
    const { t } = useTranslation();
    const [data, setData] = useState(props.data);
    let { currentUser, setCurrentUser } = useCurrentUser()
    useEffect(() => {
        const fetchData = async () => {
            const sResponse = await fetcher('/api.php?r=system/get_stat_block/TemplDashboardServices');
            setData(sResponse.data[0].data);
        };
        fetchData();
    }, []);

    let menu = appSetting('menu_items', 'menu_dashboard')
    
    let menu_manage = appSetting('menu_items', 'menu_dashboard_manage')
    if (!currentUser?.moderator)
        menu_manage = [];

    return (
        <>
            <Row className="flex-wrap flex-auto mb-auto ">
                {menu.map((item2, index) => {
                    let item = data[item2.key];
                    if (item) {
                        if (item?.type != 'growth') {
                            return <View className="  w-1/2 lg:w-1/3 xl:w-1/4 p-2 duration-300 " key={index}>
                                <Link href={item2.link}>
                                    <Card rounded=" rounded-2xl " addClassName="sm:hover:scale-105 w-full p-4 " >
                                        <Row className='space-x-1 w-full justify-between'>
                                            {
                                                item.count > 0 ? <Text className=" text-3xl -translate-y-1 font-semibold flex-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white  ">
                                                    {item.count}
                                                </Text> : <View><Link href={item2.link2} emulate={true}><Button variant="outline" startDecorator="Plus" size="sm" rounded /></Link></View>
                                            }
                                            {getCounter(item[item2.action], item2.action_icon)}
                                        </Row>
                                        <Row className="w-full my-auto gap-x-2 ">

                                            <Text className=" sm:text-lg flex-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white font-semibold mt-2">
                                                {t(item2.title)}
                                            </Text>
                                            <View className="flex-none text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white font-semibold ">
                                                <Icon icon={item2.icon} width={24} height={24} />
                                            </View>
                                        </Row>
                                    </Card>
                                </Link>
                            </View>;
                        }
                        return (
                            <View className=" w-1/2 lg:w-1/3  xl:w-1/4 p-2 duration-300 " key={index}>
                                <Link href={item2.link} key={index}>
                                    <Card rounded=" rounded-2xl " addClassName="w-full p-4  sm:hover:scale-105 " margin="a">
                                        <Row className=''>
                                            <Text className=" text-3xl -translate-y-1 font-semibold flex-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white  ">
                                                {item.current}
                                            </Text>
                                            {getCounter(item.growth, '', '%')}

                                        </Row>
                                        <Row className="w-full gap-x-2">

                                            <Text className=" sm:text-lg flex-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white font-semibold mt-2 ">
                                                {t(item2.title)}
                                            </Text>
                                            <View className="flex-none text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white font-semibold ">
                                                <Icon icon={item2.icon} width={24} height={24} />
                                            </View>
                                        </Row>
                                    </Card>
                                </Link>
                            </View>
                        )
                    }
                })}
            </Row>

            {menu_manage.length > 0 && <View className='mt-8'>
                <View className='ml-4 mb-2'>
                    <Text className="text-2xl  text-neutral-800 dark:text-neutral-200 font-semibold">Admin Tools</Text>
                </View>
                <Row className="flex-wrap flex-auto mb-auto ">
                    {menu_manage.map((item2, index) => {
                        return <View className="  w-1/2 lg:w-1/3 xl:w-1/4 p-2 duration-300 " key={index}>
                            <Link href={item2.link}>
                                <Card rounded=" rounded-2xl " addClassName="w-full p-4 gap-y-2 sm:hover:scale-105" >

                                    <Row className="w-full my-auto gap-x-2 items-center">
                                        <View className="flex-none text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white font-semibold ">
                                            <Icon icon={item2.icon} width={24} height={24} />
                                        </View>
                                        <Text className=" sm:text-lg flex-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white font-semibold ">
                                            {t(item2.title)}
                                        </Text>

                                    </Row>
                                </Card>
                            </Link>
                        </View>;
                    })}
                </Row></View>}
        </>
    )
}
