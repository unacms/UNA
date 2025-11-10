import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from 'app/ui/molecules/card'
import { appSetting } from 'app/lib/util'
import { Platform } from 'react-native'
import { appStatic } from 'app/lib/app-static'
import AuthPanel from 'app/ui/molecules/auth'
import { useRef } from 'react'
import { BlockByName } from 'app/components/block'
import MenuFooter from 'app/components/nav/menu-footer'
import AnimatedView from 'app/ui/atoms/animated-view'
import { useTranslation } from 'react-i18next'
import ScrollList from 'app/ui/molecules/scroll_list'
import Link from 'app/ui/atoms/link'

/**
 * Renders the login splash screen with adaptive layouts for web and mobile platforms.
 *
 * Displays an illustration, splash text, and a login form with options for password recovery and account creation. Layout and styling adjust based on platform and theme. Footer content is included at the bottom of the screen.
 *
 * @param {object} props - Component properties, including optional login form data.
 */

function PageContent(props) {
    const { t } = useTranslation()
    return (
        <View className="w-full justify-center lg:w-1/2 p-4 sm:p-8 md:p-12 p-6 ">

        <AnimatedView className="gap-4" direction="up" delay={200}>
            <Card padding="p-6 max-w-xl w-full mx-auto">
                <CardHeader>
                    <CardTitle>
                        {t('login_modal_title')} {t('app_name')}
                    </CardTitle>
                    <CardDescription>{t('splash_page_login')}</CardDescription>
                </CardHeader>
                <CardContent className="gap-4">
                    <BlockByName
                        name="system:login_form"
                        contentOnly={true}
                        data={props.data}
                        formProps={{
                            hide_errors: true,
                            button_full_width: true,
                        }}
                    />
                </CardContent>
                <CardFooter>
                    <AuthPanel forgotPasswordLink={true} showSeparator={true} />
                </CardFooter>
            </Card>

            <Row 
                className="mx-auto gap-1 text-base justify-center items-center text-center"
                accessibilityRole="text"
                accessibilityLabel={`${t('splash_page_login2')} ${t('splash_page_new_account')}`}
            >
                <Text 
                    className="text-label-secondary"
                    accessibilityRole="text"
                >
                    {t('splash_page_login2')}
                </Text>
                <Link
                    variant="accent"
                    size="md"
                    href="/create-account"
                    haptics="Medium"
                >
                    {t('splash_page_new_account')}
                </Link>
            </Row>
        </AnimatedView>
        </View>
    )
}

export default function Splash(props) {
    const isWeb = Platform.OS == 'web'
    const refer = useRef()
    const content = !isWeb ? (
        <View className="flex-col justify-center w-full ">
            <View className={`justify-center w-full mx-auto lg:flex-row  border-x border-guide/20 border-dashed divide-x divide-dashed  divide-guide/0 ${appSetting('layout', 'max_width_content')}`}>
                {appStatic('splash_text')}
                <PageContent {...props} />
                
               
            </View>
            <MenuFooter
                cntClasses="flex w-full items-center border-t border-border/60 justify-center flex-row flex-wrap gap-3 p-3"
                variant="ghost"
                size="sm"
                itemClassName=""
            />
        </View>
    ) : (
        <View className="flex-col justify-center pt-14 lg:pt-0 w-full ">
            <View className={`justify-center w-full mx-auto lg:flex-row border-x border-guide/20 border-dashed divide-x divide-dashed  divide-guide/20 ${appSetting('layout', 'max_width_content')}`}>
                {appStatic('splash_text')}
                <PageContent {...props} />
                
                
            </View>
            <MenuFooter
                cntClasses="flex w-full items-center border-t border-border/60 justify-center flex-row flex-wrap gap-3 p-3"
                variant="ghost"
                size="sm"
                itemClassName=""
            />
        </View>
    )

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
