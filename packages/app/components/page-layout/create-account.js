import { View, Row } from 'app/design/view'
import { BlockByName, DataByName, BlockByData } from 'app/components/block'
import { Text, H1, H2 } from 'app/design/typography'
import {
    Card,
    CardHeader,
    CardDescription,
    CardContent,
    CardFooter,
    CardTitle,
} from 'app/ui/molecules/card'
import Link from 'app/ui/atoms/link'
import { Platform } from 'react-native'
import { appStatic } from 'app/lib/app-static'
import { useTranslation } from 'react-i18next'
import AuthPanel from 'app/ui/molecules/auth'
import { appSetting } from 'app/lib/util'
import MenuFooter from 'app/components/nav/menu-footer'
import AnimatedView from 'app/ui/atoms/animated-view'
import Page from 'app/ui/molecules/page'
import Html from 'app/ui/atoms/html';

const isWeb = Platform.OS === 'web'

function PageContent({ children }) {
    const { t } = useTranslation()
    return (
        <View className="w-full justify-center lg:w-1/2 p-4 sm:p-8 md:p-12 p-6 ">

            <AnimatedView className="gap-4" direction="up" delay={200}>
                <Card padding="p-0 gap-6 max-w-xl w-full mx-auto rounded-3xl">
                    <CardHeader className="px-6 pt-5">
                        <CardTitle className="text-center lg:text-start">{t('create_account_page_caption')}</CardTitle>

                        <CardDescription className="text-center lg:text-start">
                            {t('create_account_page_caption2')}
                        </CardDescription>

                    </CardHeader>
                    <CardContent className="px-6">
                        <View className="max-w-96 w-full mx-auto">
                            {children}
                            <AuthPanel showSeparator={true} createAccountLink={false} loginLink={false} />
                        </View>
                    </CardContent>
                    <CardFooter>
                        <Row className=" mx-auto gap-1 justify-center items-center text-center">
                            <Text className="text-secondary-foreground text-base ">
                                {t('create_account_page_already_have')}
                            </Text>
                            <Link
                                variant="accent"
                                size="md"
                                href="/login"
                                haptics="Medium"
                            >
                                {t('create_account_page_sign_in')}
                            </Link>
                        </Row>
                        
                        <Html customClassName="text-xs text-center" data={t('create_account_page_terms')}/>
                    </CardFooter>
                </Card>


            </AnimatedView>
        </View>
    )
}

export default function PageLayout({ data, blocks }) {
    const { t } = useTranslation()
    const joinData = DataByName(data, blocks.form_join)
    const inviteData = DataByName(data, blocks.form_invitation)

    const isAllowJoin = joinData?.content.some((item) => item.type === 'form')
    const hasForm =
        isAllowJoin || inviteData?.content.some((item) => item.type === 'form')

    const Block = (
        <BlockByData
            url={data.url}
            uri={data.uri}
            contentOnly={true}
            data={joinData || inviteData}
            formProps={{ hide_errors: true, button_full_width: true }}
        />
    )

    if (!hasForm) {
        return Block
    }

    const content = isWeb ? (
        <View className="flex-col justify-center pt-14 lg:pt-0 w-full ">
            <View className={`justify-center w-full mx-auto lg:flex-row border-x-0 border-guide/20 border-dashed divide-x-0 divide-dashed divide-guide/20 ${appSetting('layout', 'max_width_content')}`}>

                <View className=" text-center lg:text-start items-center lg:items-start flex-auto p-4 sm:p-8 md:p-12 gap-4 w-full mx-auto">

                    {appStatic('join_text')}
                    <H1
                        className="text-4xl sm:text-5xl tracking-tight font-bold text-foreground text-balance"
                    >
                        {isAllowJoin
                            ? t('create_account_page_title')
                            : t('create_account_page_title_request_invite')}
                    </H1>
                    <Text
                        accessible={true}
                        accessibilityRole="text"
                        className=" text-secondary-foreground text-base sm:text-lg lg:text-xl text-pretty"
                    >
                        {isAllowJoin
                            ? t('create_account_page_text')
                            : t('create_account_page_text_request_invite')}
                    </Text>

                </View>
                <PageContent>{Block}</PageContent>
            </View>
            <MenuFooter
                cntClasses="flex w-full items-center border-t border-border/40 justify-center flex-row flex-wrap gap-4 p-4"
                variant="ghost"
                size="sm"
                itemClassName=""
            />
        </View>
    ) : (
        <View className="w-full flex-col lg:flex-row gap-y-4 mx-auto ">

            <PageContent>{Block}</PageContent>
            <MenuFooter
                cntClasses="flex w-full items-center border-t border-border/40 justify-center flex-row flex-wrap gap-4 p-4"
                variant="ghost"
                size="sm"
                itemClassName=""
            />
        </View>
    )

    return (
        <Page data={data}>{content}</Page>
    )
}
