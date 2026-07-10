import { View } from 'app/design/view';
import { appStatic } from 'app/lib/app-static';
import Page from 'app/ui/molecules/page';
import { responsiveClasses } from 'app/lib/responsive-classes';
import { appSetting, getPageContentWidth } from 'app/lib/util'

export default function PageLayout({ children, data, layoutName }) {
    const config = data?.config;
    const paddingClass = responsiveClasses('padding', config?.padding);
    const gapClass = responsiveClasses('gap', config?.gap);

    return (
        <Page data={data}>
            <View className={`${appSetting('layout', 'max_width')}`}>
                <View className={`${getPageContentWidth(layoutName)} ${appSetting('layout', 'page_content_stack')} ${paddingClass} ${gapClass} mx-auto`}>
                    {children}
                </View>
            </View>
            {appStatic('components_footer')}
        </Page>
    );
}
