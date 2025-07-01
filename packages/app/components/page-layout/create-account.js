import { View, Row, Pressable, ScrollView } from 'app/design/view'
import { BlockByName, DataByName } from 'app/components/block'
import { Text } from 'app/design/typography'
import Card from 'app/components/card'
import { Button } from 'app/design/controls'
import Link from 'app/ui/atoms/link'
import { Platform } from 'react-native'
import { appStatic } from 'app/lib/app-static'
import KbAvoidingView from 'app/ui/atoms/kb-avoiding-view'
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import AuthPanel from 'app/ui/molecules/auth'
import * as Haptics from 'expo-haptics'
import { appSetting } from 'app/lib/util'
import ScrollList from 'app/ui/molecules/scroll_list'
import SvgFile from 'app/ui/molecules/svg-file';
import MenuFooter from 'app/components/nav/menu-footer';
import AnimatedView from 'app/ui/atoms/animated-view';

const TABLET_MODE_FROM = appSetting('layout', 'tablet_mode_from');

export default function PageLayout(props) {
    const { t } = useTranslation()
    const joinData = DataByName(props.data, props.blocks.form_join)
    const isAllowJoin = joinData.content[0].type == 'form'
    const isWeb = Platform.OS === 'web'
    const refer = useRef();

    const content = isWeb ? (
        <View className={`flex-col justify-center min-h-[100vh] w-full pt-16 ${TABLET_MODE_FROM}:pt-0`}>
            <View className="w-full lg:flex-row mx-auto my-auto  max-w-[1440px]">
                <View className="my-auto flex-col items-center lg:items-start flex-auto p-4 sm:p-8 xl:p-16" accessible={true}>
                    {appStatic('join_text')}
                    <AnimatedView direction="up" className="flex-auto hidden lg:flex items-center lg:items-start gap-y-4 sm:gap-y-6 max-w-md sm:max-w-lg lg:max-w-3xl">
                        <Text
                            accessible={true}
                            accessibilityRole="heading"
                            aria-level={1}
                            className="text-4xl lg:text-5xl xl:text-6xl text-center lg:text-start tracking-tight font-bold text-neutral-800 dark:text-neutral-200 text-pretty"
                        >
                            {isAllowJoin
                                ? t('create_account_page_title')
                                : t('create_account_page_title_request_invite')}
                        </Text>
                        <Text
                            accessible={true}
                            accessibilityRole="text"
                            className="text-base lg:text-lg xl:text-xl text-center lg:text-start text-neutral-600 dark:text-neutral-400 text-pretty"
                        >
                            {isAllowJoin
                                ? t('create_account_page_text')
                                : t('create_account_page_text_request_invite')}
                        </Text>
                    </AnimatedView>
                </View>
                <View className="max-w-xl w-full flex-auto mx-auto p-4 sm:p-8 my-auto">
                    <AnimatedView>
                        <View className="relative">
                            <View className="absolute top-4 flex shadow rounded-3xl w-full h-full bg-neutral-500 dark:bg-black blur-lg opacity-20 dark:opacity-50"></View>
                             <Card rounded="rounded-3xl" margin="p-4 sm:p-6" addClassName="border border-white overflow-hidden dark:border-bdrcard-d gap-y-6">
                                <View className="flex-col flex-auto gap-y-2 justify-center ">
                                    <Text className="text-xl sm:text-2xl text-center lg:text-left leading-[none] tracking-tight font-semibold text-neutral-800 dark:text-neutral-200">
                                        {t('create_account_page_caption')}
                                    </Text>
                                    <Text className="text-sm sm:text-base text-center lg:text-left text-neutral-500">
                                        {t('create_account_page_already_have')} <Link href="/login">{t('create_account_page_sign_in')}</Link>.
                                    </Text>
                                </View>
                                {!isAllowJoin && (
                                    <BlockByName
                                        name={props.blocks.form_invitation}
                                        data={props.data}
                                        formProps={{
                                            auto_focus: true,
                                            hide_errors: true,
                                            button_full_width: true,
                                        }}
                                    />
                                )}
                                {isAllowJoin && (
                                    <BlockByName
                                        name={props.blocks.form_join}
                                        data={props.data}
                                        formProps={{
                                            auto_focus: true,
                                            hide_errors: true,
                                            button_full_width: true,
                                        }}
                                    />
                                )}
                                <View className="flex items-center justify-center gap-y-2 border-t border-bdr dark:border-bdr-d mt-4 pt-4">
                                    <AuthPanel />
                                </View>
                            </Card>
                        </View>
                    </AnimatedView>

                </View>
            </View>
            <MenuFooter cntClasses="w-full flex-row flex-wrap opacity-80 h-16 items-center justify-center" />
        </View>
    ) : (
        <View className="flex-col justify-center w-full p-4">
            <Card>
                <View className="flex-col lg:hidden pb-4">
                    <Text className="text-xl sm:text-2xl text-center lg:text-left leading-[none] tracking-tight font-semibold text-neutral-800 dark:text-neutral-200">
                        Create an account
                    </Text>
                </View>
                {!isAllowJoin && (
                    <BlockByName
                        name={props.blocks.form_invitation}
                        data={props.data}
                        formProps={{
                            auto_focus: true,
                            hide_errors: true,
                            button_full_width: true,
                        }}
                    />
                )}
                {isAllowJoin && (
                    <BlockByName
                        name={props.blocks.form_join}
                        data={props.data}
                        formProps={{
                            auto_focus: true,
                            hide_errors: true,
                            button_full_width: true,
                        }}
                    />
                )}
                <View className="flex items-center justify-center pt-4 mt-4 gap-y-2 border-t border-bdr dark:border-bdr-d">
                    <Link className="w-full" href="/login" haptics="Medium">
                        <Button
                            title="Login with email"
                            size="base"
                            fullWidth
                        />
                    </Link>
                    <AuthPanel />
                </View>
            </Card>
            <MenuFooter cntClasses="w-full flex-row flex-wrap opacity-80 h-16 items-center justify-center" />
        </View>
    );

    return (
        <KbAvoidingView style={{ flex: 1 }} offset={isWeb ? undefined : 0}>
            {isWeb ? (
                <ScrollList
                    refer={refer}
                    content={content}
                    pageData={props.data}
                    headerHeight={0}
                    contentType="ScrollList"
                />
            ) : (
                <View className="flex-1 bg-primary-50 dark:bg-primary-950">
                    <ScrollList
                        refer={refer}
                        content={content}
                        pageData={props.data}
                        headerHeight={0}
                        contentType="ScrollList"
                    />
                </View>
            )}
        </KbAvoidingView>
    )
}