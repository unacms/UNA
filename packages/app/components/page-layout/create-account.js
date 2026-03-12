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
    CardIcon,
} from 'app/ui/molecules/card'
import Link from 'app/ui/atoms/link'
import { Platform } from 'react-native'
import { appStatic } from 'app/lib/app-static'
import { useTranslation } from 'react-i18next'
import AuthPanel from 'app/ui/molecules/auth'
import { appSetting } from 'app/lib/util'
import MenuFooter from 'app/components/nav/menu-footer'
import Page from 'app/ui/molecules/page'
import Html from 'app/ui/atoms/html';
import { Icon } from 'app/ui/atoms/icon'

const isWeb = Platform.OS === 'web'

function PageContent({ children }) {
    const { t } = useTranslation()
    return (
        <View className="w-full justify-center max-w-sm xl:max-w-md mx-auto">
            <View>
                <Card role="form"
                    titleId="signup-card-title"
                    aria-describedby="signup-card-description"
                    className="sm:py-6 gap-4 sm:gap-6">
                    <CardHeader className="items-center sm:px-6">
                        <CardIcon id="signup-card-icon">
                            <Icon icon="UserRoundPlus" width={32} height={32} className="w-6 h-6 sm:w-8 sm:h-8" />
                        </CardIcon>
                        <CardTitle className="text-center" id="signup-card-title">{t('create_account_page_caption')}</CardTitle>
                        <CardDescription className="text-center">
                            {t('create_account_page_caption2')}
                        </CardDescription>

                    </CardHeader>
                    <CardContent className="sm:px-6 gap-4">
                        
                            {children}
                            <AuthPanel showSeparator={true} createAccountLink={false} loginLink={false} />
                            <Html customClassName="text-xs text-center text-muted-foreground" data={t('create_account_page_terms')}/>
                    </CardContent>
                    <CardFooter className="sm:px-6">
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
                        
                        
                    </CardFooter>
                </Card>


            </View>
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

    return (
        <Page data={data}>
            {isWeb ? (
                <View className={`flex-1 gap-4 sm:gap-6 p-4 justify-center w-full mx-auto lg:flex-row ${appSetting(
                        'layout',
                        'max_width_content',
                    )}`}
                >
                    <View className="items-center lg:items-start relative my-auto flex-auto w-full p-4 gap-4">
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
                            className="text-muted-foreground text-center lg:text-start text-base sm:text-lg text-pretty"
                        >
                            {isAllowJoin
                                ? t('create_account_page_text')
                                : t('create_account_page_text_request_invite')}
                        </Text>
                    </View>
                    <PageContent>{Block}</PageContent>
                </View>
            ) : (
                <View className="flex-1">
                    <PageContent>{Block}</PageContent>
                </View>
            )}
      <MenuFooter
                cntClasses='flex w-full items-center border-t border-border/60 justify-center flex-row flex-wrap gap-3 p-4 min-h-14'
            />
        </Page>
    )
}
