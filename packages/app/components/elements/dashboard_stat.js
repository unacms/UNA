import { Icon } from 'app/ui/atoms/icon'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
    
} from 'app/ui/molecules/card'
import Badge from 'app/ui/molecules/badge';
import { Block, BlockHeader, BlockContent, BlockFooter, BlockTitle, BlockDescription, BlockIcon, BlockName, BlockActions } from 'app/ui/molecules/page-block'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View, Row, Pressable, ScrollView } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Button, Modal } from 'app/design/controls'
import Link from 'app/ui/atoms/link'
import { useCurrentUser } from 'app/context/user'
import Profile from 'app/ui/molecules/profile'
import ProfileSwitcher from 'app/components/elements/profile_switcher'
import { appSetting } from 'app/lib/util'
import DropdownMenu from 'app/ui/atoms/dropdown-menu'
import i18n from 'i18next'
import { Appearance, Platform } from 'react-native'
import { storageSet, storageClear, storageGet } from 'app/lib/util'
import { fetcher } from 'app/lib/fetcher'
import { Theme } from 'app/design/theme'
import DasbordStatOld from 'app/components/elements/dashboard_stat_old'
import ApiPerformanceReport from 'app/ui/molecules/api-performance-report'
import ThemeCompatibilityTest from 'app/ui/molecules/nativewindui'
import { useDensitySwitcher } from 'app/ui/atoms/density-switcher'
import { useLayoutSettings } from 'app/context/layout-settings';

function getCounter(num, icon = '', add = '', color = '') {
    if (!num) num = 0
    let sColor = 'gray'

    if (num > 0) {
        sColor = 'green'
        if (icon == '') icon = 'ArrowBigUp'
    }
    if (num < 0) {
        sColor = 'red'
        if (icon == '') icon = 'ArrowBigDown'
    }

    return (
        <Row
            className={
                'mb-auto    text-' +
                sColor +
                '-800 bg-' +
                sColor +
                '-200 dark:bg-' +
                sColor +
                '-950 gap-x-1 py-1 px-2 rounded-full  mb-auto dark:text-' +
                sColor +
                '-200 '
            }
        >
            <Icon
                color={color}
                className={
                    'text-' + sColor + '-600 dark:text-' + sColor + '-400'
                }
                icon={icon}
                size={16}
            />
            <Text
                className={
                    'flex-none text-' +
                    sColor +
                    '-800 dark:text-' +
                    sColor +
                    '-200 text-xs'
                }
            >
                {num}
                {add}
            </Text>
        </Row>
    )
}

export default function PageLayout(props) {
    if (!appSetting('layout', 'user_remote_config'))
        return <DasbordStatOld {...props} />
    const { layoutSettings, themeName, setThemeName, setLayoutName, layoutName, lang, setLang, langCode, setDensity } = useLayoutSettings();
    console.log("layoutSettings", lang, langCode)
    const isWeb = Platform.OS == 'web'
    const { t } = useTranslation()
    const { currentUser } = useCurrentUser()
    const { currentDensity, densityOptions } = useDensitySwitcher()
    const langs = appSetting('dashboard', 'langs');
    let profile = null
    if (currentUser) {
        let dUser = Object.assign({}, currentUser)
        dUser.url_avatar = dUser.avatar
        profile = <Profile {...dUser} displayType="unit_wo_info" size="lg" />
    }
    if (!currentUser) return <></>


    return (
        <ScrollView>
            <Block className='u-max-width-block'>
                <BlockHeader>
                    <BlockIcon>
                        <Profile
                                {...currentUser}
                                url_avatar={currentUser.avatar}
                                displayType="unit_wo_info"
                                displaySize="xl"
                            />
                    </BlockIcon>
                    <BlockName>
                            <BlockTitle>
                                        <Text>
                                            {currentUser.display_name}
                                        </Text>
                            </BlockTitle>
                            <BlockDescription >
                                <Badge variant="secondary">
                                {currentUser.membership_name}
                                </Badge>
                            </BlockDescription>
                    </BlockName>
                    <BlockActions>
                        {currentUser.profiles_count > 1 && (
                            <ProfileSwitcher hideTitle={true}>
                                <Button
                                    variant="secondary"
                                    startDecorator="RefreshCw"
                                    
                                    rounded
                                />
                            </ProfileSwitcher>
                        )}
                    </BlockActions>
                </BlockHeader>
                <BlockContent>                   
                    <ElementDashboardStat {...props} />
                    <View className="flex-row flex-wrap gap-sm">
                        {langs.length > 1 && (
                            <View className="w-full max-w-sm flex-1 min-w-[160px]">
                                <DropdownMenu
                                    items={langs.map(
                                        (lang) => ({
                                            id: lang,
                                            key: lang,
                                            name: lang,
                                            title: t('lang_' + lang),
                                        })
                                    )}
                                    onSelect={(oItem) => {
                                        setLang(oItem.id)
                                    }}
                                >
                                    <Button
                                        variant="secondary"
                                        title={t('lang_' + lang)}
                                        startDecorator="Languages"
                                        fullWidth
                                        align="left"
                                        
                                    />
                                </DropdownMenu>
                            </View>
                        )}
                        {appSetting('dashboard', 'switch_theme') && (
                            <View className="w-full max-w-sm flex-1 min-w-[160px]">
                                <DropdownMenu
                                    items={['dark', 'light', 'auto'].map(
                                        (theme) => ({
                                            key: theme,
                                            id: theme,
                                            name: theme,
                                            title: t('theme_' + theme),
                                        })
                                    )}
                                    onSelect={(oItem) => {
                                        setThemeName(oItem.id)
                                    }}
                                >
                                    <Button
                                        variant="secondary"
                                        title={t('theme_' + themeName)}
                                        startDecorator="Moon"
                                        fullWidth
                                        align="left"
                                        
                                    />
                                </DropdownMenu>
                            </View>
                        )}

                        {/* UI Density Switcher */}
                        {appSetting('layout', 'ui_density_switcher') && (
                            <View className="w-full max-w-sm flex-1 min-w-[160px]">
                                <DropdownMenu
                                    items={densityOptions}
                                    onSelect={(option) => setDensity(option.id)}
                                >
                                    <Button
                                        variant="secondary"
                                         title={currentDensity?.title}
                                        startDecorator={currentDensity?.icon}
                                        fullWidth
                                        align="left"
                                        
                                    />
                                </DropdownMenu>
                            </View>
                        )}

                        {appSetting('layout', 'avaliable_layouts').length >
                            1 && (
                            <View className="w-full max-w-sm flex-1 min-w-[160px]">
                                <DropdownMenu
                                    items={appSetting(
                                        'layout',
                                        'avaliable_layouts'
                                    ).map((lang) => ({
                                        id: lang,
                                        key: lang,
                                        name: lang,
                                        title: t('format_' + lang),
                                    }))}
                                    onSelect={(oItem) => {
                                        setLayoutName(oItem.id)
                                    }}
                                >
                                    <Button
                                        variant="secondary"
                                        title={t('format_' + layoutName)}
                                        startDecorator="Layout"
                                        fullWidth
                                        align="left"
                                        
                                    />
                                </DropdownMenu>
                            </View>
                        )}
                    </View>
                </BlockContent>
                <BlockFooter>
                    <Button
                        variant="outline"
                        title={t('Sign out')}
                        startDecorator="LogOut"
                        fullWidth
                        size="base"
                        
                        as={Link}
                        href="/logout"
                    />
                </BlockFooter>
            </Block>
        </ScrollView>
    )
}

function ElementDashboardStat(props) {
    const { colors } = Theme()
    const { t } = useTranslation()
    const [data, setData] = useState(props.data)
    const { currentUser, setCurrentUser } = useCurrentUser()
    const [showApiPerformance, setShowApiPerformance] = useState(false)
    const [showThemeTest, setShowThemeTest] = useState(false)
    useEffect(() => {
        const fetchData = async () => {
            const sResponse = await fetcher(
                '/api.php?r=system/get_stat_block/TemplDashboardServices'
            )
            setData(sResponse.data[0].data)
        }
        fetchData()
    }, [])

    const list = appSetting('dashboard', 'modules_list')
    const filtredData = data.modules.filter((item) => list.includes(item.key))

    return (
        <>
            <Modal
                id="api-performance-modal"
                title="API Performance Report"
                onVisible={!!showApiPerformance}
                onClose={() => setShowApiPerformance(false)}
                maxWidth="max-w-4xl"
                maxHeight="max-h-[90vh]"
                scrollable={true}
            >
                <ScrollView className="max-h-[70vh] p-4">
                    <ApiPerformanceReport />
                </ScrollView>
            </Modal>

            <Modal
                id="theme-test-modal"
                title="Theme Compatibility Test"
                onVisible={!!showThemeTest}
                onClose={() => setShowThemeTest(false)}
                maxWidth="max-w-4xl"
                maxHeight="max-h-[90vh]"
                scrollable={true}
            >
                <ScrollView className="max-h-[70vh]">
                    <ThemeCompatibilityTest />
                </ScrollView>
            </Modal>

            <Row className="flex-wrap gap-md">
                {filtredData.map((item, index) => {
                    if (item) {
                        if (item?.type != 'growth') {
                            return (
                                <View
                                    className="  w-full  flex-1 min-w-[160px]"
                                    key={index}
                                >
                                    <Link href={item.url}>
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>
                                                    <View className="flex-row w-full justify-between">
                                                   
                                                {item.count > 0 ? (
                                                    
                                                            <Text className="flex-auto">
                                                            {item.count}
                                                        </Text>
                                                        
                                                    ) : (
                                                        <View>
                                                            <Link
                                                                href={
                                                                    item.add_url
                                                                }
                                                                emulate={true}
                                                            >
                                                                <Button
                                                                    variant="outline"
                                                                    startDecorator="Plus"
                                                                    size="xs"
                                                                    rounded
                                                                />
                                                            </Link>
                                                        </View>
                                                    )}
                                                   
                                                    
                                                    <Icon
                                                            icon={item.icon}
                                                            width={20}
                                                            height={20}
                                                            color={
                                                                colors.default
                                                            }
                                                        />
                                                    </View>
                                                </CardTitle>
                                                <CardDescription>
                                                    {item.title}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                             
                                                <Text>
                                                            {getCounter(
                                                                item[
                                                                    item.action
                                                                ],
                                                                item.action_icon,
                                                                '',
                                                                colors.default
                                                            )}
                                                        </Text>
                                                 
                                            </CardContent>
                                        </Card>
                                    </Link>
                                </View>
                            )
                        }
                        return (
                            <View
                                className=" w-full  flex-1 min-w-[160px]"
                                key={index}
                            >
                                <Link href={item.url} key={index}>
                                    <Card>
                                        <CardHeader>
                                            <Icon
                                                icon={item.icon}
                                                width={24}
                                                height={24}
                                                color={colors.default}
                                            />
                                            <CardTitle>
                                                {item.current}
                                            </CardTitle>
                                            <CardDescription>
                                                {item.title}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                           
                                                
                                                    <Text>
                                                        {getCounter(
                                                            item[item.action],
                                                            item.action_icon,
                                                            '',
                                                            colors.default
                                                        )}
                                                    </Text>
                                            
                                        </CardContent>
                                    </Card>
                                </Link>
                            </View>
                        )
                    }
                })}
            </Row>
            {data.manage.items.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Admin Tools
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                       
                        <View className="grid w-full grid-cols-1 gap-x-2 gap-y-1.5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                            {currentUser?.id && (
                                <>
                                    <View className=" w-full min-w-[160px]  ">
                                        <Button
                                            variant="secondary"
                                            align="left"
                                            size="sm"
                                            fullWidth
                                            title={t('API Performance')}
                                            startDecorator="Activity"
                                            onPress={() =>
                                                setShowApiPerformance(true)
                                            }
                                        />
                                    </View>
                                    <View className=" w-full min-w-[160px]  ">
                                        <Button
                                            variant="secondary"
                                            align="left"
                                            size="sm"
                                            fullWidth
                                            title="Theme Test"
                                            startDecorator="Palette"
                                            onPress={() =>
                                                setShowThemeTest(true)
                                            }
                                        />
                                    </View>
                                </>
                            )}
                            {data.manage.items.map((item2, index) => {
                                return (
                                    <View
                                        className=" w-full min-w-[160px]  "
                                        key={index}
                                    >
                                        <Link href={item2.link}>
                                            <Button
                                                variant="secondary"
                                                align="left"
                                                size="sm"
                                                fullWidth
                                                title={t(item2.title)}
                                                startDecorator={item2.icon}
                                            />
                                        </Link>
                                    </View>
                                )
                            })}
                        </View>
                    </CardContent>
                </Card>
            )}
        </>
    )
}
