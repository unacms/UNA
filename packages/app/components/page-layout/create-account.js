import { View, Row } from 'app/design/view'
import { BlockByName, DataByName, BlockByData } from 'app/components/block'
import { Text } from 'app/design/typography'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from 'app/ui/molecules/card'
import Link from 'app/ui/atoms/link'
import { Platform } from 'react-native'
import { appStatic } from 'app/lib/app-static'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import AuthPanel from 'app/ui/molecules/auth'
import { appSetting } from 'app/lib/util'
import ScrollList from 'app/ui/molecules/scroll_list'
import MenuFooter from 'app/components/nav/menu-footer';
import AnimatedView from 'app/ui/atoms/animated-view';

const isWeb = Platform.OS === 'web'

function PageContent({ children }) {
    const { t } = useTranslation()
    return (
        <Card padding="p-0 pb-4" >
            <AnimatedView direction="up" delay={300}>
                <Card padding="p-6 ">
                    <CardHeader>
                        <CardTitle>
                            {t('create_account_page_caption')}
                        </CardTitle>
                        {isWeb && <CardDescription>
                            {t('create_account_page_caption2')}

                        </CardDescription>}
                    </CardHeader>
                    <CardContent>
                        {children}
                    </CardContent>
                    <CardFooter>
                        <AuthPanel createAccountLink={false} loginLink={!isWeb} showSeparator={true} />
                    </CardFooter>
                </Card></AnimatedView>
            <CardFooter>
                <Row className="text-center flex-none mx-auto text-base items-center gap-1">
                    <Text className="text-muted-foreground text-base">{t('create_account_page_already_have')}</Text>
                    <Link
                        variant="primary"
                        size="md"
                        href="/login"
                        haptics="Medium"
                    >
                        {t('create_account_page_sign_in')}
                    </Link>
                </Row>
            </CardFooter>
        </Card>
    );
}

export default function PageLayout(props) {
    const { t } = useTranslation()
    const refer = useRef();

    const joinData = DataByName(props.data, props.blocks.form_join)
    const inviteData = DataByName(props.data, props.blocks.form_invitation)

    const isAllowJoin = joinData?.content.some(item => item.type === "form")
    const hasForm = isAllowJoin || inviteData?.content.some(item => item.type === "form");

    const Block = <BlockByData
        url={props.data.url}
        uri={props.data.uri}
        contentOnly={true}
        data={joinData || inviteData}
        formProps={{ hide_errors: true, button_full_width: true }}
    />

    if (!hasForm) {
        return Block
    }

    const content = isWeb ? (
        <View className={`flex-col justify-center web:min-h-[calc(100vh-16rem)] w-full `}>
            <View className="w-full lg:flex-row mx-auto my-auto max-w-7xl">
                <View className="my-auto flex-col lg:w-1/2 items-center lg:items-start flex-auto p-4 sm:p-8 xl:p-16 mt-16 lg:mt-0" accessible={true}>
                    {appStatic('join_text')}
                    <AnimatedView direction="up" className="flex-auto flex items-center lg:items-start gap-y-4 sm:gap-y-6 max-w-md sm:max-w-lg lg:max-w-3xl">
                        <Text
                            accessible={true}
                            accessibilityRole="heading"
                            aria-level={1}
                            className="text-3xl sm:text-4xl lg:text-5xl text-center lg:text-start tracking-tight font-bold text-neutral-800 dark:text-neutral-200 text-pretty"
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
                <View className="max-w-xl w-full lg:w-1/2 flex-auto mx-auto p-4 sm:p-8 my-auto">
                    <AnimatedView direction="up" delay={200}>
                        <View className="relative">
                            <PageContent >{Block}</PageContent>
                        </View>
                    </AnimatedView>
                </View>
            </View>
            <MenuFooter
                cntClasses="flex w-full items-center border-t border-border/60 justify-center flex-row flex-wrap gap-2 p-3 mt-3"
                variant="ghost"
                size="sm"
                itemClassName="text-sm p-1"

            />
        </View>
    ) : (
        <View className="w-full flex-col lg:flex-row gap-y-4 mx-auto p-3 pt-16">
            <View className="my-auto flex-col items-center lg:items-start flex-auto " >
                {appStatic('join_text')}
            </View>
            <PageContent >{Block}</PageContent>
            <MenuFooter
                cntClasses="flex w-full items-center border-t border-border/60 justify-center flex-row flex-wrap gap-2 p-3 mt-3"
                variant="ghost"
                size="sm"
                itemClassName="text-sm p-1"

            />
        </View>
    );

    return (
        <ScrollList
            refer={refer}
            content={content}
            pageData={props.data}
            headerHeight={isWeb ? 0 : 64}
            contentType="ScrollList"
        />
    )
}