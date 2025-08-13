import { View } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from 'app/ui/molecules/card' 
import { appSetting } from 'app/lib/util'
import { Platform } from 'react-native'
import { appStatic } from 'app/lib/app-static'
import AuthPanel from 'app/ui/molecules/auth'
import { useRef } from 'react';
import { BlockByName } from 'app/components/block'
import MenuFooter from 'app/components/nav/menu-footer';
import AnimatedView from 'app/ui/atoms/animated-view';
import { useTranslation } from 'react-i18next'
import ScrollList from 'app/ui/molecules/scroll_list'

/**
 * Renders the login splash screen with adaptive layouts for web and mobile platforms.
 *
 * Displays an illustration, splash text, and a login form with options for password recovery and account creation. Layout and styling adjust based on platform and theme. Footer content is included at the bottom of the screen.
 *
 * @param {object} props - Component properties, including optional login form data.
 */

const TABLET_MODE_FROM = appSetting('layout', 'tablet_mode_from');

function PageContent(props) {
    const { t } = useTranslation()
    return (<Card>
        <CardHeader>
            <CardTitle>{t("splash_page_login")}</CardTitle>
            <CardDescription>{t("splash_page_login2")}</CardDescription>
        </CardHeader>
        <CardContent>
        <BlockByName
            name="system:login_form"
            contentOnly={true}
            data={props.data}
            formProps={{ hide_errors: true, button_full_width: true }}
        />
        </CardContent>
        <CardFooter>
        <AuthPanel loginLink={false} />
        </CardFooter>
    </Card>);
}

export default function Splash(props) {
    const isWeb = Platform.OS == 'web'
    const refer = useRef();
    const content = !isWeb ? (
        <><View className="w-full gap-y-8 mx-auto p-3 pt-16">
            {appStatic('splash_text')}
            <PageContent {...props} />
        </View>
            <MenuFooter cntClasses="w-full flex-row flex-wrap opacity-80 h-16 items-center justify-center" />
        </>

    ) : (
        <View className={`flex-col justify-center pt-16 ${TABLET_MODE_FROM}:pt-0 web:min-h-[calc(100vh-16rem)] w-full absolute`}>
            <View className="w-full lg:flex-row mx-auto my-auto max-w-7xl ">
                {appStatic('splash_text')}
                <View className="flex-col-reverse lg:flex-col max-w-xl w-full flex-auto mx-auto p-4 sm:p-8 my-auto">
                    <AnimatedView direction="up">
                        <View>
                            <View className="absolute top-4 flex shadow rounded-3xl w-full h-full bg-neutral-500 dark:bg-black blur-lg opacity-20 dark:opacity-50"></View>
                            <PageContent {...props} />
                        </View>
                    </AnimatedView>
                </View>
            </View>
            <MenuFooter cntClasses="w-full flex-row flex-wrap opacity-80 h-16 items-center justify-center" />
        </View>
    )


    return <ScrollList
        refer={refer}
        content={content}
        pageData={props.data}
        headerHeight={isWeb ? 0 : 64}
        contentType="ScrollList"
    />
}