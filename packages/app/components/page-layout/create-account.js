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
import MenuFooter from 'app/components/nav/menu-footer'
import Page from 'app/ui/molecules/page'
import Html from 'app/ui/atoms/html';
import { Icon } from 'app/ui/atoms/icon'

const isWeb = Platform.OS === 'web'

function PageContent({ children }) {
    const { t } = useTranslation()
    return (
        <View className="w-full justify-center max-w-sm gap-4 mx-auto">
     
            
                        
                            {children}
                            <AuthPanel showSeparator={true} createAccountLink={false} loginLink={false} />
                            <Html customClassName="text-xs text-center text-muted-foreground" data={t('create_account_page_terms')}/>
                    
                    <View className="sm:px-6">
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
                        
                        
                    </View>
                


            
        </View>
    )
}

export default function PageLayout({ data, blocks, pageClasses }) {
    const { t } = useTranslation()
    const { contentWidth, padding, gap } = pageClasses ?? {}
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
                <View 
                    className={`flex-1 justify-center w-full mx-auto lg:flex-row ${contentWidth} ${padding} ${gap}`}
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
            <MenuFooter />
        </Page>
    )
}
