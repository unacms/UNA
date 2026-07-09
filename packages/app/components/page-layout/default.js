import { View } from 'app/design/view';
import { appStatic } from 'app/lib/app-static'
import Page from 'app/ui/molecules/page'
import { appSetting } from 'app/lib/util'

export default function PageLayout({ children, data, layoutName }) {
    return (
        <Page data={data}>
            <View className={`${appSetting('layout', 'max_width')}`}>
                <View className={`${appSetting('layout', 'page_content_width')} ${appSetting('layout', 'page_content_padding')} ${appSetting('layout', 'page_content_gap')} mx-auto`}>
                    {children}
                </View>
            </View>
            {appStatic('components_footer')}
        </Page>
    )
}
