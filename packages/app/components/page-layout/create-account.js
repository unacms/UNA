import { View, Row } from 'app/design/view'
import { BlockByName, DataByName, BlockByData } from 'app/components/block'
import { Text } from 'app/design/typography'
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from 'app/ui/molecules/card'
import Link from 'app/ui/atoms/link'
import { Platform } from 'react-native'
import { appStatic } from 'app/lib/app-static'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import AuthPanel from 'app/ui/molecules/auth'
import { appSetting } from 'app/lib/util'
import ScrollList from 'app/ui/molecules/scroll_list'
import MenuFooter from 'app/components/nav/menu-footer'
import AnimatedView from 'app/ui/atoms/animated-view'

const isWeb = Platform.OS === 'web'

function PageContent({ children }) {
    const { t } = useTranslation()
    return (
        <View className="w-full justify-center lg:w-1/2 p-4 sm:p-8 md:p-12 p-6 ">

            <AnimatedView className="gap-4" direction="up" delay={200}>
                <Card padding="p-6 max-w-xl w-full mx-auto">
                    <CardHeader>
                        <CardTitle>{t('create_account_page_caption')}</CardTitle>
                        {isWeb && (
                            <CardDescription>
                                {t('create_account_page_caption2')}
                            </CardDescription>
                        )}
                    </CardHeader>
                    <CardContent>{children}</CardContent>
                    <CardFooter>
                        <AuthPanel
                            createAccountLink={false}
                            loginLink={!isWeb}
                            showSeparator={true}
                        />
                    </CardFooter>
                </Card>

                <Row className=" mx-auto gap-1 text-base justify-center items-center text-center">
                    <Text className="text-label-secondary">
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
            </AnimatedView>
        </View>
    )
}

export default function PageLayout(props) {
    const { t } = useTranslation()
    const refer = useRef()

    const joinData = DataByName(props.data, props.blocks.form_join)
    const inviteData = DataByName(props.data, props.blocks.form_invitation)

    const isAllowJoin = joinData?.content.some((item) => item.type === 'form')
    const hasForm =
        isAllowJoin || inviteData?.content.some((item) => item.type === 'form')

    const Block = (
        <BlockByData
            url={props.data.url}
            uri={props.data.uri}
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
            <View className={`justify-center w-full mx-auto lg:flex-row border-x border-guide/20 border-dashed divide-x divide-dashed  divide-guide/20 ${appSetting('layout', 'max_width_content')}`}>

                <View className=" items-center lg:items-start flex-auto p-4 sm:p-8 md:p-12  w-full mx-auto">

                    {appStatic('join_text')}
                    <View className="text-center items-center justify-center lg:items-start gap-6">
                        <Text
                            accessible={true}
                            accessibilityRole="header"
                            aria-level={1}
                            className="text-4xl sm:text-5xl tracking-tight font-bold text-label-primary text-balance"
                        >
                            {isAllowJoin
                                ? t('create_account_page_title')
                                : t('create_account_page_title_request_invite')}
                        </Text>
                        <Text
                            accessible={true}
                            accessibilityRole="text"
                            className=" tracking-tight text-label-secondary text-base sm:text-lg lg:text-xl"
                        >
                            {isAllowJoin
                                ? t('create_account_page_text')
                                : t('create_account_page_text_request_invite')}
                        </Text>
                    </View>
                </View>
                <PageContent>{Block}</PageContent>


            </View>
            <MenuFooter
                cntClasses="flex w-full items-center border-t border-border/60 justify-center flex-row flex-wrap gap-3 p-3"
                variant="ghost"
                size="sm"
                itemClassName=""
            />
        </View>
    ) : (
        <View className="w-full flex-col lg:flex-row gap-y-4 mx-auto ">

            <PageContent>{Block}</PageContent>
            <MenuFooter
                cntClasses="flex w-full items-center border-t border-border/60 justify-center flex-row flex-wrap gap-2 p-3 mt-3"
                variant="ghost"
                size="sm"
                itemClassName="text-sm p-1"
            />
        </View>
    )

    return (
        <ScrollList
            refer={refer}
            content={content}
            pageData={props.data}
            headerHeight={isWeb ? 0 : 48}
            contentType="ScrollList"
        />
    )
}
