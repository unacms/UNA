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
import { Theme, useThemeName } from 'app/design/theme';
import DasbordStatOld from 'app/components/elements/dashboard_stat_old';
import SvgFile from 'app/ui/molecules/svg-file';

function getCounter(num, icon = '', add = '', color = '') {

    if (!num) num = 0;
    let sColor = 'gray'

    if (num > 0) {
        sColor = 'green'
        if (icon == '')
            icon = 'ArrowBigUp';
    }
    if (num < 0) {
        sColor = 'red'
        if (icon == '')
            icon = 'ArrowBigDown';
    }

    return (
        <Row className={'mb-auto    text-' + sColor + '-800 bg-' + sColor + '-200 dark:bg-' + sColor + '-950 gap-x-1 py-1 px-2 rounded-full  mb-auto dark:text-' + sColor + '-200 '}>
            <Icon color={color} className={"text-" + sColor + "-600 dark:text-" + sColor + "-400"} icon={icon} size={16} />
            <Text className={"flex-none text-" + sColor + "-800 dark:text-" + sColor + "-200 text-xs"}>{num}{add}</Text>
        </Row>
    )
}

export default function PageLayout(props) {
    if (!appSetting('layout', 'user_remote_config'))
        return <DasbordStatOld {...props} />
    const isWeb = Platform.OS == 'web'
    const { t } = useTranslation();
    const { currentUser, setCurrentUser } = useCurrentUser()
    const { themeName, setThemeName } = useThemeName()

    const [showImage2, setShowImage2] = useState(false);


    let profile = null
    if (currentUser) {
        let dUser = Object.assign({}, currentUser)
        dUser.url_avatar = dUser.avatar
        profile = <Profile {...dUser} displayType="unit_wo_info" size="lg" />
    }
    if (!currentUser)
        return <></>

    const handleLang = async (item) => {
        i18n.changeLanguage(item);
        if (isWeb) {
            storageClear();
            storageSet('layout:lang', '', item, true);
            window.location.href = window.location.href
        }

        await fetcher('/api.php?r=system/get_page_by_request/TemplServicePages&params[]=home&lang=' + item);
    }

    const scheme = '';//useColorScheme();



    const handleTheme = async (item) => {
        if (isWeb) {
            const root = window.document.documentElement;
            if (item == 'auto')
                item = '';
            if (item == '')
                root.setAttribute('theme', scheme);
            else
                root.setAttribute('theme', item);
            setThemeName(item);
        }
        else {
            if (item == 'auto')
                item = null;
            Appearance.setColorScheme(item);
        }
    }
    const handleFormat = async (item) => {
        storageSet('layout:format', '', item, true);
        window.location.href = window.location.href
    }

    const currentTheme = !isWeb ? Appearance.getColorScheme() : storageGet('layout:theme', '', true) || 'auto';
    const currentFormat = storageGet('layout:format', '', true) || appSetting('layout', 'default_layout');

    return (
        <ScrollView className=''>
            { /*<Button title="Test bottomsheet"
             onPress={() => {setBottomSheetData({ title: 'Choose labels', showClose: true, content: <View className='h-24 w-full'><Text>TextTextTextText</Text></View> })}}
             
            ></Button>*/}
            <Modal id='file-preview2' title="VideoChat" onVisible={!!showImage2} onClose={() => { setShowImage2(null) }}>

            </Modal>
            <View className={appSetting('layout', 'max_width') + " w-full  mx-auto flex-col"}>
                <View className={appSetting('layout', 'max_width_block') + " w-full px-2 pb-1 pt-2 sm:p-2  mx-auto flex-col"}>
                    <Card rounded=" rounded-2xl " addClassName="  w-full p-4 flex-row ">
                        <View className="justify-center sm:justify-between flex-auto my-auto w-full items-center">
                            <View className="flex-row  w-full  items-center ">
                                <View className="flex-auto  ">

                                    <Link href={currentUser.url}>
                                        <View className="flex-row items-center ">
                                            {profile}
                                            <Text className="my-auto ml-3 text-neutral-800 hover:text-neutral-950 dark:text-neutral-200 hover:dark:text-neutral-50 text-lg font-semibold ">
                                                {currentUser.display_name}
                                            </Text>
                                        </View>
                                    </Link>
                                </View>
                                {currentUser.profiles_count > 1 && <View className="flex-none">
                                    <ProfileSwitcher hideTitle={true} >
                                        <Button variant="outline" startDecorator="RefreshCw" rounded />
                                    </ProfileSwitcher>
                                </View>}
                            </View>
                            <View className="flex-row  items-center gap-x-2 my-auto hidden">
                                {currentUser.profiles_count > 1 && <ProfileSwitcher hideTitle={true} >
                                    <Button variant="outline" startDecorator="RefreshCw" rounded />
                                </ProfileSwitcher>}
                                {
                                    appSetting('dashboard', 'langs').length > 1 && (
                                        <View><DropdownMenu
                                            items={appSetting('dashboard', 'langs').map(lang => ({
                                                id: lang,
                                                key: lang,
                                                name: lang,
                                                title: t('lang_' + lang)
                                            }))}
                                            onSelect={(oItem) => { handleLang(oItem.id) }}>

                                            <Button
                                                variant="outline"
                                                startDecorator="Languages"
                                                rounded
                                                align="left"
                                            />

                                        </DropdownMenu></View>)
                                }

                                {
                                    appSetting('dashboard', 'switch_theme') && (
                                        <View><DropdownMenu items={['dark', 'light', 'auto'].map(theme => ({
                                            key: theme,
                                            id: theme,
                                            name: theme,
                                            title: t('theme_' + theme)
                                        }))}
                                            onSelect={(oItem) => { handleTheme(oItem.id) }}>

                                            <Button
                                                variant="outline"
                                                startDecorator="Moon"
                                                rounded
                                                align="left"
                                            />

                                        </DropdownMenu></View>)
                                }


                                <Link href="/logout"><Button variant="outline" startDecorator="LogOut" rounded /></Link>
                            </View>

                        </View>
                    </Card>
                </View>
                <View className=" w-full ">

                    <ElementDashboardStat {...props} />
                    <Card addClassName=" shadow flex-col m-2 p-3 sm:p-4">



                        {

                            appSetting('dashboard', 'langs').length > 1 && (
                                <View className="mb-2">
                                    <DropdownMenu items={appSetting('dashboard', 'langs').map(lang => ({
                                        id: lang,
                                        key: lang,
                                        name: lang,
                                        title: t('lang_' + lang)
                                    }))}
                                        onSelect={(oItem) => { handleLang(oItem.id) }}>

                                        <Button
                                            variant="secondary"
                                            title={t('lang_' + i18n.language)}
                                            startDecorator="Languages"
                                            fullWidth
                                            size="sm"
                                            align="left"
                                        />
                                    </DropdownMenu>
                                </View>
                            )
                        }
                        {
                            appSetting('dashboard', 'switch_theme') && (
                                <View className="mb-2">

                                    <DropdownMenu items={['dark', 'light', 'auto'].map(theme => ({
                                        key: theme,
                                        id: theme,
                                        name: theme,
                                        title: t('theme_' + theme)
                                    }))}
                                        onSelect={(oItem) => { handleTheme(oItem.id) }}>

                                        <Button
                                            variant="secondary"
                                            title={t('theme_' + currentTheme)}
                                            startDecorator="Moon"
                                            fullWidth
                                            size="sm"
                                            align="left"
                                        />

                                    </DropdownMenu>
                                </View>)
                        }

                        {
                            appSetting('layout', 'avaliable_layouts').length > 1 && (

                                <View className='hidden sm:flex mb-2'>
                                    <DropdownMenu
                                        items={appSetting('layout', 'avaliable_layouts').map(lang => ({
                                            id: lang,
                                            key: lang,
                                            name: lang,
                                            title: t('format_' + lang)
                                        }))}
                                        onSelect={(oItem) => { handleFormat(oItem.id) }}>
                                        <Button
                                            variant="secondary"
                                            title={t('format_' + currentFormat)}
                                            startDecorator="Layout"
                                            fullWidth
                                            size="sm"
                                            align="left"
                                        />
                                    </DropdownMenu></View>)
                        }
                        <Link href="/logout"><Button
                            variant="secondary"
                            title={t("Sign out")}
                            startDecorator="LogOut"
                            fullWidth
                            size="sm"
                            align="left"
                        /></Link>
                    </Card>
                </View>

            </View>
        </ScrollView>
    )
}


function ElementDashboardStat(props) {

    const { colors } = Theme();
    const { t } = useTranslation();
    const [data, setData] = useState(props.data);
    const { currentUser, setCurrentUser } = useCurrentUser()
    useEffect(() => {
        const fetchData = async () => {
            const sResponse = await fetcher('/api.php?r=system/get_stat_block/TemplDashboardServices');
            setData(sResponse.data[0].data);
        };
        fetchData();
    }, []);

    const list = appSetting('dashboard', 'modules_list');
    const filtredData = data.modules.filter(item => list.includes(item.key));

    return (
        <>

            <Row className="flex-wrap px-1 sm:px-0 ">
                {filtredData.map((item, index) => {

                    if (item) {
                        if (item?.type != 'growth') {
                            return <View className="  w-1/2 lg:w-1/3 xl:w-1/4 p-1 sm:p-2 web:duration-300 " key={index}>
                                <Link href={item.url}>
                                    <Card rounded=" rounded-2xl " addClassName=" p-2 sm:p-6 sm:hover:scale-105 web:duration-300 w-full p-4 " >
                                        <Row className='space-x-1 w-full justify-between min-h-12'>
                                            {
                                                item.count > 0 ? <Text className=" text-3xl -translate-y-1 font-semibold flex-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white  ">
                                                    {item.count}
                                                </Text> : <View><Link href={item.add_url} emulate={true}><Button variant="outline" startDecorator="Plus" size="sm" rounded /></Link></View>
                                            }
                                            <View className="flex-none  text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white font-semibold ">
                                                <Icon icon={item.icon} width={24} height={24} color={colors.default} />
                                            </View>
                                        </Row>
                                        <Row className="w-full my-auto gap-x-2 ">

                                            <Text className=" text-lg flex-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white font-semibold ">
                                                {t(item.title)}
                                            </Text>
                                            <View className='my-auto' ><Text>{getCounter(item[item.action], item.action_icon, '', colors.default)}</Text></View>


                                        </Row>
                                    </Card>
                                </Link>
                            </View>;
                        }
                        return (
                            <View className=" w-1/2 lg:w-1/3 xl:w-1/4 p-1 sm:p-2 web:duration-300" key={index}>
                                <Link href={item.url} key={index}>
                                    <Card rounded=" rounded-2xl " addClassName="w-full p-2 sm:p-6 web:duration-300 sm:hover:scale-105 " margin="a">
                                        <Row className='space-x-1 w-full justify-between min-h-12'>
                                            <Text className=" text-3xl -translate-y-1 font-semibold flex-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white  ">
                                                {item.current}
                                            </Text>
                                            <View className="flex-none  text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white font-semibold ">
                                                <Icon icon={item.icon} width={24} height={24} color={colors.default} />
                                            </View>

                                        </Row>
                                        <Row className="w-full gap-x-2">

                                            <Text className=" text-lg flex-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white font-semibold  ">
                                                {t(item.title)}
                                            </Text>
                                            <View className='my-auto' ><Text>{getCounter(item[item.action], item.action_icon, '', colors.default)}</Text></View>

                                        </Row>
                                    </Card>
                                </Link>
                            </View>
                        )
                    }
                })}
            </Row>

            {data.manage.items.length > 0 && <Card addClassName='m-2 mb-1 p-3 sm:p-4'>

                <Text className="text-xl mb-3 text-neutral-800 dark:text-neutral-200 font-semibold">Admin Tools</Text>

                <View className="grid w-full grid-cols-1 gap-x-2 gap-y-1.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {data.manage.items.map((item2, index) => {
                        return <View className=" w-full min-w-[160px] max-w-xs " key={index}>
                            <Link href={item2.link}>
                                <Button variant="secondary" align="left" size="sm" fullWidth title={t(item2.title)} startDecorator={item2.icon} />
                            </Link>
                        </View>;
                    })}
                </View></Card>}

        </>
    )
}
